import Replicate from 'replicate';

let replicateClient: Replicate | null = null;

function getClient(): Replicate {
  if (!replicateClient) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN environment variable is not set');
    }
    replicateClient = new Replicate({ auth: token });
  }
  return replicateClient;
}

export interface ImageGenerationInput {
  prompt: string;
  width?: number;
  height?: number;
  webhookUrl?: string;
}

export type ImageStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface ImageGenerationResult {
  replicateId: string;
  status: ImageStatus;
  imageUrl?: string;
  error?: string;
}

function normalizeStatus(status: string): ImageStatus {
  if (['starting', 'processing', 'succeeded', 'failed', 'canceled'].includes(status)) {
    return status as ImageStatus;
  }
  // Map 'aborted' and any other unknown status to 'failed'
  return 'failed';
}

const FLUX_SCHNELL_MODEL = 'black-forest-labs/flux-schnell';

export async function generateImage(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  const client = getClient();

  const prediction = await client.predictions.create({
    model: FLUX_SCHNELL_MODEL,
    input: {
      prompt: input.prompt,
      width: input.width ?? 1200,
      height: input.height ?? 630,
      num_outputs: 1,
      output_format: 'webp',
      output_quality: 90,
    },
    webhook: input.webhookUrl,
    webhook_events_filter: ['completed'],
  });

  const output = prediction.output as string[] | undefined;
  const errorMsg = typeof prediction.error === 'string' ? prediction.error : undefined;

  return {
    replicateId: prediction.id,
    status: normalizeStatus(prediction.status),
    imageUrl: output?.[0],
    error: errorMsg,
  };
}

export async function getImageStatus(replicateId: string): Promise<ImageGenerationResult> {
  const client = getClient();
  const prediction = await client.predictions.get(replicateId);

  const output = prediction.output as string[] | undefined;
  const errorMsg = typeof prediction.error === 'string' ? prediction.error : undefined;

  return {
    replicateId: prediction.id,
    status: normalizeStatus(prediction.status),
    imageUrl: Array.isArray(output) ? output[0] : undefined,
    error: errorMsg,
  };
}

export async function generateImageSync(input: ImageGenerationInput): Promise<ImageGenerationResult> {
  const client = getClient();

  const output = await client.run(FLUX_SCHNELL_MODEL, {
    input: {
      prompt: input.prompt,
      width: input.width ?? 1200,
      height: input.height ?? 630,
      num_outputs: 1,
      output_format: 'webp',
      output_quality: 90,
    },
  });

  const imageUrl = Array.isArray(output) ? output[0] : undefined;

  return {
    replicateId: 'sync',
    status: imageUrl ? 'succeeded' : 'failed',
    imageUrl: typeof imageUrl === 'string' ? imageUrl : undefined,
  };
}
