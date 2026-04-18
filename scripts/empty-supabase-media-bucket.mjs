#!/usr/bin/env node
/**
 * One-shot cleanup: empty the `completion-media` Supabase Storage bucket after
 * media has been migrated to Cloudflare Images/Stream.
 *
 * Safety: refuses to run if any DB row still references an http(s) URL.
 *
 * Run:   node --env-file=.env scripts/empty-supabase-media-bucket.mjs
 * Dry run: DRY_RUN=1 node --env-file=.env scripts/empty-supabase-media-bucket.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const { SUPABASE_SERVICE_ROLE_KEY } = process.env;
const BUCKET = 'completion-media';
const DRY_RUN = !!process.env.DRY_RUN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function assertNoLegacyRefs() {
  const checks = [
    { table: 'profiles', column: 'avatar_url' },
    { table: 'groups', column: 'avatar_url' },
    { table: 'quest_media', column: 'media_url' },
  ];
  for (const { table, column } of checks) {
    const { count, error } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .like(column, 'http%');
    if (error) throw error;
    if ((count ?? 0) > 0) {
      throw new Error(
        `ABORT: ${table}.${column} still has ${count} rows with http URLs. Migration incomplete.`
      );
    }
    console.log(`[check] ${table}.${column}: 0 legacy URLs ✓`);
  }
}

async function listAllRecursive(prefix = '') {
  const all = [];
  const stack = [prefix];
  while (stack.length) {
    const dir = stack.pop();
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(dir, { limit: 1000, offset });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const entry of data) {
        const path = dir ? `${dir}/${entry.name}` : entry.name;
        // Supabase returns folders with null id/metadata
        if (entry.id === null && entry.metadata === null) {
          stack.push(path);
        } else {
          all.push(path);
        }
      }
      if (data.length < 1000) break;
      offset += 1000;
    }
  }
  return all;
}

async function removeInBatches(paths, size = 100) {
  let removed = 0;
  for (let i = 0; i < paths.length; i += size) {
    const batch = paths.slice(i, i + size);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw error;
    removed += batch.length;
    console.log(`[remove] ${removed}/${paths.length}`);
  }
  return removed;
}

async function main() {
  console.log(`Emptying bucket "${BUCKET}". DRY_RUN=${DRY_RUN}`);
  await assertNoLegacyRefs();

  const paths = await listAllRecursive('');
  console.log(`Found ${paths.length} objects.`);
  if (paths.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  if (DRY_RUN) {
    console.log('DRY RUN — first 20 paths:');
    paths.slice(0, 20).forEach((p) => console.log(`  ${p}`));
    return;
  }

  const removed = await removeInBatches(paths);
  console.log(`Done. Removed ${removed} objects.`);
}

main().catch((e) => {
  console.error('Cleanup failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
