# SEO Audit Lite - Project Context

## Tech Stack
- **Framework:** SvelteKit
- **Database:** Turso (LibSQL)
- **Auth:** Lucia v3 with LibSQLAdapter
- **OAuth:** Google OAuth 2.0 (via Arctic library)
- **Deployment:** Vercel
- **Payments:** LemonSqueezy

---

## Known Pitfalls

### Lucia Auth + LibSQL/Turso

#### 1. DEFAULT Values Don't Work
**Problem:** Lucia's LibSQLAdapter explicitly inserts NULL for columns not in attributes, bypassing database DEFAULT values.

**Error:**
```
SQLITE_CONSTRAINT: NOT NULL constraint failed: sessions.created_at
```

**Solution:** Never add custom columns to Lucia-managed tables. Use only standard schema:
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);
```

**Reference:** `~/.claude/learnings/lucia-auth-libsql-adapter-gotchas.md`

#### 2. User Table Primary Key Must Be Named `id`
**Problem:** Lucia hardcodes references to `users.id`.

**Wrong:**
```sql
CREATE TABLE users (user_id TEXT PRIMARY KEY, ...);
```

**Correct:**
```sql
CREATE TABLE users (id TEXT PRIMARY KEY, ...);
```

#### 3. Foreign Key Column Naming Confusion
**Gotcha:** Foreign key tables reference `users(id)` but use their own column name.

**Example:**
```sql
-- Primary table
CREATE TABLE users (id TEXT PRIMARY KEY, ...);

-- Foreign key table
CREATE TABLE entitlements_user_map (
  entitlement_key TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),  -- Column is 'user_id', references 'id'
  ...
);
```

**In code:**
```typescript
// ❌ Wrong - 'id' is not a column in entitlements_user_map
INSERT INTO entitlements_user_map (entitlement_key, id, created_at)

// ✅ Correct - 'user_id' is the FK column name
INSERT INTO entitlements_user_map (entitlement_key, user_id, created_at)
```

---

## Successful Patterns

### Database Migrations (Turso Production)
Use CREATE/INSERT/DROP/RENAME pattern for schema changes:
```sql
CREATE TABLE users_new (id TEXT PRIMARY KEY, ...);
INSERT INTO users_new SELECT user_id AS id, ... FROM users;
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
```

**Why it works:** SQLite transactions are atomic, Vercel edge functions reconnect automatically.

### OAuth Debugging Strategy
1. Check Vercel production logs for exact SQL errors
2. Fix schema/code
3. Deploy (30-60s)
4. Test login
5. Repeat until successful

**Don't guess** - each error reveals the next issue in the chain.

---

## Architecture Notes

### Authentication Flow
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth (`/api/auth/login/google`)
3. Google callback (`/api/auth/callback/google`)
4. Create/update user in `users` table
5. Link entitlement if anonymous audit exists
6. Create Lucia session
7. Set session cookie
8. Redirect to `/dashboard`

### Database Schema
- `users` - User accounts (Google OAuth)
- `sessions` - Lucia session management
- `entitlements` - Subscription plans (LemonSqueezy)
- `entitlements_user_map` - Links anonymous entitlements to users
- `audits` - SEO audit results
- `og_images` - Generated OG images for audit reports

---

## Environment Variables

### Required (Vercel)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `ORIGIN` - Site URL (https://seoauditlite.com)
- `TURSO_DATABASE_URL` - Turso database connection string
- `TURSO_AUTH_TOKEN` - Turso authentication token

### Optional
- `LEMONSQUEEZY_WEBHOOK_SECRET` - LemonSqueezy webhook signature verification
- `REPLICATE_API_TOKEN` - For OG image generation

---

## Testing Checklist

### OAuth Login
- [ ] Google Cloud Console redirect URIs configured
- [ ] Vercel environment variables set
- [ ] User table has `id` primary key (not `user_id`)
- [ ] Session table has only `id`, `user_id`, `expires_at`
- [ ] Foreign key references use correct column names
- [ ] Test login flow in production
- [ ] Check Vercel logs for errors

### Database Schema Validation
```sql
-- Verify users table
PRAGMA table_info(users);
-- Must have: id (PRIMARY KEY), email, google_id

-- Verify sessions table
PRAGMA table_info(sessions);
-- Must have: id, user_id, expires_at (NO created_at)

-- Verify foreign keys
SELECT * FROM entitlements_user_map LIMIT 1;
-- Column must be 'user_id' not 'id'
```

---

## Common Mistakes to Avoid

1. ❌ Adding custom columns to sessions table expecting DEFAULT values to work
2. ❌ Using `user_id` as primary key in users table
3. ❌ Assuming FK column has same name as referenced column
4. ❌ Testing only in local environment (production has different DB state)
5. ❌ Skipping Vercel logs when debugging OAuth issues

---

## Quick Reference

**View production logs:**
```
https://vercel.com/chudi-nnorukams-projects/seoauditlite/logs
```

**Turso DB shell:**
```bash
turso db shell seoauditlite
```

**Force redeploy:**
```bash
git commit --allow-empty -m "redeploy" && git push
```

**Check current schema:**
```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions';
```

---

## Performance Notes

- **Vercel deployment:** 30-60 seconds
- **OAuth flow:** ~2-3 seconds end-to-end
- **Database queries:** <50ms (Turso edge locations)

---

## Tags
`sveltekit` `lucia-auth` `turso` `google-oauth` `vercel` `lemonsqueezy`
