import { createClient, type Client } from '@libsql/client';
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from '$env/static/private';

let client: Client | null = null;
let initialized = false;

function getClient(): Client {
  if (!client) {
    if (!TURSO_DATABASE_URL) {
      throw new Error('TURSO_DATABASE_URL environment variable is not set');
    }
    client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
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
      referral_id TEXT,
      og_image_url TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits (created_at);
    CREATE INDEX IF NOT EXISTS idx_audits_expires_at ON audits (expires_at);
    CREATE INDEX IF NOT EXISTS idx_audits_entitlement_key ON audits (entitlement_key);

    CREATE TABLE IF NOT EXISTS entitlements (
      entitlement_key TEXT PRIMARY KEY,
      lemonsqueezy_customer_id TEXT,
      lemonsqueezy_subscription_id TEXT,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      referral_id TEXT,
      referral_updated_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_entitlements_customer ON entitlements (lemonsqueezy_customer_id);

    CREATE TABLE IF NOT EXISTS og_images (
      image_id TEXT PRIMARY KEY,
      audit_id TEXT UNIQUE NOT NULL,
      prompt TEXT NOT NULL,
      replicate_id TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_og_images_audit ON og_images (audit_id);
    CREATE INDEX IF NOT EXISTS idx_og_images_status ON og_images (status);

    -- Auth tables
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      google_id TEXT UNIQUE,
      name TEXT,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entitlements_user_map (
      entitlement_key TEXT PRIMARY KEY REFERENCES entitlements(entitlement_key),
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_entitlements_map_user ON entitlements_user_map(user_id);
  `);

  // Migration: Add og_image_url column to existing audits table if it doesn't exist
  // SQLite doesn't have ADD COLUMN IF NOT EXISTS, so we check the schema first
  try {
    const tableInfo = await db.execute("PRAGMA table_info(audits)");
    const hasOgImageUrl = tableInfo.rows.some((row) => row.name === 'og_image_url');
    if (!hasOgImageUrl) {
      await db.execute("ALTER TABLE audits ADD COLUMN og_image_url TEXT");
      console.log('Migration: Added og_image_url column to audits table');
    }
  } catch (error) {
    console.error('Migration check failed:', error);
  }

  // Migration: Rename stripe_customer_id to lemonsqueezy_customer_id
  // and add lemonsqueezy_subscription_id column
  try {
    const entitlementsInfo = await db.execute("PRAGMA table_info(entitlements)");
    const hasStripeCustomerId = entitlementsInfo.rows.some((row) => row.name === 'stripe_customer_id');
    const hasLsCustomerId = entitlementsInfo.rows.some((row) => row.name === 'lemonsqueezy_customer_id');
    const hasLsSubscriptionId = entitlementsInfo.rows.some((row) => row.name === 'lemonsqueezy_subscription_id');

    if (hasStripeCustomerId && !hasLsCustomerId) {
      await db.execute("ALTER TABLE entitlements RENAME COLUMN stripe_customer_id TO lemonsqueezy_customer_id");
      console.log('Migration: Renamed stripe_customer_id to lemonsqueezy_customer_id');
    }

    if (!hasLsSubscriptionId) {
      await db.execute("ALTER TABLE entitlements ADD COLUMN lemonsqueezy_subscription_id TEXT");
      console.log('Migration: Added lemonsqueezy_subscription_id column to entitlements table');
    }
  } catch (error) {
    console.error('LemonSqueezy migration check failed:', error);
  }

  // Migration: Rename session_id to id for Lucia compatibility
  try {
    const sessionsInfo = await db.execute("PRAGMA table_info(sessions)");
    const hasSessionId = sessionsInfo.rows.some((row) => row.name === 'session_id');
    const hasId = sessionsInfo.rows.some((row) => row.name === 'id');

    if (hasSessionId && !hasId) {
      await db.execute("ALTER TABLE sessions RENAME COLUMN session_id TO id");
      console.log('Migration: Renamed sessions.session_id to id for Lucia compatibility');
    }
  } catch (error) {
    console.error('Sessions migration check failed:', error);
  }

  initialized = true;
}

export async function getDb(): Promise<Client> {
  await initialize();
  return getClient();
}
