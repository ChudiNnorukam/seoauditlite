// RunPod API client for Flux image generation
// Renamed file kept for backwards compatibility with imports

const RUNPOD_FLUX_SCHNELL_ENDPOINT = 'https://api.runpod.ai/v2/black-forest-labs-flux-1-schnell';

function getApiKey(): string {
  const token = process.env.RUNPOD_API_KEY;
  if (!token) {
    throw new Error('RUNPOD_API_KEY environment variable is not set');
  }
  return token;
}

export interface ImageGenerationInput {
  prompt: string;
  width?: number;
  height?: number;
  webhookUrl?: string;
}

export type ImageStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface ImageGenerationResult {
  replicateId: string; // Kept for backwards compatibility, now stores RunPod job ID
  status: ImageStatus;
  imageUrl?: string;
  error?: string;
}

interface RunPodResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  output?: {
    image_url?: string;
    images?: string[];
  };
  error?: string;
}

function normalizeRunPodStatus(status: string): ImageStatus {
  switch (status) {
    case 'IN_QUEUE':
      return 'starting';
    case 'IN_PROGRESS':
      return 'processing';
    case 'COMPLETED':
      return 'succeeded';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'canceled';
    default:
      return 'failed';
  }
}

function extractImageUrl(output: RunPodResponse['output']): string | undefined {
  if (!output) return undefined;
  if (output.image_url) return output.image_url;
  if (output.images && output.images.length > 0) return output.images[0];
  return undefined;
}

export async function generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  const apiKey = getApiKey();

  const response = await fetch(`${RUNPOD_FLUX_SCHNELL_ENDPOINT}/run`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        prompt: input.prompt,
        width: input.width ?? 1200,
        height: input.height ?? 630,
        num_inference_steps: 4,
        guidance: 3.5,
      },
      webhook: input.webhookUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod API error: ${response.status} - ${errorText}`);
  }

  const data: RunPodResponse = await response.json();

  return {
    replicateId: data.id,
    status: normalizeRunPodStatus(data.status),
    imageUrl: extractImageUrl(data.output),
    error: data.error,
  };
}

export async function getImageStatus(jobId: string): Promise<ImageGenerationResult> {
  const apiKey = getApiKey();

  const response = await fetch(`${RUNPOD_FLUX_SCHNELL_ENDPOINT}/status/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod API error: ${response.status} - ${errorText}`);
  }

  const data: RunPodResponse = await response.json();

  return {
    replicateId: data.id,
    status: normalizeRunPodStatus(data.status),
    imageUrl: extractImageUrl(data.output),
    error: data.error,
  };
}

export async function generateImageSync(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  const apiKey = getApiKey();

  const response = await fetch(`${RUNPOD_FLUX_SCHNELL_ENDPOINT}/runsync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: {
        prompt: input.prompt,
        width: input.width ?? 1200,
        height: input.height ?? 630,
        num_inference_steps: 4,
        guidance: 3.5,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RunPod API error: ${response.status} - ${errorText}`);
  }

  const data: RunPodResponse = await response.json();
  const imageUrl = extractImageUrl(data.output);

  return {
    replicateId: data.id,
    status: imageUrl ? 'succeeded' : normalizeRunPodStatus(data.status),
    imageUrl,
    error: data.error,
  };
}
