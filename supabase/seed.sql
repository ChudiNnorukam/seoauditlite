-- ============================================================
-- MicroSaaSBot Knowledge Base Seed Data
-- Micro-SaaS patterns, common mistakes, and SOPs
-- ============================================================

-- ============================================================
-- SOPs: Standard Operating Procedures
-- ============================================================

-- Auth SOPs
INSERT INTO sops (category, title, content) VALUES
('auth', 'Google OAuth Setup Checklist',
'1. Create OAuth client in Google Cloud Console
2. Add authorized redirect URIs for both localhost AND production
3. Set ORIGIN env var to match deployment URL exactly
4. Verify Lucia adapter column names match schema (id not session_id)
5. Test login flow in incognito to avoid cached sessions
6. Check Vercel logs for callback errors if login fails silently'),

('auth', 'Session Cookie Troubleshooting',
'Common issues:
- Cookie path must be "/" not "." in production
- secure: true required for HTTPS
- sameSite: "lax" for OAuth redirects
- Check domain matches (no www vs www mismatch)
- Verify session table has correct column names for adapter'),

('auth', 'Lucia Auth Migration Steps',
'When migrating auth systems:
1. Check adapter expectations (column names vary by adapter)
2. LibSQLAdapter expects: id, user_id, expires_at (NOT session_id)
3. Add migration to rename columns if needed
4. Test with fresh database to verify schema
5. Clear all browser cookies when testing');

-- Billing SOPs
INSERT INTO sops (category, title, content) VALUES
('billing', 'LemonSqueezy Integration Checklist',
'1. Create store and product variant in LemonSqueezy dashboard
2. Get API key, store ID, variant ID, webhook secret
3. Add all env vars to Vercel/deployment platform
4. Webhook URL must be publicly accessible (not localhost)
5. Verify webhook signature using X-Signature header with HMAC-SHA256
6. Handle these events: order_created, subscription_created, subscription_updated, subscription_cancelled'),

('billing', 'Stripe to LemonSqueezy Migration',
'Migration steps:
1. Replace stripe package with @lemonsqueezy/lemonsqueezy.js
2. Rename stripe_customer_id to lemonsqueezy_customer_id in DB
3. Update webhook handler path and signature verification
4. LemonSqueezy uses direct checkout URLs (not Checkout Sessions)
5. Customer portal is accessed via API, not Stripe-style redirect
6. Test webhook with LemonSqueezy dashboard test events'),

('billing', 'Webhook Security Best Practices',
'1. Always verify webhook signatures
2. Use timing-safe comparison for signature validation
3. Respond with 200 quickly, process async if needed
4. Log webhook payloads for debugging (redact sensitive data)
5. Implement idempotency for duplicate webhook deliveries
6. Set up webhook retry monitoring');

-- Deployment SOPs
INSERT INTO sops (category, title, content) VALUES
('deployment', 'Vercel Environment Variables',
'Critical steps:
1. Add ALL required env vars before first deploy
2. Match env var names exactly (case-sensitive)
3. ORIGIN must include https:// and match actual domain
4. Redeploy after adding/changing env vars
5. Check function logs if deployment works but features fail
6. Use Vercel CLI for bulk env var management'),

('deployment', 'Preview Deployment Security',
'1. Add X-Robots-Tag: noindex header for preview URLs
2. Consider password protection for staging
3. Use different OAuth credentials for preview vs production
4. Dont expose production database to preview deployments
5. Review preview URLs in Google Search Console'),

('deployment', 'Database Connection Pooling',
'Serverless database connections:
1. Use connection pooler URL (not direct connection)
2. Turso: Use libsql:// URL with auth token
3. Supabase: Use pooler URL in transaction mode
4. Neon: Enable connection pooling in dashboard
5. Set reasonable connection limits (5-10 for serverless)
6. Use prepared statements when possible');

-- Database SOPs
INSERT INTO sops (category, title, content) VALUES
('database', 'SQLite/Turso Schema Migrations',
'SQLite migration approach:
1. Use PRAGMA table_info() to check existing columns
2. ALTER TABLE ADD COLUMN works, but limited
3. RENAME COLUMN supported since SQLite 3.25
4. For complex migrations: create new table, copy data, drop old
5. Wrap migrations in try/catch, log failures
6. Run migrations on app startup, not build time'),

('database', 'pgvector Index Best Practices',
'Indexing vectors:
1. Use ivfflat for tables under 1M rows
2. lists parameter: sqrt(row_count) is good starting point
3. Create index AFTER inserting data for better performance
4. Use vector_cosine_ops for normalized embeddings
5. Reindex periodically as data grows
6. Monitor query performance with EXPLAIN ANALYZE');

-- SEO SOPs
INSERT INTO sops (category, title, content) VALUES
('seo', 'Technical SEO Checklist',
'Essential checks:
1. Canonical URLs on all pages
2. Proper meta robots tags (index/noindex)
3. XML sitemap submitted to Search Console
4. robots.txt allows important paths
5. Mobile-friendly responsive design
6. Core Web Vitals passing (LCP < 2.5s, CLS < 0.1)
7. Structured data for rich snippets
8. HTTPS everywhere with proper redirects'),

('seo', 'SvelteKit SEO Setup',
'SvelteKit-specific SEO:
1. Use +page.ts for SSR meta tags
2. Implement sitemap.xml as +server.ts endpoint
3. Add prerender = true for static pages
4. Use adapter-vercel for optimal edge caching
5. Implement og:image generation for social sharing
6. Add JSON-LD structured data in +layout.svelte');

-- ============================================================
-- Patterns: Reusable implementation patterns
-- ============================================================

INSERT INTO patterns (stack, layer, component, pattern_name, implementation, gotchas) VALUES
('sveltekit', 'backend', 'auth', 'Lucia + Google OAuth',
'1. Install: lucia, @lucia-auth/adapter-sqlite, arctic
2. Create lib/server/lucia.ts with adapter config
3. Create lib/server/google-oauth.ts with Arctic Google client
4. Routes: /api/auth/login (POST), /api/auth/callback/google (GET)
5. hooks.server.ts: validate session, set locals.user
6. Protect routes with +page.server.ts load function checks',
'LibSQLAdapter expects column named "id" not "session_id". Verify ORIGIN env var matches deployment URL exactly.'),

('sveltekit', 'backend', 'billing', 'LemonSqueezy Checkout',
'1. Create checkout URL with query params:
   - checkout[custom][entitlement_key]
   - checkout[custom][user_id]
   - checkout[email]
   - checkout[success_url]
2. Redirect user to checkout URL
3. Handle webhook events for subscription status
4. Store lemonsqueezy_customer_id and subscription_id',
'Checkout URLs are constructed, not API-generated. Webhook signature uses X-Signature header with HMAC-SHA256.'),

('sveltekit', 'frontend', 'forms', 'Progressive Enhancement Forms',
'1. Use SvelteKit form actions for POST handling
2. Add use:enhance for JS-enabled experience
3. Provide loading states with $page.form
4. Handle errors with fail() return
5. Redirect on success with redirect()
6. Add CSRF protection (built into SvelteKit)',
'use:enhance resets form by default. Use enhance callback to customize behavior.'),

('nextjs', 'backend', 'api', 'Edge API Routes',
'1. Export config with runtime: "edge"
2. Use Web standard Request/Response
3. Avoid Node.js APIs (fs, path, etc.)
4. Use fetch for external requests
5. Edge functions have 30s timeout on Vercel
6. Cannot use Prisma directly (use Prisma Edge)',
'Edge routes cannot access file system. Use environment variables for configuration.'),

('nextjs', 'backend', 'auth', 'NextAuth.js + Prisma',
'1. Install: next-auth, @next-auth/prisma-adapter
2. Create [...nextauth]/route.ts
3. Configure providers and adapter
4. Add NEXTAUTH_SECRET and NEXTAUTH_URL
5. Use getServerSession for server components
6. Middleware for protected routes',
'NEXTAUTH_URL must be set in production. Session strategy affects token availability.'),

('sveltekit', 'database', 'turso', 'Turso with Drizzle ORM',
'1. Install: @libsql/client, drizzle-orm, drizzle-kit
2. Create client with URL and authToken
3. Define schema in lib/server/schema.ts
4. Use drizzle-kit for migrations
5. Wrap queries in try/catch for error handling
6. Use transactions for multi-table operations',
'Turso URLs start with libsql://. Auth token required for cloud databases.'),

('general', 'infra', 'monitoring', 'Error Tracking Setup',
'1. Choose: Sentry, LogRocket, or Highlight
2. Install SDK and configure DSN
3. Add to hooks.server.ts handleError
4. Configure source maps upload in build
5. Set up release tracking
6. Add user context when authenticated',
'Disable in development to avoid noise. Set appropriate sample rates for production.');

-- ============================================================
-- Mistakes: Common errors and their fixes
-- ============================================================

INSERT INTO mistakes (error_signature, context, root_cause, fix_applied, outcome) VALUES
('SQLITE_UNKNOWN: table sessions has no column named id',
'{"stack": "sveltekit", "file": "lucia.ts", "adapter": "LibSQLAdapter"}',
'Lucia LibSQLAdapter expects session column to be named "id" but schema used "session_id"',
'Added migration: ALTER TABLE sessions RENAME COLUMN session_id TO id. Updated schema for new installations.',
'success'),

('OAuth callback error: invalid_oauth_state',
'{"stack": "sveltekit", "file": "callback/google/+server.ts"}',
'OAuth state cookie not being set/read correctly. Usually caused by sameSite cookie settings or domain mismatch.',
'Ensure cookies use sameSite: "lax" for OAuth flows. Verify ORIGIN env var matches actual domain.',
'success'),

('Stripe price is not configured',
'{"stack": "sveltekit", "env": "vercel"}',
'Environment variables not added to Vercel deployment',
'Added all STRIPE_* env vars to Vercel project settings and redeployed',
'success'),

('P1001 Connection Timeout',
'{"stack": "nextjs", "env": "vercel-serverless", "orm": "prisma"}',
'Serverless functions exhaust connection pool. Default Prisma pooling insufficient.',
'Switch to @prisma/adapter-pg with Supabase connection pooler. Use transaction mode pooler URL.',
'success'),

('Webhook signature verification failed',
'{"stack": "sveltekit", "provider": "lemonsqueezy"}',
'Using wrong signature header or incorrect HMAC algorithm',
'LemonSqueezy uses X-Signature header with HMAC-SHA256. Stripe uses stripe-signature with their SDK.',
'success'),

('hydration mismatch',
'{"stack": "sveltekit", "component": "date-display"}',
'Server and client rendering different date formats due to timezone differences',
'Format dates on client side only, or use UTC consistently. Add {#key} block to force re-render.',
'success'),

('CORS error on API route',
'{"stack": "nextjs", "env": "production"}',
'API routes missing CORS headers for cross-origin requests',
'Add Access-Control-Allow-Origin header. For complex requests, handle OPTIONS preflight.',
'success');

-- ============================================================
-- Decisions: Architectural decision records
-- ============================================================

INSERT INTO decisions (project, category, title, context, options_considered, decision_made, rationale) VALUES
('seoauditlite', 'billing', 'Payment Provider Selection',
'Need to add subscription billing for Pro tier. Must support one-time and recurring payments.',
'[{"option": "Stripe", "pros": "Industry standard, great docs", "cons": "Complex webhooks, higher fees for small transactions"},
  {"option": "LemonSqueezy", "pros": "Merchant of record, handles VAT/tax", "cons": "Smaller ecosystem, less documentation"},
  {"option": "Paddle", "pros": "MoR like LS", "cons": "Higher minimum payouts"}]',
'LemonSqueezy',
'As merchant of record, LemonSqueezy handles all tax compliance. Simpler for indie developers. Direct checkout URLs reduce integration complexity.'),

('seoauditlite', 'database', 'Database Selection',
'Need serverless-compatible database with edge support and minimal cold starts.',
'[{"option": "PlanetScale", "pros": "MySQL compatible, great DX", "cons": "Removing free tier"},
  {"option": "Turso", "pros": "SQLite at edge, generous free tier", "cons": "Less tooling ecosystem"},
  {"option": "Supabase", "pros": "Full platform, pgvector", "cons": "Heavier than needed for simple app"}]',
'Turso',
'Edge-first SQLite provides fastest cold starts. libSQL compatible with existing SQLite knowledge. Free tier sufficient for MVP and beyond.'),

('microsaasbot', 'architecture', 'Knowledge Base Backend',
'Need persistent storage for SOPs, patterns, and learnings with semantic search capability.',
'[{"option": "Turso only", "pros": "Already using it", "cons": "No native vector search"},
  {"option": "Supabase", "pros": "pgvector built-in, all-in-one", "cons": "Another service to manage"},
  {"option": "Pinecone + Turso", "pros": "Best vector search", "cons": "Two services, complexity"}]',
'Supabase',
'Free tier provides PostgreSQL + pgvector in one. MCP server available for Claude Code integration. Single source of truth for structured and vector data.');
