import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_DB_PATH = resolve(process.cwd(), 'data', 'audits.sqlite');
const DB_PATH = process.env.AUDIT_DB_PATH ?? DEFAULT_DB_PATH;

let dbInstance: Database.Database | null = null;

function initialize(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS audits (
      audit_id TEXT PRIMARY KEY,
      audited_url TEXT NOT NULL,
      schema_version TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits (created_at);
    CREATE INDEX IF NOT EXISTS idx_audits_expires_at ON audits (expires_at);
    CREATE TABLE IF NOT EXISTS entitlements (
      entitlement_key TEXT PRIMARY KEY,
      stripe_customer_id TEXT,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_entitlements_customer ON entitlements (stripe_customer_id);
  `);
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
    dbInstance = new Database(DB_PATH);
    initialize(dbInstance);
  }

  return dbInstance;
}
