import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getAudit } from '$lib/server/audit-store';
import { queueOgImageGeneration } from '$lib/server/og-image-generator';

interface RegenerateRequest {
  auditId: string;
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  // Debug: log env var presence
  console.log('RUNPOD_API_KEY present:', !!env.RUNPOD_API_KEY);

  // Check if RunPod is configured
  if (!env.RUNPOD_API_KEY) {
    return json(
      { success: false, error: 'Image generation service not configured' },
      { status: 503 }
    );
  }

  let body: RegenerateRequest;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.auditId) {
    return json({ success: false, error: 'Missing auditId' }, { status: 400 });
  }

  // Fetch the audit
  const audit = await getAudit(body.auditId);
  if (!audit) {
    return json({ success: false, error: 'Audit not found' }, { status: 404 });
  }

  try {
    await queueOgImageGeneration(audit);
    return json({
      success: true,
      message: `Queued OG image generation for audit ${body.auditId}`,
    });
  } catch (error) {
    console.error('Failed to queue image generation:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to queue image generation',
      },
      { status: 500 }
    );
  }
};
