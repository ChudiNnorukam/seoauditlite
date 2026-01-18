import type { AuditResult } from '$lib/auditing/schema';
import { env } from '$env/dynamic/private';
import { generateImage } from '$lib/image-generation/replicate';
import { generateSeoAuditPrompt } from '$lib/image-generation/templates';
import { createOgImageRecord } from './image-store';

function getWebhookUrl(): string {
  const appUrl = env.PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('PUBLIC_APP_URL environment variable is not set');
  }
  return `${appUrl}/api/images/webhook`;
}

export async function queueOgImageGeneration(audit: AuditResult): Promise<void> {
  // Check if RunPod is configured
  if (!env.RUNPOD_API_KEY) {
    console.log('Skipping OG image generation: RUNPOD_API_KEY not configured');
    return;
  }

  try {
    const prompt = generateSeoAuditPrompt(audit);
    const webhookUrl = getWebhookUrl();

    const result = await generateImage({
      prompt,
      width: 1200,
      height: 630,
      webhookUrl,
    });

    await createOgImageRecord(audit.audit_id, prompt, result.replicateId);

    console.log(`Queued OG image generation for audit ${audit.audit_id}: ${result.replicateId}`);
  } catch (error) {
    console.error(`Failed to queue OG image for audit ${audit.audit_id}:`, error);
    throw error;
  }
}
