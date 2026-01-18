import { json, type RequestHandler } from '@sveltejs/kit';
import { updateOgImageStatus, getOgImageByReplicateId } from '$lib/server/image-store';

// RunPod webhook payload format
interface RunPodWebhookPayload {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  output?: {
    image_url?: string;
    images?: string[];
  };
  error?: string;
}

function extractImageUrl(output: RunPodWebhookPayload['output']): string | undefined {
  if (!output) return undefined;
  if (output.image_url) return output.image_url;
  if (output.images && output.images.length > 0) return output.images[0];
  return undefined;
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  let payload: RunPodWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!payload.id) {
    return json({ error: 'Missing job ID' }, { status: 400 });
  }

  // Check if we have a record for this job
  const existing = await getOgImageByReplicateId(payload.id);
  if (!existing) {
    console.log(`Webhook received for unknown job: ${payload.id}`);
    return json({ received: true, message: 'Unknown job ID' }, { status: 200 });
  }

  try {
    const imageUrl = extractImageUrl(payload.output);

    if (payload.status === 'COMPLETED' && imageUrl) {
      await updateOgImageStatus(payload.id, 'completed', imageUrl);
      console.log(`Image generation completed for audit: ${existing.audit_id}`);
    } else if (payload.status === 'FAILED' || payload.status === 'CANCELLED') {
      await updateOgImageStatus(
        payload.id,
        'failed',
        undefined,
        payload.error ?? `Generation ${payload.status.toLowerCase()}`
      );
      console.log(`Image generation failed for audit: ${existing.audit_id} - ${payload.error}`);
    } else if (payload.status === 'IN_PROGRESS') {
      await updateOgImageStatus(payload.id, 'processing');
    }

    return json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing RunPod webhook:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
};
