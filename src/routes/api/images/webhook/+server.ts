import { json, type RequestHandler } from '@sveltejs/kit';
import { updateOgImageStatus, getOgImageByReplicateId } from '$lib/server/image-store';

interface ReplicateWebhookPayload {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string[];
  error?: string;
  created_at: string;
  completed_at?: string;
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  let payload: ReplicateWebhookPayload;

  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!payload.id) {
    return json({ error: 'Missing prediction ID' }, { status: 400 });
  }

  // Check if we have a record for this prediction
  const existing = await getOgImageByReplicateId(payload.id);
  if (!existing) {
    console.log(`Webhook received for unknown prediction: ${payload.id}`);
    return json({ received: true, message: 'Unknown prediction ID' }, { status: 200 });
  }

  try {
    if (payload.status === 'succeeded' && payload.output?.[0]) {
      await updateOgImageStatus(payload.id, 'completed', payload.output[0]);
      console.log(`Image generation completed for audit: ${existing.audit_id}`);
    } else if (payload.status === 'failed' || payload.status === 'canceled') {
      await updateOgImageStatus(
        payload.id,
        'failed',
        undefined,
        payload.error ?? `Generation ${payload.status}`
      );
      console.log(`Image generation failed for audit: ${existing.audit_id} - ${payload.error}`);
    } else if (payload.status === 'processing') {
      await updateOgImageStatus(payload.id, 'processing');
    }

    return json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Replicate webhook:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
};
