import { requireUserId } from '../_shared/auth.ts';
import {
  cloudflareFetch,
  CORS_HEADERS,
  errorResponse,
  jsonResponse,
  readCloudflareEnv,
} from '../_shared/cloudflare.ts';

const MAX_DURATION_SECONDS = 60;

type DirectUploadResult = {
  uid: string;
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

  try {
    const { accountId, apiToken } = readCloudflareEnv();
    const result = await cloudflareFetch<DirectUploadResult>(
      `/accounts/${accountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxDurationSeconds: MAX_DURATION_SECONDS,
          meta: { userId, purpose: 'completion-video' },
        }),
        apiToken,
      },
    );

    return jsonResponse({ uid: result.uid, uploadURL: result.uploadURL });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Upload URL generation failed', 500);
  }
});
