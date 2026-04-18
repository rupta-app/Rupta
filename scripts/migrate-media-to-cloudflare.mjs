#!/usr/bin/env node
/**
 * One-shot migration: move Supabase Storage media to Cloudflare Images / Stream,
 * then rewrite DB references (profiles.avatar_url, groups.avatar_url,
 * quest_media.media_url) to store the Cloudflare ID in place of the URL.
 *
 * Legacy URLs are detected via `http(s)://` prefix. Cloudflare IDs are opaque
 * tokens with no scheme, so already-migrated rows are skipped automatically.
 *
 * Run:   node --env-file=.env scripts/migrate-media-to-cloudflare.mjs
 *
 * Required keys in .env:
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_API_TOKEN
 *
 * Optional env:
 *   MIGRATION_BATCH_SIZE   (default: 50)
 *   MIGRATION_DRY_RUN      (set to any value to skip DB writes)
 *   MIGRATION_TARGET       one of: profiles | groups | media | all (default: all)
 */
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const {
  SUPABASE_SERVICE_ROLE_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN,
} = process.env;

const DRY_RUN = !!process.env.MIGRATION_DRY_RUN;
const BATCH_SIZE = Number(process.env.MIGRATION_BATCH_SIZE ?? 50);
const TARGET = (process.env.MIGRATION_TARGET ?? 'all').toLowerCase();

for (const [k, v] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN,
})) {
  if (!v) {
    console.error(`Missing required env: ${k}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const CF_API = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}`;

const isLegacyUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);

async function downloadToBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
  return { buf, contentType };
}

async function uploadImageToCloudflare(url, metadata) {
  const { buf, contentType } = await downloadToBlob(url);
  const form = new FormData();
  form.append('file', new Blob([buf], { type: contentType }), 'upload');
  form.append('requireSignedURLs', 'false');
  if (metadata) form.append('metadata', JSON.stringify(metadata));

  const res = await fetch(`${CF_API}/images/v1`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
    body: form,
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(`CF Images upload failed: ${JSON.stringify(body)}`);
  }
  return body.result.id;
}

async function uploadVideoToCloudflare(url, metadata) {
  const copyRes = await fetch(`${CF_API}/stream/copy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      meta: metadata ?? {},
    }),
  });
  const body = await copyRes.json();
  if (!copyRes.ok || !body.success) {
    throw new Error(`CF Stream copy failed: ${JSON.stringify(body)}`);
  }
  return body.result.uid;
}

async function migrateTable({ label, table, column, extraColumns = [], uploader }) {
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(`id,${column}${extraColumns.length ? ',' + extraColumns.join(',') : ''}`)
      .not(column, 'is', null)
      .range(offset, offset + BATCH_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      const value = row[column];
      if (!isLegacyUrl(value)) {
        skipped++;
        continue;
      }
      try {
        const id = await uploader(row);
        if (!DRY_RUN) {
          const { error: upErr } = await supabase
            .from(table)
            .update({ [column]: id })
            .eq('id', row.id);
          if (upErr) throw upErr;
        }
        migrated++;
        console.log(`[${label}] ${row.id} -> ${id}`);
      } catch (e) {
        failed++;
        console.error(`[${label}] ${row.id} FAILED:`, e instanceof Error ? e.message : e);
      }
    }

    offset += BATCH_SIZE;
  }

  console.log(`[${label}] done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
}

async function main() {
  console.log(`Starting media migration. DRY_RUN=${DRY_RUN} TARGET=${TARGET}`);

  if (TARGET === 'all' || TARGET === 'profiles') {
    await migrateTable({
      label: 'profiles',
      table: 'profiles',
      column: 'avatar_url',
      uploader: (row) =>
        uploadImageToCloudflare(row.avatar_url, { kind: 'avatar', profileId: row.id }),
    });
  }

  if (TARGET === 'all' || TARGET === 'groups') {
    await migrateTable({
      label: 'groups',
      table: 'groups',
      column: 'avatar_url',
      uploader: (row) =>
        uploadImageToCloudflare(row.avatar_url, { kind: 'group-avatar', groupId: row.id }),
    });
  }

  if (TARGET === 'all' || TARGET === 'media') {
    await migrateTable({
      label: 'quest_media',
      table: 'quest_media',
      column: 'media_url',
      extraColumns: ['media_type', 'completion_id'],
      uploader: (row) => {
        const meta = { completionId: row.completion_id, mediaId: row.id };
        if (row.media_type === 'video') {
          return uploadVideoToCloudflare(row.media_url, meta);
        }
        return uploadImageToCloudflare(row.media_url, { ...meta, kind: 'completion-photo' });
      },
    });
  }

  console.log('Migration complete.');
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
