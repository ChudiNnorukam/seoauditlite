# TDD Implementation Guide for SaaS
## Practical Testing Framework Setup & Critical Test Suites

_Companion to SaaS Production Readiness Guide_

---

## Testing Stack Recommendations

### For TypeScript/Node.js SaaS

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",           // Unit & integration tests
    "playwright": "^1.40.0",       // E2E browser testing
    "@testing-library/react": "^14.0.0",
    "msw": "^2.0.0",               // API mocking
    "testcontainers": "^10.0.0",   // Database testing
    "stripe-mock": "^2.0.0",       // Stripe webhook testing
    "mailhog": "^1.0.0"            // Email testing
  }
}
```

### Test File Organization

```
tests/
├── unit/              # Fast, isolated tests (60-75% of suite)
│   ├── utils/
│   ├── validators/
│   └── services/
├── integration/       # API + DB + external services (20-30%)
│   ├── api/
│   ├── webhooks/
│   ├── database/
│   └── email/
├── e2e/              # Full user flows (5-10%)
│   ├── auth.spec.ts
│   ├── billing.spec.ts
│   └── core-workflow.spec.ts
└── fixtures/         # Test data
    ├── users.ts
    ├── stripe-events.ts
    └── email-templates.ts
```

---

## Critical Test Suite #1: Authentication Flow

### Complete E2E Auth Test

```typescript
import { test, expect } from '@playwright/test';
import { db } from './test-db';
import { emailServer } from './mail-server';

test.describe('Authentication E2E', () => {
  test.beforeEach(async () => {
    await db.reset();
    await emailServer.clearInbox();
  });

  test('Complete signup → verify → login → logout flow', async ({ page }) => {
    // 1. Sign up
    await page.goto('/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // 2. Verify email sent
    await expect(page.getByText(/check your email/i)).toBeVisible();
    const emails = await emailServer.getEmails('test@example.com');
    expect(emails).toHaveLength(1);
    expect(emails[0].subject).toContain('Verify your email');

    // 3. Extract verification link and click
    const verifyLink = emails[0].body.match(/href="([^"]+verify[^"]+)"/)[1];
    await page.goto(verifyLink);
    await expect(page.getByText(/email verified/i)).toBeVisible();

    // 4. Log in
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // 5. Verify logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('test@example.com')).toBeVisible();

    // 6. Log out
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Sign out');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Sign in')).toBeVisible();
  });

  test('Password reset flow completes successfully', async ({ page }) => {
    // Setup: create verified user
    await db.createUser({ email: 'user@example.com', emailVerified: true });

    // 1. Request password reset
    await page.goto('/forgot-password');
    await page.fill('[name="email"]', 'user@example.com');
    await page.click('button[type="submit"]');

    // 2. Check email
    const emails = await emailServer.getEmails('user@example.com');
    const resetEmail = emails.find(e => e.subject.includes('Reset'));
    expect(resetEmail).toBeDefined();

    // 3. Click reset link
    const resetLink = resetEmail.body.match(/href="([^"]+reset[^"]+)"/)[1];
    await page.goto(resetLink);

    // 4. Set new password
    await page.fill('[name="password"]', 'NewSecurePass456!');
    await page.fill('[name="confirmPassword"]', 'NewSecurePass456!');
    await page.click('button[type="submit"]');

    // 5. Verify can log in with new password
    await expect(page.getByText(/password updated/i)).toBeVisible();
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'NewSecurePass456!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'WrongPassword');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    await expect(page).toHaveURL('/login'); // Still on login page
  });

  test('Expired session redirects to login', async ({ page, context }) => {
    // Create user and log in
    await db.createUser({ email: 'user@example.com', password: 'hashedpass' });
    await page.goto('/login');
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Manually expire session
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'session');
    await db.expireSession(sessionCookie.value);

    // Try to access protected page
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/session expired/i)).toBeVisible();
  });
});
```

---

## Critical Test Suite #2: Multi-Tenant Data Isolation

### PostgreSQL RLS Testing

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { setupTestDatabase, createTenantUser, setCurrentUser } from './test-helpers';

describe('Multi-Tenant Data Isolation', () => {
  let db: Database;
  let tenant1User: User;
  let tenant2User: User;

  beforeEach(async () => {
    db = await setupTestDatabase();

    // Create two separate tenants
    tenant1User = await createTenantUser({ tenantId: 'tenant-1', role: 'owner' });
    tenant2User = await createTenantUser({ tenantId: 'tenant-2', role: 'owner' });

    // Create test data for each tenant
    await db.as(tenant1User).audits.create({ domain: 'tenant1.com' });
    await db.as(tenant2User).audits.create({ domain: 'tenant2.com' });
  });

  test('User can only query their own tenant data', async () => {
    setCurrentUser(tenant1User);

    const audits = await db.query('SELECT * FROM audits');

    expect(audits).toHaveLength(1);
    expect(audits[0].domain).toBe('tenant1.com');
    expect(audits[0].tenant_id).toBe('tenant-1');
  });

  test('Raw SQL queries respect RLS policies', async () => {
    setCurrentUser(tenant1User);

    // Attempt to bypass ORM with raw SQL
    const leak = await db.raw('SELECT * FROM audits WHERE tenant_id = $1', ['tenant-2']);

    expect(leak.rows).toHaveLength(0); // RLS blocks cross-tenant query
  });

  test('JOINs respect tenant boundaries', async () => {
    // Create related data
    await db.as(tenant1User).users.create({ email: 'user@tenant1.com' });
    await db.as(tenant2User).users.create({ email: 'user@tenant2.com' });

    setCurrentUser(tenant1User);

    const results = await db.query(`
      SELECT audits.*, users.email
      FROM audits
      JOIN users ON users.tenant_id = audits.tenant_id
    `);

    expect(results.every(r => r.tenant_id === 'tenant-1')).toBe(true);
    expect(results.find(r => r.email.includes('tenant2'))).toBeUndefined();
  });

  test('INSERT prevents cross-tenant data insertion', async () => {
    setCurrentUser(tenant1User);

    // Attempt to insert data for different tenant
    await expect(
      db.query('INSERT INTO audits (domain, tenant_id) VALUES ($1, $2)',
        ['malicious.com', 'tenant-2']
      )
    ).rejects.toThrow(/violates row-level security policy/);
  });

  test('UPDATE cannot modify other tenant records', async () => {
    const tenant2Audit = await db.as(tenant2User).audits.create({ domain: 'tenant2.com' });

    setCurrentUser(tenant1User);

    // Attempt to update tenant2 audit
    const result = await db.query(
      'UPDATE audits SET domain = $1 WHERE id = $2',
      ['hacked.com', tenant2Audit.id]
    );

    expect(result.rowCount).toBe(0); // No rows updated
    const unchanged = await db.as(tenant2User).audits.findById(tenant2Audit.id);
    expect(unchanged.domain).toBe('tenant2.com');
  });

  test('Superuser with FORCE ROW LEVEL SECURITY still respects policies', async () => {
    // Even table owner should respect RLS when FORCE is enabled
    const superuser = await db.getSuperuser();
    setCurrentUser(superuser);

    await db.raw('SET ROLE app_user'); // Switch to application role

    const audits = await db.query('SELECT * FROM audits');
    expect(audits.rows).toHaveLength(0); // No tenant context = no access
  });
});
```

---

## Critical Test Suite #3: Stripe Billing Integration

### Webhook Event Testing

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import Stripe from 'stripe';
import { createWebhookPayload, signWebhookPayload } from './stripe-helpers';

describe('Stripe Billing Webhooks', () => {
  let user: User;
  let stripeCustomer: Stripe.Customer;

  beforeEach(async () => {
    user = await db.createUser({ email: 'test@example.com', plan: 'free' });
    stripeCustomer = await stripe.customers.create({ email: user.email });
    await db.updateUser(user.id, { stripeCustomerId: stripeCustomer.id });
  });

  test('invoice.paid upgrades user to pro immediately', async () => {
    const payload = createWebhookPayload({
      type: 'invoice.paid',
      data: {
        customer: stripeCustomer.id,
        subscription: 'sub_123',
        amount_paid: 2900, // $29
        currency: 'usd'
      }
    });

    const signature = signWebhookPayload(payload, process.env.STRIPE_WEBHOOK_SECRET);

    const response = await fetch('/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(200);

    const updatedUser = await db.getUser(user.id);
    expect(updatedUser.plan).toBe('pro');
    expect(updatedUser.subscriptionStatus).toBe('active');
    expect(updatedUser.stripeSubscriptionId).toBe('sub_123');
  });

  test('customer.subscription.updated handles status transitions', async () => {
    // Setup: user has active subscription
    await db.updateUser(user.id, {
      plan: 'pro',
      subscriptionStatus: 'active',
      stripeSubscriptionId: 'sub_123'
    });

    // Simulate payment failure → past_due
    const payload = createWebhookPayload({
      type: 'customer.subscription.updated',
      data: {
        id: 'sub_123',
        customer: stripeCustomer.id,
        status: 'past_due'
      }
    });

    await sendWebhook('/api/webhooks/stripe', payload);

    const user = await db.getUser(user.id);
    expect(user.subscriptionStatus).toBe('past_due');
    expect(user.hasProAccess).toBe(false); // Access blocked
  });

  test('customer.subscription.deleted maintains access until period_end', async () => {
    const currentPeriodEnd = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now

    await db.updateUser(user.id, {
      plan: 'pro',
      subscriptionStatus: 'active',
      stripeSubscriptionId: 'sub_123'
    });

    const payload = createWebhookPayload({
      type: 'customer.subscription.deleted',
      data: {
        id: 'sub_123',
        customer: stripeCustomer.id,
        current_period_end: currentPeriodEnd,
        status: 'canceled'
      }
    });

    await sendWebhook('/api/webhooks/stripe', payload);

    const user = await db.getUser(user.id);
    expect(user.subscriptionStatus).toBe('canceled');
    expect(user.hasProAccess).toBe(true); // Still has access until period end
    expect(user.subscriptionEndsAt.getTime()).toBe(currentPeriodEnd * 1000);
  });

  test('Invalid webhook signature is rejected', async () => {
    const payload = createWebhookPayload({ type: 'invoice.paid' });
    const invalidSignature = 'fake-signature-12345';

    const response = await fetch('/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': invalidSignature,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid signature'
    });

    // User plan should NOT have changed
    const user = await db.getUser(user.id);
    expect(user.plan).toBe('free');
  });

  test('Duplicate webhook events are idempotent', async () => {
    const payload = createWebhookPayload({
      type: 'invoice.paid',
      data: {
        id: 'in_123', // Stripe invoice ID
        customer: stripeCustomer.id,
        amount_paid: 2900
      }
    });

    // Send same webhook twice
    await sendWebhook('/api/webhooks/stripe', payload);
    await sendWebhook('/api/webhooks/stripe', payload);

    // Check user upgraded only once
    const user = await db.getUser(user.id);
    expect(user.plan).toBe('pro');

    // Check only one payment record created
    const payments = await db.payments.where({ invoiceId: 'in_123' }).all();
    expect(payments).toHaveLength(1);
  });

  test('Webhook processing failures are retried', async () => {
    const processWebhook = jest.spyOn(webhookHandler, 'process');
    processWebhook.mockRejectedValueOnce(new Error('Database timeout'));
    processWebhook.mockResolvedValueOnce({ success: true });

    const payload = createWebhookPayload({ type: 'invoice.paid' });
    await sendWebhook('/api/webhooks/stripe', payload);

    // Should retry and eventually succeed
    await wait(5000); // Wait for retry
    expect(processWebhook).toHaveBeenCalledTimes(2);

    const user = await db.getUser(user.id);
    expect(user.plan).toBe('pro'); // Eventually processed
  });
});
```

### Helper Functions

```typescript
// tests/helpers/stripe-helpers.ts
import crypto from 'crypto';

export function createWebhookPayload(event: Partial<Stripe.Event>): Stripe.Event {
  return {
    id: `evt_${randomId()}`,
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    pending_webhooks: 1,
    request: null,
    ...event,
    data: {
      object: event.data || {},
      previous_attributes: {}
    }
  };
}

export function signWebhookPayload(payload: any, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signedPayload = `${timestamp}.${payloadString}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  return `t=${timestamp},v1=${signature}`;
}
```

---

## Critical Test Suite #4: Email Delivery Authentication

### SPF/DKIM/DMARC Verification Tests

```typescript
import { describe, test, expect } from 'vitest';
import dns from 'dns/promises';
import { sendEmail, verifyDKIMSignature } from './email-service';

describe('Email Authentication (SPF/DKIM/DMARC)', () => {
  test('SPF record includes all authorized senders', async () => {
    const txtRecords = await dns.resolveTxt('yourdomain.com');
    const spfRecord = txtRecords.flat().find(r => r.startsWith('v=spf1'));

    expect(spfRecord).toBeDefined();
    expect(spfRecord).toContain('include:_spf.google.com'); // Google Workspace
    expect(spfRecord).toContain('include:sendgrid.net'); // SendGrid
    expect(spfRecord).toContain('~all'); // Soft fail for others
  });

  test('DKIM signature validates for outbound emails', async () => {
    const email = await sendEmail({
      to: 'test@example.com',
      from: 'noreply@yourdomain.com',
      subject: 'Test Email',
      html: '<p>Test content</p>'
    });

    // Extract DKIM signature from email headers
    const dkimHeader = email.headers['dkim-signature'];
    expect(dkimHeader).toMatch(/d=yourdomain\.com/);

    // Verify signature
    const isValid = await verifyDKIMSignature(email);
    expect(isValid).toBe(true);
  });

  test('DMARC policy enforces alignment', async () => {
    const txtRecords = await dns.resolveTxt('_dmarc.yourdomain.com');
    const dmarcRecord = txtRecords.flat()[0];

    expect(dmarcRecord).toMatch(/v=DMARC1/);
    expect(dmarcRecord).toMatch(/p=(quarantine|reject)/); // Enforcement mode
    expect(dmarcRecord).not.toMatch(/p=none/); // Not monitoring-only
    expect(dmarcRecord).toMatch(/rua=mailto:/); // Aggregate reports configured
  });

  test('Transactional email reaches inbox (not spam)', async () => {
    // Use email testing service (like mail-tester.com)
    const result = await sendTestEmail({
      to: 'test@mail-tester.com',
      subject: 'Password Reset',
      template: 'password-reset',
      data: { resetLink: 'https://app.com/reset/token123' }
    });

    // Check spam score
    const spamScore = await checkSpamScore(result.testId);
    expect(spamScore).toBeLessThan(3); // Score < 3 is good

    // Check authentication
    expect(spamScore.spf).toBe('pass');
    expect(spamScore.dkim).toBe('pass');
    expect(spamScore.dmarc).toBe('pass');
  });

  test('Email delivery tracking records success/failure', async () => {
    await sendEmail({
      to: 'user@example.com',
      subject: 'Welcome',
      messageId: 'msg-123'
    });

    // Check SendGrid/email provider webhook logged delivery
    await wait(2000);
    const delivery = await db.emailDeliveries.findOne({ messageId: 'msg-123' });

    expect(delivery).toMatchObject({
      status: 'delivered',
      openedAt: null, // Not opened yet
      clickedAt: null
    });
  });
});
```

---

## Critical Test Suite #5: Race Conditions & Concurrency

### Real-World Concurrent Update Scenarios

```typescript
import { describe, test, expect } from 'vitest';
import { db } from './test-db';

describe('Race Condition Prevention', () => {
  test('Concurrent audit limit updates use optimistic locking', async () => {
    const user = await db.createUser({ email: 'test@example.com', auditsRemaining: 3 });

    // Simulate two concurrent audit runs
    const audit1 = db.transaction(async (tx) => {
      const u = await tx.users.findById(user.id);
      if (u.auditsRemaining > 0) {
        await tx.users.update(user.id, {
          auditsRemaining: u.auditsRemaining - 1,
          version: u.version + 1
        }, { where: { version: u.version } }); // Optimistic lock
        return 'success';
      }
    });

    const audit2 = db.transaction(async (tx) => {
      const u = await tx.users.findById(user.id);
      if (u.auditsRemaining > 0) {
        await tx.users.update(user.id, {
          auditsRemaining: u.auditsRemaining - 1,
          version: u.version + 1
        }, { where: { version: u.version } });
        return 'success';
      }
    });

    // Run concurrently
    const results = await Promise.allSettled([audit1, audit2]);

    // One should succeed, one should fail with optimistic lock error
    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    // Final count should be 2 (started at 3, decremented once)
    const finalUser = await db.users.findById(user.id);
    expect(finalUser.auditsRemaining).toBe(2);
  });

  test('Duplicate payment prevented by unique constraint + idempotency', async () => {
    const idempotencyKey = 'payment-abc-123';

    // Simulate double-click on "Pay Now" button
    const payment1 = createPayment({
      userId: user.id,
      amount: 2900,
      idempotencyKey
    });

    const payment2 = createPayment({
      userId: user.id,
      amount: 2900,
      idempotencyKey
    });

    const results = await Promise.all([payment1, payment2]);

    // Both should return same payment ID
    expect(results[0].id).toBe(results[1].id);

    // Only one charge in database
    const charges = await db.charges.where({ userId: user.id }).all();
    expect(charges).toHaveLength(1);
    expect(charges[0].amount).toBe(2900);
  });

  test('Subscription cancellation race condition handled', async () => {
    const subscriptionId = 'sub_123';
    await db.createSubscription({ id: subscriptionId, userId: user.id, status: 'active' });

    // User clicks "Cancel" button twice quickly
    const cancel1 = cancelSubscription(subscriptionId);
    const cancel2 = cancelSubscription(subscriptionId);

    await Promise.all([cancel1, cancel2]);

    // Check only one cancellation API call to Stripe
    expect(stripeMock.subscriptions.cancel).toHaveBeenCalledTimes(1);

    // Check subscription marked as canceled
    const sub = await db.subscriptions.findById(subscriptionId);
    expect(sub.status).toBe('canceled');
  });
});
```

---

## Critical Test Suite #6: GDPR Compliance

### Right to Erasure Implementation

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import { advanceTime } from './time-helpers';

describe('GDPR Right to Erasure', () => {
  test('Data export includes all user personal data', async () => {
    const user = await db.createUser({ email: 'test@example.com', name: 'Test User' });
    await db.audits.create({ userId: user.id, domain: 'example.com' });
    await db.sessions.create({ userId: user.id, token: 'session-token' });

    const exportData = await requestDataExport(user.id);

    expect(exportData).toMatchObject({
      profile: {
        email: 'test@example.com',
        name: 'Test User',
        createdAt: expect.any(String)
      },
      audits: expect.arrayContaining([
        expect.objectContaining({ domain: 'example.com' })
      ]),
      sessions: expect.arrayContaining([
        expect.objectContaining({ token: expect.any(String) })
      ]),
      subscriptions: expect.any(Array),
      loginHistory: expect.any(Array)
    });
  });

  test('Deletion request soft-deletes immediately', async () => {
    const user = await db.createUser({ email: 'test@example.com' });

    await requestDeletion(user.id);

    // User cannot log in
    await expect(login('test@example.com', 'password')).rejects.toThrow(/account not found/i);

    // User data marked as deleted
    const deleted = await db.users.findById(user.id);
    expect(deleted.deletedAt).toBeTruthy();
    expect(deleted.email).toMatch(/^deleted-\w+@anonymized\.local$/);
  });

  test('Hard delete purges all data after 30-day TTL', async () => {
    const user = await db.createUser({ email: 'test@example.com' });
    await db.audits.create({ userId: user.id, domain: 'example.com' });
    await db.sessions.create({ userId: user.id, token: 'session-123' });

    await requestDeletion(user.id);

    // Advance time 30 days
    await advanceTime(30, 'days');
    await runHardDeleteCron();

    // User completely removed from database
    expect(await db.raw('SELECT * FROM users WHERE id = $1', [user.id])).toHaveLength(0);
    expect(await db.raw('SELECT * FROM audits WHERE user_id = $1', [user.id])).toHaveLength(0);
    expect(await db.raw('SELECT * FROM sessions WHERE user_id = $1', [user.id])).toHaveLength(0);

    // Deletion request logged (for backup replay)
    const deletionLog = await db.deletionRequests.findOne({ userId: user.id });
    expect(deletionLog).toMatchObject({
      userId: user.id,
      requestedAt: expect.any(Date),
      completedAt: expect.any(Date)
    });
  });

  test('Backup restoration replays deletion requests', async () => {
    const user = await db.createUser({ email: 'test@example.com' });
    await requestDeletion(user.id);
    await advanceTime(15, 'days');

    // Simulate database restore from 10-day-old backup
    const backupData = await loadBackup('10-days-ago');
    await db.restoreFrom(backupData);

    // User data is back from backup
    let restoredUser = await db.users.findById(user.id);
    expect(restoredUser).toBeDefined();

    // Replay deletion requests
    await replayDeletionRequests();

    // User should be deleted again
    restoredUser = await db.users.findById(user.id);
    expect(restoredUser.deletedAt).toBeTruthy();
  });
});
```

---

## Critical Test Suite #7: User Onboarding & Activation

### Time-to-Value Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Onboarding & Activation', () => {
  test('New user reaches first value within 60 seconds', async ({ page }) => {
    const startTime = Date.now();

    // 1. Sign up (skip email verification for test)
    await page.goto('/signup');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Auto-verify for test
    await db.verifyUser(email);

    // 2. Minimal onboarding
    await expect(page).toHaveURL('/onboarding');
    await page.fill('[name="companyName"]', 'Test Inc');
    await page.click('button:text("Continue")');

    // Skip optional steps
    await page.click('button:text("Skip")');

    // 3. Run first audit
    await expect(page).toHaveURL('/dashboard');
    await page.fill('[name="domain"]', 'example.com');
    await page.click('button:text("Analyze")');

    // 4. See first results
    await expect(page.getByText(/AI Search Readiness/i)).toBeVisible({ timeout: 30000 });

    const timeToValue = Date.now() - startTime;
    expect(timeToValue).toBeLessThan(60000); // Under 60 seconds
  });

  test('Onboarding has maximum 5 required steps', async ({ page }) => {
    await page.goto('/onboarding');

    const steps = await page.locator('[data-onboarding-step]').count();
    expect(steps).toBeLessThanOrEqual(5);
  });

  test('Progress indicator shows completion percentage', async ({ page }) => {
    await page.goto('/onboarding');

    const progress = page.getByRole('progressbar');
    expect(await progress.getAttribute('aria-valuenow')).toBe('0');

    await page.click('button:text("Continue")');
    expect(await progress.getAttribute('aria-valuenow')).toBe('33');

    await page.click('button:text("Continue")');
    expect(await progress.getAttribute('aria-valuenow')).toBe('66');
  });

  test('Empty dashboard offers sample data generation', async ({ page }) => {
    const newUser = await db.createUser({ email: 'empty@example.com' });
    await loginAs(page, newUser);

    await page.goto('/dashboard');
    await expect(page.getByText(/no audits yet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /generate sample/i })).toBeVisible();

    await page.click('button:text("Generate sample audit")');

    await expect(page.getByText('example.com')).toBeVisible();
    const audits = await db.audits.where({ userId: newUser.id }).all();
    expect(audits).toHaveLength(1);
  });

  test('Drop-off analytics tracks where users abandon', async () => {
    // Simulate 100 users going through onboarding
    for (let i = 0; i < 100; i++) {
      const user = await createUser();

      await trackEvent({ userId: user.id, event: 'onboarding_started' });

      if (Math.random() > 0.2) {
        await trackEvent({ userId: user.id, event: 'step_1_completed' });
      }

      if (Math.random() > 0.4) {
        await trackEvent({ userId: user.id, event: 'step_2_completed' });
      }

      if (Math.random() > 0.3) {
        await trackEvent({ userId: user.id, event: 'onboarding_completed' });
      }
    }

    const analytics = await getOnboardingAnalytics();

    expect(analytics).toMatchObject({
      started: 100,
      completedStep1: expect.any(Number),
      completedStep2: expect.any(Number),
      completed: expect.any(Number),
      dropoffRate: expect.any(Number)
    });

    // Identify biggest drop-off point
    expect(analytics.biggestDropoff).toMatch(/step_[12]/);
  });
});
```

---

## Critical Test Suite #8: Mobile Responsiveness

### Viewport Testing Across Devices

```typescript
import { test, expect, devices } from '@playwright/test';

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },   // iPhone SE
  tablet: { width: 768, height: 1024 },  // iPad
  desktop: { width: 1280, height: 720 }  // Desktop
};

test.describe('Mobile Responsiveness', () => {
  test('All interactive elements meet 44px touch target minimum', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');

    const interactiveElements = await page.locator('button, a[href], input, select, textarea').all();

    for (const element of interactiveElements) {
      const box = await element.boundingBox();
      if (!box) continue; // Element not visible, skip

      expect(box.width, `Element ${await element.textContent()} width`).toBeGreaterThanOrEqual(44);
      expect(box.height, `Element ${await element.textContent()} height`).toBeGreaterThanOrEqual(44);
    }
  });

  test('No horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');

    const body = await page.locator('body').boundingBox();
    expect(body.width).toBeLessThanOrEqual(375);

    // Scroll through entire page checking for overflow
    let previousScrollY = 0;
    while (true) {
      await page.evaluate(() => window.scrollBy(0, 500));
      const currentScrollY = await page.evaluate(() => window.scrollY);

      if (currentScrollY === previousScrollY) break; // Reached bottom
      previousScrollY = currentScrollY;

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    }
  });

  test('Mobile navigation menu works correctly', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');

    // Desktop nav should be hidden
    const desktopNav = page.getByRole('navigation').filter({ has: page.getByText('Planner') });
    await expect(desktopNav).toBeHidden();

    // Mobile menu button should be visible
    const menuButton = page.getByRole('button', { name: /menu/i });
    await expect(menuButton).toBeVisible();

    // Click to open
    await menuButton.click();
    await expect(page.getByRole('link', { name: 'Planner' })).toBeVisible();
  });

  test('Form inputs are usable on mobile keyboard', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');

    const input = page.getByPlaceholder(/enter domain/i);

    // Focus input (should trigger mobile keyboard)
    await input.focus();

    // Type on mobile keyboard
    await page.keyboard.type('example.com');

    expect(await input.inputValue()).toBe('example.com');

    // Keyboard should not obscure submit button
    const submitButton = page.getByRole('button', { name: /analyze/i });
    expect(await submitButton.isVisible()).toBe(true);
  });

  test('Images are responsive and dont break layout', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto('/');

    const images = await page.locator('img').all();

    for (const img of images) {
      const box = await img.boundingBox();
      if (!box) continue;

      // Image should not exceed viewport width
      expect(box.width).toBeLessThanOrEqual(375);

      // Image should have loaded
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });
});
```

---

## Testing Infrastructure Setup

### Docker Compose for Local Testing

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: saas_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for speed

  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

  stripe-mock:
    image: stripe/stripe-mock:latest
    ports:
      - "12111:12111"
```

### Test Database Helper

```typescript
// tests/helpers/test-db.ts
import { GenericContainer } from 'testcontainers';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

let container: StartedTestContainer;
let db: Database;

export async function setupTestDatabase() {
  // Start PostgreSQL container
  container = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_DB: 'test',
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test'
    })
    .withExposedPorts(5432)
    .start();

  const connectionString = `postgres://test:test@${container.getHost()}:${container.getMappedPort(5432)}/test`;
  const client = postgres(connectionString);
  db = drizzle(client);

  // Run migrations
  await migrate(db, { migrationsFolder: './drizzle' });

  // Enable RLS
  await db.execute(`
    ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

    CREATE POLICY tenant_isolation ON audits
      USING (tenant_id = current_setting('app.tenant_id', true));
  `);

  return db;
}

export async function teardownTestDatabase() {
  await container.stop();
}

export function setCurrentUser(user: User) {
  db.execute(`SET LOCAL app.tenant_id = '${user.tenantId}'`);
  db.execute(`SET LOCAL app.user_id = '${user.id}'`);
}
```

### Stripe Mock Helper

```typescript
// tests/helpers/stripe-mock.ts
import { createServer } from 'http';

export function setupStripeMock() {
  const events: Stripe.Event[] = [];

  const server = createServer((req, res) => {
    if (req.url === '/v1/webhook_endpoints' && req.method === 'POST') {
      // Mock webhook endpoint creation
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'we_123', url: 'http://localhost:3000/webhooks/stripe' }));
    }
  });

  return {
    server,
    triggerEvent: async (event: Stripe.Event) => {
      events.push(event);
      const signature = signWebhook(event, process.env.STRIPE_WEBHOOK_SECRET);

      await fetch('http://localhost:3000/webhooks/stripe', {
        method: 'POST',
        headers: {
          'stripe-signature': signature,
          'content-type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    },
    getEvents: () => events
  };
}
```

---

## Performance Testing Framework

### Load Testing for API Endpoints

```typescript
import { describe, test } from 'vitest';
import autocannon from 'autocannon';

describe('Performance & Load Testing', () => {
  test('API endpoint handles 100 concurrent requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:3000/api/audits',
      connections: 100,
      duration: 10, // 10 seconds
      headers: {
        'authorization': `Bearer ${testToken}`
      }
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.latency.p95).toBeLessThan(200); // p95 < 200ms
    expect(result.requests.average).toBeGreaterThan(500); // 500+ req/sec
  });

  test('Database query performance under load', async () => {
    // Create 10,000 audit records
    await db.bulkInsert('audits', generateAudits(10000));

    const startTime = Date.now();
    const results = await db.query(`
      SELECT * FROM audits
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, ['tenant-1']);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(50); // Under 50ms
    expect(results).toHaveLength(20);
  });

  test('Search responds in under 100ms at scale', async () => {
    // Index 50,000 documents
    await searchIndex.bulkIndex(generateSearchDocs(50000));

    const measurements = [];
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await search('test query');
      measurements.push(Date.now() - start);
    }

    const p95 = measurements.sort((a, b) => a - b)[94]; // 95th percentile
    expect(p95).toBeLessThan(100);
  });
});
```

---

## CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run migrate:test
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@postgres:5432/test
          REDIS_URL: redis://redis:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - run: npx snyk test --severity-threshold=high
```

---

## Test Data Factories

### User Factory

```typescript
// tests/factories/user-factory.ts
import { faker } from '@faker-js/faker';

export function createUserData(overrides: Partial<User> = {}): UserData {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: faker.internet.password({ length: 12 }),
    tenantId: faker.string.uuid(),
    role: 'user',
    plan: 'free',
    emailVerified: false,
    ...overrides
  };
}

export async function createUser(overrides: Partial<User> = {}): Promise<User> {
  const data = createUserData(overrides);
  return await db.users.create(data);
}

export async function createVerifiedUser(overrides: Partial<User> = {}): Promise<User> {
  return await createUser({ emailVerified: true, ...overrides });
}

export async function createProUser(overrides: Partial<User> = {}): Promise<User> {
  return await createUser({
    plan: 'pro',
    subscriptionStatus: 'active',
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(14)}`,
    ...overrides
  });
}
```

### Audit Factory

```typescript
// tests/factories/audit-factory.ts
export function createAuditData(overrides: Partial<Audit> = {}): AuditData {
  return {
    domain: faker.internet.domainName(),
    userId: null, // Set by test
    tenantId: null, // Set by test
    score: faker.number.int({ min: 0, max: 100 }),
    status: 'completed',
    checks: {
      robotsTxt: { passed: true, score: 100 },
      llmsTxt: { passed: false, score: 0 },
      structuredData: { passed: true, score: 85 }
    },
    ...overrides
  };
}
```

---

## Test Execution Strategy

### Local Development

```bash
# Run unit tests on file change
npm run test:watch

# Run specific test file
npm test auth.test.ts

# Run tests with coverage
npm run test:coverage
```

### Pre-Commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

# Run type check
npm run typecheck || exit 1

# Run unit tests
npm run test:unit || exit 1

# Run linter
npm run lint || exit 1

echo "✅ Pre-commit checks passed"
```

### Pre-Push Hook

```bash
#!/bin/sh
# .husky/pre-push

# Run full test suite
npm run test:all || exit 1

# Check for console.log statements in committed code
if git diff --cached | grep -E "console\.(log|debug|info)"; then
  echo "❌ Remove console.log statements before pushing"
  exit 1
fi

echo "✅ Pre-push checks passed"
```

---

## Coverage Enforcement

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,

        // Critical paths require higher coverage
        'src/lib/auth/**': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90
        },
        'src/routes/api/webhooks/**': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95
        }
      }
    },
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000
  }
});
```

---

## Quick Reference: Test Checklist Before Launch

### Critical Path Tests (Must Pass)

```bash
# 1. Authentication
✅ User can sign up with email/password
✅ User receives verification email
✅ Email verification link works
✅ User can log in with credentials
✅ Password reset flow works end-to-end
✅ Invalid credentials show appropriate error
✅ Session expires after timeout
✅ MFA enrollment and login works

# 2. Authorization
✅ Non-admin cannot access admin endpoints
✅ User can only read their own data
✅ User cannot update other users' data
✅ Cross-tenant access is blocked
✅ Privilege escalation attempts fail

# 3. Billing
✅ invoice.paid upgrades user to pro
✅ customer.subscription.deleted maintains access until period_end
✅ Past_due status blocks pro features
✅ Invalid webhook signature rejected
✅ Duplicate webhooks are idempotent

# 4. Data Integrity
✅ Concurrent updates use optimistic locking
✅ Duplicate payments prevented
✅ Race conditions don't corrupt data
✅ Database constraints enforced

# 5. Email
✅ SPF record configured correctly
✅ DKIM signing enabled
✅ DMARC policy is enforce mode
✅ Transactional emails deliver to inbox

# 6. GDPR
✅ Data export returns all user data
✅ Soft delete hides data immediately
✅ Hard delete purges after 30 days
✅ Cookie consent blocks tracking

# 7. Mobile
✅ Touch targets ≥ 44px
✅ No horizontal overflow at 375px
✅ Mobile navigation works
✅ Forms usable with mobile keyboard

# 8. Performance
✅ API p95 latency < 200ms
✅ Search responds in < 100ms
✅ Database queries optimized (no N+1)
✅ Core Web Vitals pass (LCP < 2.5s)

# 9. User Experience
✅ Form validation (client + server)
✅ Toast notifications accessible
✅ Loading states for async ops
✅ Error messages are helpful
✅ Empty states offer value

# 10. Security
✅ Rate limiting blocks abuse
✅ File uploads reject malicious types
✅ SQL injection prevented
✅ XSS attacks sanitized
✅ CSRF tokens on forms
```

---

## Test Execution Times

### Target Benchmarks

| Test Type | Quantity | Individual Runtime | Total Time | Run Frequency |
|-----------|----------|-------------------|------------|---------------|
| Unit | 500-1000 | < 10ms | < 10s | On every save |
| Integration | 100-200 | 50-200ms | 10-30s | On commit |
| E2E | 20-40 | 2-10s | 1-5min | On push |
| Performance | 5-10 | 10-30s | 2-5min | Nightly |

### Optimization Strategies

**Unit Tests:**
- Mock all external dependencies (DB, APIs, file system)
- Use in-memory data structures
- Avoid async operations where possible

**Integration Tests:**
- Use test containers with tmpfs (in-memory storage)
- Run database in transaction, rollback after each test
- Parallelize test files

**E2E Tests:**
- Run critical paths only
- Use `--shard` to split across CI workers
- Record videos only on failure

---

## Continuous Improvement

### Test Metrics to Track

```typescript
// tests/metrics.ts
export const TEST_METRICS = {
  coverage: {
    current: 85.2,
    target: 90,
    critical_paths: 95.1
  },
  execution_time: {
    unit: 8.3, // seconds
    integration: 24.1,
    e2e: 187.5,
    total: 219.9
  },
  flakiness: {
    flaky_tests: 2,
    total_tests: 687,
    flake_rate: 0.29 // < 1% is good
  },
  failure_analysis: {
    last_30_days: {
      total_runs: 847,
      failures: 12,
      failure_rate: 1.4 // %
    }
  }
};
```

### Weekly Test Health Check

```bash
#!/bin/bash
# scripts/test-health-check.sh

echo "📊 Test Suite Health Report"
echo "----------------------------"

# Coverage
COVERAGE=$(npm run test:coverage --silent | grep "All files" | awk '{print $10}')
echo "Coverage: $COVERAGE"

# Execution time
TIME=$(npm test --silent 2>&1 | grep "Test Files" | awk '{print $NF}')
echo "Execution time: $TIME"

# Flaky tests (failed in last run but passed in retry)
FLAKY=$(grep "FLAKY" test-results.json | wc -l)
echo "Flaky tests: $FLAKY"

# Generate report
npm run test:report
open coverage/index.html
```

---

## Common Testing Anti-Patterns

### ❌ Don't: Test Implementation Details

```typescript
// BAD: Testing internal state
test('counter increments internal value', () => {
  const counter = new Counter();
  counter.increment();
  expect(counter._value).toBe(1); // Testing private implementation
});

// GOOD: Test behavior
test('counter displays incremented value', () => {
  const counter = render(<Counter />);
  userEvent.click(counter.getByRole('button', { name: '+' }));
  expect(counter.getByText('1')).toBeVisible();
});
```

### ❌ Don't: Over-Mock Integration Tests

```typescript
// BAD: Mocking database in "integration" test
test('creates user', async () => {
  db.users.create = jest.fn().mockResolvedValue({ id: 1 });
  await createUser({ email: 'test@example.com' });
  expect(db.users.create).toHaveBeenCalled(); // Not testing real DB
});

// GOOD: Use real database (via testcontainers)
test('creates user', async () => {
  const user = await createUser({ email: 'test@example.com' });
  const found = await db.users.findById(user.id);
  expect(found.email).toBe('test@example.com');
});
```

### ❌ Don't: Flaky Time-Based Tests

```typescript
// BAD: Relying on real timers
test('session expires after 15 minutes', async () => {
  const session = await createSession();
  await wait(15 * 60 * 1000); // Wait 15 minutes
  expect(await isSessionValid(session.token)).toBe(false);
});

// GOOD: Use fake timers
test('session expires after 15 minutes', async () => {
  vi.useFakeTimers();
  const session = await createSession();

  vi.advanceTimersByTime(15 * 60 * 1000);

  expect(await isSessionValid(session.token)).toBe(false);
  vi.useRealTimers();
});
```

---

## Advanced Testing Patterns

### Contract Testing for API Integrations

```typescript
import { Pact } from '@pact-foundation/pact';

describe('Stripe API Contract', () => {
  const provider = new Pact({
    consumer: 'YourSaaS',
    provider: 'Stripe'
  });

  test('creates subscription', async () => {
    await provider.addInteraction({
      state: 'customer exists',
      uponReceiving: 'a request to create subscription',
      withRequest: {
        method: 'POST',
        path: '/v1/subscriptions',
        body: {
          customer: 'cus_123',
          items: [{ price: 'price_pro_monthly' }]
        }
      },
      willRespondWith: {
        status: 200,
        body: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'active'
        }
      }
    });

    const subscription = await stripe.subscriptions.create({
      customer: 'cus_123',
      items: [{ price: 'price_pro_monthly' }]
    });

    expect(subscription.status).toBe('active');
  });
});
```

### Mutation Testing (Confidence in Tests)

```typescript
// Install: npm install -D @stryker-mutator/core

// stryker.conf.json
{
  "mutate": [
    "src/lib/auth/**/*.ts",
    "src/lib/billing/**/*.ts",
    "!src/**/*.test.ts"
  ],
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}

// Run mutation testing
// npm run stryker run

// This will introduce bugs into your code and verify tests catch them
// If mutation score is low, tests aren't thorough enough
```

---

## Quick Start: First 10 Tests to Write

For a new SaaS project, write these tests FIRST:

1. ✅ **User can sign up** (E2E)
2. ✅ **User can log in** (E2E)
3. ✅ **User cannot access other user's data** (Integration)
4. ✅ **API returns 401 for unauthenticated requests** (Integration)
5. ✅ **Form validation rejects invalid email** (Unit)
6. ✅ **Stripe webhook upgrades user plan** (Integration)
7. ✅ **Email sends successfully** (Integration with MailHog)
8. ✅ **Rate limit blocks excessive requests** (Integration)
9. ✅ **Mobile viewport doesn't overflow** (E2E)
10. ✅ **Search returns results quickly** (Integration)

These 10 tests cover the most critical failure modes and give you confidence to deploy.

---

## Resources for Learning TDD

### Books
- "Test Driven Development: By Example" by Kent Beck
- "Growing Object-Oriented Software, Guided by Tests" by Steve Freeman

### Courses
- Test-Driven Development with Node.js (Udemy)
- Testing JavaScript (Kent C. Dodds - testingjavascript.com)

### Communities
- r/testing on Reddit
- Software Testing Discord
- TDD practitioners on Twitter/X

### Tools Documentation
- Vitest: https://vitest.dev
- Playwright: https://playwright.dev
- Testing Library: https://testing-library.com
- Testcontainers: https://testcontainers.com

---

## Conclusion

**The difference between shipping and shipping with confidence:**

- Shipping without tests: Hope nothing breaks, debug in production, user complaints
- Shipping with tests: Know what works, catch regressions early, deploy fearlessly

**4/5-star quality requires:**
- Tests for all critical paths (auth, billing, data access)
- E2E tests for core user flows
- Integration tests for third-party APIs
- Performance tests for slow operations
- Mobile tests for responsive design

**Start small, iterate fast:**
Write 10 tests → Deploy → Gather feedback → Add tests for bugs found → Repeat

The best test suite is one that catches real bugs before users do.
