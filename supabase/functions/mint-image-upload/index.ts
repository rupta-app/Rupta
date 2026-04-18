import { requireUserId } from '../_shared/auth.ts';
import {
  cloudflareFetch,
  CORS_HEADERS,
  errorResponse,
  jsonResponse,
  readCloudflareEnv,
} from '../_shared/cloudflare.ts';

type Purpose = 'avatar' | 'group-avatar' | 'completion-photo';

const VALID_PURPOSES: Purpose[] = ['avatar', 'group-avatar', 'completion-photo'];

type DirectUploadResult = {
  id: string;
  uploadURL: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  let userId: string;
  try {
    userId = await requireUserId(req);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Unauthorized', 401);
  }

  let purpose: Purpose = 'completion-photo';
  try {
    const body = (await req.json().catch(() => ({}))) as { purpose?: string };
    if (body.purpose && VALID_PURPOSES.includes(body.purpose as Purpose)) {
      purpose = body.purpose as Purpose;
    }
  } catch {
    // ignore body parse errors; use default purpose
  }

  try {
    const { accountId, apiToken } = readCloudflareEnv();
    const form = new FormData();
    form.append('requireSignedURLs', 'false');
    form.append('metadata', JSON.stringify({ userId, purpose }));

    const result = await cloudflareFetch<DirectUploadResult>(
      `/accounts/${accountId}/images/v2/direct_upload`,
      { method: 'POST', body: form, apiToken },
    );

    return jsonResponse({ id: result.id, uploadURL: result.uploadURL });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Upload URL generation failed', 500);
  }
});
