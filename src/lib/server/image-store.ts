import { getDb } from './db';
import { randomUUID } from 'crypto';

export type ImageStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface OgImageRecord {
  image_id: string;
  audit_id: string;
  prompt: string;
  replicate_id: string | null;
  image_url: string | null;
  status: ImageStatus;
  error_message: string | null;
  created_at: string;
}

export async function createOgImageRecord(
  auditId: string,
  prompt: string,
  replicateId: string
): Promise<OgImageRecord> {
  const db = await getDb();
  const imageId = randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO og_images (image_id, audit_id, prompt, replicate_id, status, created_at)
          VALUES (?, ?, ?, ?, 'pending', ?)`,
    args: [imageId, auditId, prompt, replicateId, now],
  });

  return {
    image_id: imageId,
    audit_id: auditId,
    prompt,
    replicate_id: replicateId,
    image_url: null,
    status: 'pending',
    error_message: null,
    created_at: now,
  };
}

export async function getOgImageByAuditId(auditId: string): Promise<OgImageRecord | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM og_images WHERE audit_id = ?',
    args: [auditId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    image_id: row.image_id as string,
    audit_id: row.audit_id as string,
    prompt: row.prompt as string,
    replicate_id: row.replicate_id as string | null,
    image_url: row.image_url as string | null,
    status: row.status as ImageStatus,
    error_message: row.error_message as string | null,
    created_at: row.created_at as string,
  };
}

export async function getOgImageByReplicateId(replicateId: string): Promise<OgImageRecord | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT * FROM og_images WHERE replicate_id = ?',
    args: [replicateId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    image_id: row.image_id as string,
    audit_id: row.audit_id as string,
    prompt: row.prompt as string,
    replicate_id: row.replicate_id as string | null,
    image_url: row.image_url as string | null,
    status: row.status as ImageStatus,
    error_message: row.error_message as string | null,
    created_at: row.created_at as string,
  };
}

export async function updateOgImageStatus(
  replicateId: string,
  status: ImageStatus,
  imageUrl?: string,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();

  await db.execute({
    sql: `UPDATE og_images
          SET status = ?, image_url = ?, error_message = ?
          WHERE replicate_id = ?`,
    args: [status, imageUrl ?? null, errorMessage ?? null, replicateId],
  });

  // Also update the audits table with the image URL if completed
  if (status === 'completed' && imageUrl) {
    const ogImage = await getOgImageByReplicateId(replicateId);
    if (ogImage) {
      await db.execute({
        sql: 'UPDATE audits SET og_image_url = ? WHERE audit_id = ?',
        args: [imageUrl, ogImage.audit_id],
      });
    }
  }
}

export async function getAuditOgImageUrl(auditId: string): Promise<string | null> {
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT og_image_url FROM audits WHERE audit_id = ?',
    args: [auditId],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0].og_image_url as string | null;
}

export async function getPendingOgImages(): Promise<OgImageRecord[]> {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT * FROM og_images WHERE status IN ('pending', 'processing')`,
    args: [],
  });

  return result.rows.map((row) => ({
    image_id: row.image_id as string,
    audit_id: row.audit_id as string,
    prompt: row.prompt as string,
    replicate_id: row.replicate_id as string | null,
    image_url: row.image_url as string | null,
    status: row.status as ImageStatus,
    error_message: row.error_message as string | null,
    created_at: row.created_at as string,
  }));
}
