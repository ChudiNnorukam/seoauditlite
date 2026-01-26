# SaaS Horror Stories & Lessons Learned
## Real Developer Experiences, Production Incidents, and How to Avoid Them

_Compiled from postmortems, developer forums, and production incident reports_

---

## Table of Contents

1. [Authentication Nightmares](#authentication-nightmares)
2. [Billing Disasters](#billing-disasters)
3. [Data Leaks & Multi-Tenancy Failures](#data-leaks--multi-tenancy-failures)
4. [Email Delivery Catastrophes](#email-delivery-catastrophes)
5. [Webhook Integration Failures](#webhook-integration-failures)
6. [Database Disasters](#database-disasters)
7. [Deployment Gone Wrong](#deployment-gone-wrong)
8. [Cache Invalidation Nightmares](#cache-invalidation-nightmares)
9. [Mobile UX Failures](#mobile-ux-failures)
10. [Performance Degradation](#performance-degradation)

---

## Authentication Nightmares

### 🔥 Story: "The Session Cookie Theft" (CircleCI Incident)

**What Happened:**
Malware on an engineer's laptop enabled session cookie theft, allowing attackers to impersonate the employee and escalate access to production systems. Attackers gained access to OAuth tokens, environment variables, and customer data.

**Impact:**
- Customer data exposed
- OAuth tokens compromised
- Emergency credential rotation for all users
- Multi-million dollar incident response

**Root Cause:**
- Session cookies were long-lived
- No detection for session hijacking
- Insufficient monitoring of privilege escalation

**Prevention:**
```typescript
// ✅ Implement session anomaly detection
async function validateSession(sessionToken: string, request: Request) {
  const session = await getSession(sessionToken);

  // Check for suspicious patterns
  if (session.lastIP !== request.ip) {
    await logSecurityEvent('session_ip_change', { session, request });

    // Force re-authentication for sensitive operations
    if (request.path.includes('/admin') || request.path.includes('/settings')) {
      throw new Error('Re-authentication required');
    }
  }

  // Check for concurrent sessions from different locations
  const activeSessions = await getActiveSessions(session.userId);
  if (activeSessions.length > 3) {
    await alertUser(session.userId, 'Multiple active sessions detected');
  }

  return session;
}
```

**Lessons Learned:**
- ✅ Short-lived access tokens (15 min)
- ✅ Refresh token rotation (single-use)
- ✅ Monitor for session anomalies (IP changes, concurrent sessions)
- ✅ Log all privilege escalation attempts
- ✅ Require re-auth for sensitive operations

---

### 🔥 Story: "The Admin Panel That Wasn't"

**What Happened:**
Developer built custom admin panel with role-based access. Forgot to check permissions on API endpoints, only checked in UI. Attacker discovered API endpoints through browser dev tools and called them directly, gaining admin access.

**Attack Vector:**
```javascript
// Frontend: Admin button hidden for non-admins
{user.role === 'admin' && <button onClick={deleteAllUsers}>Delete Users</button>}

// Backend: No permission check! ❌
app.post('/api/admin/delete-users', async (req, res) => {
  await db.users.deleteMany({}); // YOLO
  res.json({ success: true });
});
```

**Impact:**
- All user accounts deleted
- Restored from backup (6 hours of data loss)
- User trust destroyed

**Prevention:**
```typescript
// ✅ Middleware for permission checking
function requireRole(...roles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUser(req.session.userId);

    if (!roles.includes(user.role)) {
      await logSecurityEvent('unauthorized_access_attempt', {
        userId: user.id,
        attemptedPath: req.path,
        requiredRoles: roles,
        actualRole: user.role
      });

      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

// Apply to all admin endpoints
app.post('/api/admin/delete-users', requireRole('admin'), async (req, res) => {
  // Now protected
});
```

**Lessons Learned:**
- ✅ Never trust client-side authorization
- ✅ Every API endpoint must verify permissions
- ✅ Log unauthorized access attempts
- ✅ Test authorization with non-admin users

---

## Billing Disasters

### 🔥 Story: "The $40,000 Weekend"

**What Happened:**
SaaS founder implemented Stripe subscriptions. Used `customer.subscription.updated` webhook to grant pro access. Webhook fired on EVERY subscription change (plan updates, billing address changes, card updates). Users discovered they could trigger webhook by updating billing address, getting pro access without paying.

**Exploitation:**
```javascript
// Attacker's script
async function getFreeProAccess() {
  // Update billing address (triggers webhook)
  await fetch('/api/update-billing', {
    body: { address: 'New Address' }
  });

  // customer.subscription.updated fires
  // Backend grants pro access (incorrectly)
  // Attacker now has pro features without paying
}
```

**Impact:**
- $40,000 in free pro access granted over weekend
- 300+ users exploited the vulnerability
- Manual user auditing required
- Stripe dispute losses

**Prevention:**
```typescript
// ❌ WRONG: Using subscription.updated for billing
webhook.on('customer.subscription.updated', async (event) => {
  // This fires for EVERY change, including non-payment changes
  await upgradeUser(event.data.object.customer);
});

// ✅ CORRECT: Use invoice.paid
webhook.on('invoice.paid', async (event) => {
  // Only fires when payment actually succeeds
  const invoice = event.data.object;

  if (invoice.billing_reason === 'subscription_create' ||
      invoice.billing_reason === 'subscription_cycle') {
    await upgradeUser(invoice.customer);
  }
});
```

**Lessons Learned:**
- ✅ Use `invoice.paid` for payment confirmation, not `subscription.updated`
- ✅ Test webhook events thoroughly (use Stripe CLI)
- ✅ Monitor for unusual spikes in plan upgrades
- ✅ Add fraud detection (too many free trials from same user)

---

### 🔥 Story: "The Cancellation That Wasn't"

**What Happened:**
Used `customer.subscription.deleted` webhook to immediately revoke pro access. Users canceled subscriptions and lost access instantly, even though they paid for the full month. Stripe refunds flooded in. Churn rate spiked 40%.

**User Complaint:**
> "I canceled my subscription to avoid next month's charge, but you immediately locked me out even though I paid through end of month! This is theft!"

**Root Cause Misunderstanding:**
```typescript
// ❌ WRONG: Immediate revocation on cancellation
webhook.on('customer.subscription.deleted', async (event) => {
  await downgradeUser(event.data.object.customer); // Too early!
});
```

**Impact:**
- 40% churn rate spike
- Hundreds of angry users
- Stripe refund fees
- Damaged reputation

**Prevention:**
```typescript
// ✅ CORRECT: Respect period_end
webhook.on('customer.subscription.deleted', async (event) => {
  const subscription = event.data.object;

  // User keeps access until they've paid through
  await db.users.update(
    { stripeCustomerId: subscription.customer },
    {
      subscriptionStatus: 'canceled',
      subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
      // hasProAccess: still true until subscriptionEndsAt passes
    }
  );
});

// Separate cron job to revoke expired subscriptions
cron.daily('revoke-expired-subscriptions', async () => {
  await db.users.update(
    { subscriptionEndsAt: { lt: new Date() } },
    { hasProAccess: false }
  );
});
```

**Lessons Learned:**
- ✅ `customer.subscription.deleted` fires when subscription ENDS, not when user cancels
- ✅ Maintain access until `current_period_end`
- ✅ Use cron job to revoke access at actual expiration
- ✅ Show users "Pro until [date]" to set expectations

---

## Data Leaks & Multi-Tenancy Failures

### 🔥 Story: "The Leaked Dashboard"

**What Happened:**
SaaS app used tenant_id column for isolation. Developer wrote query to fetch dashboard stats, forgot WHERE clause filtering by tenant_id. Every user saw aggregated stats from ALL tenants. Competitor signed up and saw total revenue, customer count, and usage patterns.

**Vulnerable Code:**
```typescript
// ❌ DISASTER: Missing tenant filter
async function getDashboardStats(userId: string) {
  const user = await db.users.findById(userId);

  // Forgot to filter by tenant_id!
  const stats = await db.query(`
    SELECT
      COUNT(*) as total_users,
      SUM(mrr) as total_revenue,
      AVG(usage) as avg_usage
    FROM analytics
  `); // Returns ALL tenants' data

  return stats;
}
```

**Impact:**
- Competitive intelligence leaked
- GDPR violation (cross-tenant data exposure)
- Customer trust destroyed
- Lawsuit threat from affected customers

**Prevention:**
```typescript
// ✅ CORRECT: PostgreSQL Row-Level Security (RLS)

// Migration: Enable RLS
await db.execute(`
  ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

  CREATE POLICY tenant_isolation ON analytics
    USING (tenant_id = current_setting('app.tenant_id')::text);
`);

// Application: Set tenant context
async function getDashboardStats(userId: string) {
  const user = await db.users.findById(userId);

  // Set tenant context for all subsequent queries
  await db.execute(`SET LOCAL app.tenant_id = '${user.tenantId}'`);

  // Now this query is automatically filtered by RLS
  const stats = await db.query(`
    SELECT
      COUNT(*) as total_users,
      SUM(mrr) as total_revenue
    FROM analytics
  `); // RLS ensures only tenant's data returned

  return stats;
}
```

**Lessons Learned:**
- ✅ Use PostgreSQL RLS to enforce isolation at database level
- ✅ Never rely on application code alone for tenant filtering
- ✅ Test with multiple tenants ALWAYS
- ✅ Add integration test: "User cannot see other tenant's data"

---

### 🔥 Story: "The Audit That Showed Too Much"

**What Happened:**
Free tier limited to 3 audits/month. Used client-side check only. User opened browser console, saw API endpoint `/api/audit/run`, called it 1000 times with curl. Racked up $500 in OpenAI API costs in one day.

**Vulnerable Code:**
```typescript
// Frontend ❌
function runAudit() {
  if (user.auditsRemaining <= 0) {
    showUpgradeModal();
    return; // Stops here
  }

  fetch('/api/audit/run', { ... }); // API has no limit check!
}
```

**Impact:**
- $500 unexpected API costs
- Had to block user and refund
- Emergency rate limiting implementation

**Prevention:**
```typescript
// ✅ Server-side limit enforcement
app.post('/api/audit/run', async (req, res) => {
  const user = await getUser(req.session.userId);

  // Critical: Server-side check
  if (user.plan === 'free' && user.auditsRemaining <= 0) {
    return res.status(402).json({
      error: 'Audit limit reached',
      upgradeUrl: '/pricing'
    });
  }

  // Decrement atomically
  await db.users.decrement(user.id, 'auditsRemaining', 1);

  // Run audit
  const result = await runAudit(req.body.domain);
  res.json(result);
});
```

**Lessons Learned:**
- ✅ NEVER trust client-side limits
- ✅ Rate limit expensive operations
- ✅ Monitor for unusual usage spikes
- ✅ Add cost alerts (e.g., OpenAI spend > $100/day)

---

## Email Delivery Catastrophes

### 🔥 Story: "The Silent Password Resets"

**What Happened:**
Company launched SaaS in November 2025. Didn't configure SPF/DKIM/DMARC properly. Gmail started rejecting password reset emails in December 2025 when enforcement tightened. Users couldn't reset passwords. Support tickets flooded in. Nobody knew why emails weren't delivering.

**User Experience:**
1. User clicks "Forgot password"
2. Sees "Check your email" message
3. Email never arrives (silently rejected by Gmail)
4. User waits, checks spam, nothing
5. Submits support ticket: "Your password reset is broken"

**Root Cause:**
```bash
# Missing DMARC record
$ dig _dmarc.yourdomain.com TXT
# No result

# SPF includes wrong servers
$ dig yourdomain.com TXT
v=spf1 include:_spf.google.com -all
# Missing SendGrid! Emails sent from SendGrid fail SPF

# DKIM not configured on SendGrid
# All emails rejected at SMTP level by Gmail
```

**Impact:**
- 72 hours before issue diagnosed
- 400+ support tickets
- Users churned thinking app was broken
- Emergency DNS changes on weekend

**Prevention:**
```bash
# ✅ CORRECT: Configure all three before launch

# SPF: Include ALL authorized senders
v=spf1 include:_spf.google.com include:sendgrid.net ~all

# DKIM: Enable on every email provider
# (Configure in SendGrid/Google Workspace settings)

# DMARC: Start with monitoring, then enforce
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; ruf=mailto:dmarc@yourdomain.com; fo=1
```

**Testing Before Launch:**
```typescript
test('All transactional emails deliver successfully', async () => {
  const testEmails = [
    { template: 'welcome', trigger: signup },
    { template: 'password-reset', trigger: requestReset },
    { template: 'email-verification', trigger: signup },
    { template: 'billing-alert', trigger: paymentFailed }
  ];

  for (const { template, trigger } of testEmails) {
    await trigger();

    const email = await getLatestEmail();
    const result = await sendToMailTester(email);

    expect(result.spf).toBe('pass');
    expect(result.dkim).toBe('pass');
    expect(result.dmarc).toBe('pass');
    expect(result.spamScore).toBeLessThan(3);
    expect(result.inboxPlacement).toBe('inbox');
  }
});
```

**Lessons Learned:**
- ✅ Configure SPF/DKIM/DMARC BEFORE first user
- ✅ Test with mail-tester.com or similar service
- ✅ Monitor email delivery rates daily
- ✅ Have fallback for critical emails (SMS for password reset?)

---

### 🔥 Story: "The Verification Emails That Never Came"

**What Happened:**
Founder used personal Gmail account to send verification emails via SMTP. Worked fine for first 50 users. On Product Hunt launch day, sent 500+ verification emails in 2 hours. Gmail flagged account as spam bot and suspended it. All new signups couldn't verify emails. Launch completely derailed.

**Impact:**
- 500+ users signed up, couldn't activate accounts
- Product Hunt launch momentum lost
- Had to manually verify all users
- Migration to SendGrid took 6 hours during critical launch window

**Prevention:**
```typescript
// ✅ Use transactional email service from day 1
import { SendGrid } from '@sendgrid/mail';

// NOT personal Gmail, even for MVP
const emailService = new SendGrid(process.env.SENDGRID_API_KEY);

// Rate limiting awareness
const HOURLY_LIMIT = 10000; // SendGrid free tier limit
const DAILY_LIMIT = 100000;

async function sendVerificationEmail(email: string, token: string) {
  // Check rate limit before sending
  const sentToday = await redis.incr('emails:sent:today');
  if (sentToday > DAILY_LIMIT) {
    throw new Error('Daily email limit reached');
  }

  await emailService.send({
    to: email,
    from: 'noreply@yourdomain.com', // Verified sender
    subject: 'Verify your email',
    html: renderTemplate('verify-email', { token })
  });
}
```

**Lessons Learned:**
- ✅ Use transactional email service (SendGrid, Postmark, Resend)
- ✅ Never use personal email for production
- ✅ Know your rate limits BEFORE launch
- ✅ Have email delivery monitoring

---

## Webhook Integration Failures

### 🔥 Story: "The Duplicate Subscription Charges"

**What Happened:**
Stripe webhook endpoint processed `invoice.paid` event. Network timeout caused Stripe to retry. Webhook processed same payment twice, charging user double. User disputed charge, Stripe sided with customer, business lost money + dispute fee.

**Vulnerable Code:**
```typescript
// ❌ NO IDEMPOTENCY CHECK
app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;

  if (event.type === 'invoice.paid') {
    // Creates payment record every time
    await db.payments.create({
      userId: getUserId(event.data.object.customer),
      amount: event.data.object.amount_paid
    });

    // Stripe retries → duplicate payment record → double charge
  }

  res.json({ received: true });
});
```

**Impact:**
- 47 users double-charged
- $2,800 in dispute fees
- Stripe payout on hold for investigation
- Emergency refunds issued manually

**Prevention:**
```typescript
// ✅ CORRECT: Idempotency using event ID
app.post('/webhooks/stripe', async (req, res) => {
  const event = req.body;

  // Check if already processed
  const existing = await db.processedWebhooks.findOne({ eventId: event.id });
  if (existing) {
    console.log('Duplicate webhook, already processed:', event.id);
    return res.json({ received: true }); // Return 200 to stop retries
  }

  // Process event
  if (event.type === 'invoice.paid') {
    await db.transaction(async (tx) => {
      // Create payment
      await tx.payments.create({
        stripeInvoiceId: event.data.object.id,
        userId: getUserId(event.data.object.customer),
        amount: event.data.object.amount_paid
      });

      // Mark as processed
      await tx.processedWebhooks.create({
        eventId: event.id,
        type: event.type,
        processedAt: new Date()
      });
    });
  }

  res.json({ received: true });
});
```

**Lessons Learned:**
- ✅ Store processed webhook IDs
- ✅ Make webhook handlers idempotent
- ✅ Use database transactions for multi-step processing
- ✅ Test with Stripe CLI `stripe trigger` multiple times

---

### 🔥 Story: "The Webhook That Took Down Production"

**What Happened:**
Shopify sent webhook with 10MB JSON payload (order with 5000 line items). Express body-parser had no size limit. Server ran out of memory processing payload. All instances crashed. Site down for 45 minutes during Black Friday.

**Vulnerable Config:**
```javascript
// ❌ NO SIZE LIMIT
app.use(express.json()); // Default: no limit

app.post('/webhooks/shopify', async (req, res) => {
  // req.body could be gigabytes
  await processOrder(req.body); // OOM crash
});
```

**Impact:**
- 45 minutes downtime during peak sales period
- Estimated $12,000 in lost sales
- Emergency scaling required

**Prevention:**
```javascript
// ✅ CORRECT: Set payload size limits
app.use(express.json({
  limit: '1mb', // Reject > 1MB payloads
  verify: (req, buf) => {
    // Store raw buffer for Stripe signature verification
    req.rawBody = buf.toString('utf8');
  }
}));

// Handle oversized payloads gracefully
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      maxSize: '1MB'
    });
  }
  next(err);
});
```

**Lessons Learned:**
- ✅ Set body-parser size limits (1MB is reasonable)
- ✅ Test with large payloads (use `stripe trigger` with custom data)
- ✅ Monitor memory usage during webhook processing
- ✅ Implement queue for large payloads (process async)

---

## Database Disasters

### 🔥 Story: "The Migration That Locked The Table"

**What Happened:**
Added index to 50M row table during business hours. PostgreSQL locked table for 12 minutes during index creation. All writes failed. API returned 500 errors. Users couldn't create audits. Panic rollback made it worse (had to rebuild index on rollback).

**Dangerous Migration:**
```sql
-- ❌ LOCKS TABLE FOR MINUTES
ALTER TABLE audits ADD INDEX idx_domain (domain);
```

**Impact:**
- 12 minutes of write failures
- 1,200+ API errors
- User panic (thought data was lost)
- Rollback took another 8 minutes

**Prevention:**
```sql
-- ✅ CORRECT: Use CONCURRENTLY
CREATE INDEX CONCURRENTLY idx_domain ON audits (domain);

-- No table lock, index builds in background
-- Can take longer but no downtime
```

**Lessons Learned:**
- ✅ Use `CREATE INDEX CONCURRENTLY` for large tables
- ✅ Run migrations during low-traffic hours
- ✅ Test migrations on production-sized dataset (staging)
- ✅ Have rollback script ready BEFORE running migration
- ✅ Monitor table lock durations

---

### 🔥 Story: "The Backup That Wasn't"

**What Happened:**
Configured automated daily PostgreSQL backups. Felt safe. Six months later, database corruption from bad migration. Tried to restore backup. **Backup restoration had never been tested.** Backup files were corrupt. Lost 6 months of data.

**Reality Check:**
```bash
# Backups ran daily ✅
# But restoration was never tested ❌

# Attempted restore
$ pg_restore -d production backup.dump
pg_restore: [archiver] unsupported version (1.14) in file header
# Backup tool version mismatch, file unreadable
```

**Impact:**
- Complete data loss
- Business shut down
- Lawsuits from customers
- Founder personal bankruptcy

**Prevention:**
```typescript
// ✅ Automated backup TESTING (monthly)
cron.monthly('test-backup-restoration', async () => {
  // 1. Create fresh backup
  await exec('pg_dump -Fc production > /backups/test-restore.dump');

  // 2. Restore to test database
  await exec('createdb test_restore');
  await exec('pg_restore -d test_restore /backups/test-restore.dump');

  // 3. Verify data integrity
  const productionCount = await db.query('SELECT COUNT(*) FROM users');
  const restoredCount = await testDb.query('SELECT COUNT(*) FROM users');

  if (productionCount !== restoredCount) {
    await alertOncall('BACKUP RESTORATION FAILED - DATA MISMATCH');
  }

  // 4. Cleanup
  await exec('dropdb test_restore');

  // 5. Log success
  await log('backup_restoration_test_passed', { timestamp: new Date() });
});
```

**Lessons Learned:**
- ✅ Test backup restoration MONTHLY (not never)
- ✅ Automate restoration testing
- ✅ Verify row counts match after restoration
- ✅ Keep multiple backup retention periods (7 days, 30 days, 90 days)
- ✅ Store backups in different region/provider

---

## Deployment Gone Wrong

### 🔥 Story: "The Blue-Green Deploy That Wasn't Green"

**What Happened:**
Implemented blue-green deployment for zero-downtime releases. Deployed green environment, ran smoke tests, switched traffic. Green environment had bug in database connection pooling - connections exhausted after 2 minutes under load. All requests started timing out. Switched back to blue, but took 5 minutes to notice + switch. 5 minutes of complete downtime.

**What Went Wrong:**
```typescript
// Smoke test ❌ - Only checked basic functionality
async function smokeTest() {
  const response = await fetch('https://green.yourdomain.com/health');
  return response.status === 200;
}

// Passed health check, but didn't test under load
```

**Impact:**
- 5 minutes complete outage
- Failed during user demo to investor
- Missed funding round

**Prevention:**
```typescript
// ✅ Smoke test with load testing
async function comprehensiveSmokeTest() {
  const greenUrl = 'https://green.yourdomain.com';

  // 1. Basic health check
  const health = await fetch(`${greenUrl}/health`);
  if (health.status !== 200) return false;

  // 2. Database connectivity
  const dbCheck = await fetch(`${greenUrl}/health/db`);
  if (dbCheck.status !== 200) return false;

  // 3. Critical user flow
  const signup = await testSignupFlow(greenUrl);
  if (!signup.success) return false;

  // 4. Load test (100 concurrent requests)
  const loadTest = await autocannon({
    url: `${greenUrl}/api/audits`,
    connections: 100,
    duration: 30 // 30 seconds
  });

  if (loadTest.errors > 0) {
    console.error('Load test failed:', loadTest.errors);
    return false;
  }

  // 5. Database connection pool health
  const poolStats = await fetch(`${greenUrl}/health/db-pool`).then(r => r.json());
  if (poolStats.waiting > 10) {
    console.error('Too many waiting connections:', poolStats.waiting);
    return false;
  }

  return true;
}
```

**Lessons Learned:**
- ✅ Smoke tests must include load testing (not just single requests)
- ✅ Verify database connection pool under load
- ✅ Keep blue environment running for 15min after switch
- ✅ Automated rollback if error rate spikes
- ✅ Gradual traffic shift (10% → 50% → 100%), not instant

---

## Cache Invalidation Nightmares

### 🔥 Story: "The Stale Pricing That Cost $50K"

**What Happened:**
Pricing page cached by CDN for 1 hour. Founder updated pricing (lowered Pro from $49 to $29 for Black Friday sale). Updated database, but CDN still served old $49 price. Users saw $49, went to checkout, got charged $29 (from database). 200+ users submitted credit card disputes for "deceptive pricing". Lost dispute fees + had to honor $49 → $29 price difference.

**Cache Invalidation Gap:**
```typescript
// Updated pricing in database ✅
await db.pricing.update({ plan: 'pro' }, { price: 29 });

// Forgot to purge CDN cache ❌
// CDN continued serving old HTML with $49 for up to 1 hour
```

**Impact:**
- $50,000 in dispute fees + refunds
- Stripe merchant account flagged
- Banned from Product Hunt for "deceptive practices"

**Prevention:**
```typescript
// ✅ Purge CDN cache when pricing changes
async function updatePricing(plan: string, newPrice: number) {
  // 1. Update database
  await db.pricing.update({ plan }, { price: newPrice });

  // 2. Purge CDN cache immediately
  await cloudflare.zones.purgeCache({
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    files: [
      'https://yourdomain.com/',
      'https://yourdomain.com/pricing'
    ]
  });

  // 3. Verify purge worked
  await wait(2000);
  const response = await fetch('https://yourdomain.com/pricing', {
    headers: { 'Cache-Control': 'no-cache' }
  });
  const html = await response.text();

  if (!html.includes(`$${newPrice}`)) {
    throw new Error('CDN cache purge failed');
  }

  // 4. Log change
  await auditLog('pricing_updated', { plan, oldPrice: current.price, newPrice });
}
```

**Lessons Learned:**
- ✅ Purge CDN cache when data changes
- ✅ Verify purge worked (don't trust it)
- ✅ Use cache tags for selective invalidation
- ✅ Set short TTL for critical pages (pricing, product pages)

---

## Mobile UX Failures

### 🔥 Story: "The Checkout Button You Couldn't Click"

**What Happened:**
Launched MVP. Desktop testing only. On mobile, "Complete Purchase" button was 32px tall. Users with large fingers couldn't tap it accurately. Kept missing and hitting "Cancel" instead. 60% cart abandonment rate on mobile. Took 2 weeks to realize mobile users couldn't check out.

**Vulnerable Code:**
```css
/* ❌ Too small for mobile */
.checkout-button {
  padding: 6px 12px; /* Results in ~32px height */
  font-size: 13px;
}
```

**Impact:**
- 60% cart abandonment on mobile
- $8,000 in lost revenue over 2 weeks
- Angry users: "Your checkout is broken on mobile!"

**Prevention:**
```css
/* ✅ Apple HIG minimum: 44x44px touch targets */
.checkout-button {
  min-height: 44px;
  min-width: 120px;
  padding: 12px 24px;
  font-size: 16px; /* Prevents iOS zoom on focus */
}

/* Spacing between touch targets */
.button-group button + button {
  margin-left: 32px; /* Minimum 32px spacing */
}
```

**Testing:**
```typescript
test('All interactive elements meet 44px minimum', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/checkout');

  const buttons = await page.locator('button, a').all();

  for (const button of buttons) {
    const box = await button.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }
});
```

**Lessons Learned:**
- ✅ Test on real mobile devices (not just desktop resize)
- ✅ 44x44px minimum for ALL touch targets
- ✅ 32px spacing between interactive elements
- ✅ Use 16px font for inputs (prevents iOS auto-zoom)

---

## Performance Degradation

### 🔥 Story: "The N+1 Query That Killed Black Friday"

**What Happened:**
Dashboard showed user's last 10 audits with related checks. Used ORM lazy loading. Each audit triggered separate query to load checks. 1 user = 1 dashboard query + 10 audit queries = 11 total queries. Black Friday: 500 concurrent users = 5,500 simultaneous queries. Database connection pool exhausted. Site down for 2 hours.

**Vulnerable Code:**
```typescript
// ❌ N+1 QUERY PROBLEM
async function getDashboard(userId: string) {
  const audits = await db.audits.where({ userId }).limit(10);

  // Each audit triggers separate query! (10 queries)
  const auditsWithChecks = await Promise.all(
    audits.map(async audit => ({
      ...audit,
      checks: await db.checks.where({ auditId: audit.id }).all()
    }))
  );

  return auditsWithChecks; // 1 + 10 = 11 queries total
}
```

**Impact:**
- 2 hours complete downtime
- Database connection pool: 100 connections exhausted
- Emergency scaling cost: $400
- Lost revenue: estimated $15,000

**Prevention:**
```typescript
// ✅ CORRECT: Eager loading with JOIN
async function getDashboard(userId: string) {
  // Single query with JOIN
  const audits = await db.query(`
    SELECT
      audits.*,
      json_agg(checks.*) as checks
    FROM audits
    LEFT JOIN checks ON checks.audit_id = audits.id
    WHERE audits.user_id = $1
    GROUP BY audits.id
    ORDER BY audits.created_at DESC
    LIMIT 10
  `, [userId]);

  return audits; // 1 query total
}
```

**Detection:**
```typescript
// ✅ Add query counter in tests
test('Dashboard loads with < 5 queries', async () => {
  const queryCounter = new QueryCounter(db);

  await getDashboard(userId);

  expect(queryCounter.count).toBeLessThan(5);
  expect(queryCounter.queries).not.toContain('SELECT * FROM checks WHERE'); // No N+1
});
```

**Lessons Learned:**
- ✅ Use eager loading for relations
- ✅ Monitor query count per request
- ✅ Load test before traffic spikes (Black Friday, Product Hunt)
- ✅ Add database connection pool monitoring

---

## Common Patterns That Cause Issues

### Pattern: "It Works on My Machine"

**Symptoms:**
- ✅ Works perfectly in development
- ❌ Fails mysteriously in production

**Common Causes:**

1. **Environment variable differences**
   ```typescript
   // Dev: DATABASE_URL uses localhost
   // Prod: DATABASE_URL uses internal IP → connection fails
   ```

2. **Data volume differences**
   ```typescript
   // Dev: 100 rows in table → query fast
   // Prod: 10M rows → query times out (missing index)
   ```

3. **Dependency version mismatches**
   ```bash
   # Dev: npm install (gets latest)
   # Prod: Cache uses old version → API breaking change
   ```

**Prevention:**
- ✅ Use Docker for development (matches production)
- ✅ Seed development DB with production-sized dataset
- ✅ Lock dependency versions (package-lock.json committed)
- ✅ Use environment variable validation on startup

---

### Pattern: "The Silently Failing Background Job"

**Symptoms:**
- No errors in logs
- Users report data not updating
- Jobs appear to run successfully

**Example:**
```typescript
// ❌ Swallowing errors
cron.daily('update-analytics', async () => {
  try {
    await calculateAnalytics();
  } catch (error) {
    console.log('Analytics update failed'); // Just logged, no alert
  }
  // Cron thinks it succeeded because no exception thrown
});
```

**Impact:**
- Analytics dashboard stale for 3 weeks
- Users made business decisions on wrong data
- Discovered only when user complained

**Prevention:**
```typescript
// ✅ Proper error handling + alerting
cron.daily('update-analytics', async () => {
  try {
    await calculateAnalytics();
    await logSuccess('analytics_updated', { timestamp: new Date() });
  } catch (error) {
    await logError('analytics_failed', { error: error.message, stack: error.stack });
    await alertOncall('Analytics update failed', { error });
    throw error; // Fail the job so cron knows
  }
});

// Monitor job success rate
test('Analytics cron succeeds consistently', async () => {
  const last30Days = await getJobRuns('update-analytics', { days: 30 });
  const failures = last30Days.filter(job => job.status === 'failed');

  expect(failures.length).toBe(0); // No failures in last 30 days
  expect(last30Days.length).toBe(30); // Ran every day
});
```

**Lessons Learned:**
- ✅ Never silently catch errors in background jobs
- ✅ Alert on-call for critical job failures
- ✅ Monitor job success rates
- ✅ Test jobs run successfully in CI

---

## Production Incident Response Checklist

When shit hits the fan, follow this sequence:

### Immediate (0-5 minutes)
1. ⚡ **Acknowledge incident** - Update status page
2. ⚡ **Assess scope** - How many users affected?
3. ⚡ **Stop the bleeding** - Rollback, disable feature flag, or failover
4. ⚡ **Communicate** - Post to status page + email affected users

### Short-term (5-30 minutes)
5. 🔍 **Diagnose root cause** - Check logs, metrics, recent deployments
6. 🔍 **Implement fix** - Patch or rollback
7. 🔍 **Verify fix** - Smoke test + monitor error rates
8. 🔍 **Restore service** - Gradually increase traffic

### Follow-up (24-48 hours)
9. 📝 **Write postmortem** (blameless)
10. 📝 **Identify preventive actions**
11. 📝 **Update runbooks**
12. 📝 **Add tests** for the bug that caused incident

### Template Postmortem

```markdown
# Incident: [Title]
Date: 2026-01-26
Duration: 45 minutes
Severity: High
Author: [Name]

## Summary
What happened in 2-3 sentences.

## Impact
- 500 users unable to log in
- 45 minutes downtime
- 127 error tickets submitted

## Timeline (UTC)
- 14:23 - Deployed v2.3.0
- 14:25 - Error rate spike (0.1% → 15%)
- 14:28 - First user reports login failure
- 14:35 - Incident declared, rollback initiated
- 14:40 - Rollback complete, error rate normal
- 15:08 - All clear, monitoring continues

## Root Cause
Session validation middleware had typo: `req.session.userId` → `req.session.userid` (lowercase).
All authenticated requests failed with undefined userId.

## Resolution
Rolled back to v2.2.9. Fixed typo in v2.3.1, added test coverage.

## Lessons Learned
1. Add integration test for authenticated requests
2. Smoke test should include auth'd API call, not just health check
3. TypeScript strict mode would have caught undefined access

## Action Items
- [ ] Add test: "Authenticated request succeeds" (Owner: @dev)
- [ ] Enable TypeScript strict mode (Owner: @dev)
- [ ] Update deployment checklist with auth smoke test (Owner: @devops)
- [ ] Improve monitoring alert for auth failures (Owner: @sre)

## Follow-up
Tests added in PR #234, deployed 2026-01-27.
```

---

## The 20 Most Expensive Mistakes

Ranked by financial impact from real incidents:

1. **No backup restoration testing** → Complete data loss, business shutdown
2. **Missing GDPR data deletion** → €20M fine (or 4% revenue)
3. **Soft-delete for PII** → Regulatory violation, lawsuit
4. **No webhook idempotency** → Double charging customers, dispute fees
5. **Client-side rate limiting only** → $500 in API abuse costs in 24 hours
6. **Migration without CONCURRENTLY** → 12 min table lock during business hours
7. **Missing SPF/DKIM/DMARC** → Password reset emails silently rejected
8. **No access control on admin APIs** → All user data deleted by attacker
9. **File upload without type validation** → SVG XSS attack, session hijacking
10. **Missing tenant_id in queries** → Cross-tenant data leak, GDPR violation
11. **Long-lived refresh tokens** → Session hijacking, unauthorized access
12. **Blue-green without load testing** → 5 min outage during deploy
13. **No email delivery monitoring** → 3 days before noticing emails failing
14. **CDN cache not purged on pricing change** → $50K in dispute fees
15. **N+1 queries on dashboard** → Site down during traffic spike
16. **Using subscription.updated for billing** → Users getting free pro access
17. **Mobile buttons < 44px** → 60% cart abandonment on mobile
18. **No database connection pool limits** → Memory exhaustion, crash
19. **Missing CSRF tokens** → Account takeover via phishing
20. **Logging sensitive data** → API keys in logs, security breach

---

## Prevention: The Paranoid Developer's Checklist

Before deploying ANYTHING to production:

### Data Safety
- [ ] Backup restoration tested THIS MONTH
- [ ] Database migrations tested on production-sized dataset
- [ ] Migrations use CONCURRENTLY for large tables
- [ ] All queries filtered by tenant_id (or use RLS)
- [ ] Soft delete + hard delete TTL for GDPR
- [ ] Audit log for all data changes

### Authentication & Authorization
- [ ] All API endpoints check permissions
- [ ] Role-based access control tested
- [ ] Session anomaly detection configured
- [ ] Refresh token rotation implemented
- [ ] MFA available for all users
- [ ] Rate limiting on auth endpoints

### Billing & Money
- [ ] Use invoice.paid, not subscription.updated
- [ ] Webhook idempotency via event ID
- [ ] Webhook signature verification
- [ ] Test with Stripe CLI (duplicate events)
- [ ] Subscription status transitions tested
- [ ] Payment failure handling with grace period

### Email & Communication
- [ ] SPF includes all senders
- [ ] DKIM signing enabled
- [ ] DMARC policy is enforce mode (p=quarantine or p=reject)
- [ ] Transactional email deliverability tested
- [ ] Email delivery monitoring configured
- [ ] Fallback for critical emails (SMS?)

### Performance & Scale
- [ ] N+1 queries eliminated (check with query counter)
- [ ] Database connection pool sized correctly
- [ ] API response time < 200ms (p95)
- [ ] Load tested at 2x expected traffic
- [ ] CDN configured for static assets
- [ ] Cache invalidation strategy tested

### Security
- [ ] Rate limiting per endpoint
- [ ] File upload type validation (whitelist only)
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS sanitization on user input
- [ ] CSRF tokens on forms
- [ ] Secrets in environment variables, not code

### Mobile & UX
- [ ] Touch targets ≥ 44px
- [ ] No horizontal overflow at 375px
- [ ] Forms work with mobile keyboard
- [ ] Images responsive
- [ ] Tested on real devices (iOS + Android)

### Monitoring & Observability
- [ ] Error tracking configured (Sentry, Datadog)
- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Performance monitoring (APM)
- [ ] Log aggregation (Datadog, Logtail)
- [ ] Alert rules for critical metrics
- [ ] On-call rotation configured

### Legal & Compliance
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner (GDPR)
- [ ] Data export endpoint
- [ ] Data deletion process (30-day TTL)
- [ ] Third-party processors listed in privacy policy

### Deployment
- [ ] Rollback procedure tested
- [ ] Database migration rollback script exists
- [ ] Smoke tests include load testing
- [ ] Gradual traffic shift (not instant cut-over)
- [ ] Blue environment kept running 15min post-deploy
- [ ] Feature flags for new features

---

## Testing Maturity Model

### Level 1: Cowboy Coding (💀 High Risk)
- No tests
- Manual testing only
- "Works on my machine"
- Deploy and pray

**Estimated bug escape rate:** 60%

### Level 2: Safety Net (⚠️ Medium Risk)
- Some unit tests (< 50% coverage)
- Manual E2E testing
- Smoke tests on deploy
- Occasional load testing

**Estimated bug escape rate:** 30%

### Level 3: Professional (✅ Production Ready)
- 80%+ test coverage
- Integration tests for critical paths
- Automated E2E tests
- CI/CD with test gates
- Load testing before releases

**Estimated bug escape rate:** 10%

### Level 4: Bulletproof (🏆 4/5 Star Quality)
- 90%+ coverage, 95%+ on critical paths
- Contract testing for external APIs
- Mutation testing to verify test quality
- Performance regression testing
- Chaos engineering (test resilience)

**Estimated bug escape rate:** < 5%

---

## Quick Decision Tree

**Should I write a test for this?**

```
Is it critical path (auth, billing, data access)?
├─ YES → Write integration + E2E test
└─ NO → Continue below

Will a bug here lose money or data?
├─ YES → Write integration test
└─ NO → Continue below

Is the logic complex (>10 lines, multiple branches)?
├─ YES → Write unit test
└─ NO → Skip test, keep code simple
```

**Should I test this edge case?**

```
Has this bug happened before?
├─ YES → Write regression test
└─ NO → Continue below

Would this bug cause data loss or security breach?
├─ YES → Write test
└─ NO → Continue below

Is this edge case realistic (> 1% users hit it)?
├─ YES → Write test
└─ NO → Skip, focus on common paths
```

---

## Conclusion: From Horror Stories to Best Practices

### Universal Truth

**Every "horror story" incident had the same 3 factors:**

1. **Missing test coverage** for the critical path that failed
2. **Assumed it would work** instead of verifying
3. **Discovered by users** instead of monitoring/tests

### The 4/5-Star Formula

**4-star products:**
- Work correctly for happy path
- Handle common errors gracefully
- Have basic security

**5-star products:**
- Work correctly for happy path
- Handle ALL errors gracefully (edge cases, race conditions, concurrent access)
- Have comprehensive security (defense in depth)
- Prevent data loss at all costs
- Recover gracefully from failures
- Monitor and alert proactively

**The difference:** 5-star products have **tests for things that haven't gone wrong yet**.

### Start Here

If you're building a SaaS from scratch:

**Week 1 - Foundation:**
- Set up testing framework (Vitest + Playwright)
- Configure test database (Testcontainers)
- Write first 10 critical tests
- Set up CI/CD pipeline

**Week 2 - Coverage:**
- Add integration tests for auth flow
- Add Stripe webhook tests
- Add multi-tenant isolation tests
- Add email delivery tests

**Week 3 - E2E:**
- Complete user signup → login → core feature → logout flow
- Mobile viewport testing
- Form validation testing
- Error handling testing

**Week 4 - Performance:**
- Load testing critical endpoints
- Database query optimization
- N+1 query detection
- Cache strategy testing

**Before Launch:**
- Run full test suite
- Load test at 2x expected traffic
- Verify all checklist items
- Deploy to staging first
- Run smoke tests
- Gradual rollout with feature flags

**Post-Launch:**
- Monitor error rates
- Track performance metrics
- Review logs daily
- Write tests for every bug found
- Monthly backup restoration test

---

## Final Thought

> "The best time to write tests was before you wrote the code. The second best time is right now."

Every horror story in this document could have been prevented with:
1. A test catching the bug before deploy
2. Monitoring alerting to the issue
3. A rollback procedure ready to execute

**Don't let your app become the next horror story.**

Write the tests. Set up monitoring. Test your backups.

Your users (and your stress levels) will thank you.
