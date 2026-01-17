import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;
let initialized = false;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is not set');
    }
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

async function initialize(): Promise<void> {
  if (initialized) return;

  const db = getClient();
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS audits (
      audit_id TEXT PRIMARY KEY,
      audited_url TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      entitlement_key TEXT,
      referral_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits (created_at);
    CREATE INDEX IF NOT EXISTS idx_audits_expires_at ON audits (expires_at);

    CREATE TABLE IF NOT EXISTS entitlements (
      entitlement_key TEXT PRIMARY KEY,
      stripe_customer_id TEXT,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      referral_id TEXT,
      referral_updated_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_entitlements_customer ON entitlements (stripe_customer_id);
  `);

  initialized = true;
}

export async function getDb(): Promise<Client> {
  await initialize();
  return getClient();
}
