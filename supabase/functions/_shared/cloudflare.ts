// Shared helpers for Cloudflare edge functions. Deno runtime.

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

export function readCloudflareEnv() {
  const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
  if (!accountId) throw new Error('CLOUDFLARE_ACCOUNT_ID is not set');
  if (!apiToken) throw new Error('CLOUDFLARE_API_TOKEN is not set');
  return { accountId, apiToken };
}

export async function cloudflareFetch<T>(
  path: string,
  init: RequestInit & { apiToken: string },
): Promise<T> {
  const { apiToken, headers, ...rest } = init;
  const res = await fetch(`${CF_API_BASE}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...(headers ?? {}),
    },
  });
  const body = (await res.json()) as {
    success?: boolean;
    errors?: { code: number; message: string }[];
    result?: T;
  };
  if (!res.ok || !body.success || !body.result) {
    const msg = body.errors?.[0]?.message ?? `Cloudflare API error (${res.status})`;
    throw new Error(msg);
  }
  return body.result;
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}
