import type { AuditResult } from '$lib/auditing/schema';
import { generateImage } from '$lib/image-generation/replicate';
import { generateSeoAuditPrompt } from '$lib/image-generation/templates';
import { createOgImageRecord } from './image-store';

function getWebhookUrl(): string {
  const appUrl = process.env.PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('PUBLIC_APP_URL environment variable is not set');
  }
  return `${appUrl}/api/images/webhook`;
}

export async function queueOgImageGeneration(audit: AuditResult): Promise<void> {
  // Check if Replicate is configured
  if (!process.env.REPLICATE_API_TOKEN) {
    console.log('Skipping OG image generation: REPLICATE_API_TOKEN not configured');
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
