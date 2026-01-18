import type { RequestHandler } from '@sveltejs/kit';
import { getAudit } from '$lib/server/audit-store';
import { getAuditOgImageUrl } from '$lib/server/image-store';
import { composeOgImageWithFallback } from '$lib/image-generation/compose';
import { extractAuditImageData } from '$lib/image-generation/templates';

export const GET: RequestHandler = async ({ params }): Promise<Response> => {
  const { auditId } = params;

  if (!auditId) {
    return new Response('Missing audit ID', { status: 400 });
  }

  // Fetch the audit data
  const audit = await getAudit(auditId);
  if (!audit) {
    return new Response('Audit not found', { status: 404 });
  }

  // Get the AI-generated background URL (may be null if not yet generated)
  let backgroundUrl: string | null = null;
  try {
    backgroundUrl = await getAuditOgImageUrl(auditId);
  } catch {
    // Continue with fallback background
  }

  // Extract data needed for the image
  const imageData = extractAuditImageData(audit);

  try {
    // Compose the final image with text overlay
    const imageBuffer = await composeOgImageWithFallback(backgroundUrl, imageData);

    // Return the image with caching headers
    return new Response(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // 1hr client, 24hr CDN
        'CDN-Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Failed to compose OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
};
