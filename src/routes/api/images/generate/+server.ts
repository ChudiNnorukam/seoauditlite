import { json, type RequestHandler } from '@sveltejs/kit';
import { generateImageSync } from '$lib/image-generation/replicate';
import {
  generatePromptFromTemplate,
  type ImageTemplate,
  type TemplateConfig,
} from '$lib/image-generation/templates';

interface GenerateRequest {
  template: ImageTemplate;
  config: TemplateConfig;
  apiKey: string;
}

interface GenerateResponse {
  success: boolean;
  imageId?: string;
  imageUrl?: string;
  status?: 'pending' | 'completed' | 'failed';
  error?: string;
}

const VALID_TEMPLATES: ImageTemplate[] = ['linkedin-thumbnail', 'blog-header', 'product-card'];

function validateApiKey(apiKey: string): boolean {
  const validKey = process.env.IMAGE_API_KEY;
  if (!validKey) {
    console.warn('IMAGE_API_KEY not configured - API access disabled');
    return false;
  }
  return apiKey === validKey;
}

export const POST: RequestHandler = async ({ request }): Promise<Response> => {
  // Check if Replicate is configured
  if (!process.env.REPLICATE_API_TOKEN) {
    const response: GenerateResponse = {
      success: false,
      error: 'Image generation service not configured',
    };
    return json(response, { status: 503 });
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    const response: GenerateResponse = {
      success: false,
      error: 'Invalid JSON body',
    };
    return json(response, { status: 400 });
  }

  // Validate API key
  if (!body.apiKey || !validateApiKey(body.apiKey)) {
    const response: GenerateResponse = {
      success: false,
      error: 'Invalid or missing API key',
    };
    return json(response, { status: 401 });
  }

  // Validate template
  if (!body.template || !VALID_TEMPLATES.includes(body.template)) {
    const response: GenerateResponse = {
      success: false,
      error: `Invalid template. Valid options: ${VALID_TEMPLATES.join(', ')}`,
    };
    return json(response, { status: 400 });
  }

  // Validate config
  if (!body.config || !body.config.title) {
    const response: GenerateResponse = {
      success: false,
      error: 'Missing required config.title',
    };
    return json(response, { status: 400 });
  }

  try {
    const prompt = generatePromptFromTemplate(body.template, body.config);

    // Use sync generation for simplicity (returns when complete)
    const result = await generateImageSync({
      prompt,
      width: 1200,
      height: 630,
    });

    if (result.status === 'succeeded' && result.imageUrl) {
      const response: GenerateResponse = {
        success: true,
        imageId: result.replicateId,
        imageUrl: result.imageUrl,
        status: 'completed',
      };
      return json(response, { status: 200 });
    } else {
      const response: GenerateResponse = {
        success: false,
        status: 'failed',
        error: result.error ?? 'Image generation failed',
      };
      return json(response, { status: 500 });
    }
  } catch (error) {
    console.error('Image generation error:', error);
    const response: GenerateResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    };
    return json(response, { status: 500 });
  }
};
