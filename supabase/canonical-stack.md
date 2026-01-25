# MicroSaaSBot Canonical Stack

## Non-Negotiable Technology Choices

MicroSaaSBot operates on a **fixed, opinionated stack**. This eliminates decision paralysis and enables failure-pattern-driven learning.

| Component | Technology | Version | Why This (Not Alternatives) |
|-----------|-----------|---------|------------------------------|
| **Framework** | Next.js App Router | ≥14.0.0 | React Server Components, Server Actions, best Vercel integration. NOT Pages Router, Remix, or SvelteKit. |
| **Database** | Supabase | latest | Postgres + Auth + RLS + Realtime in one service. NOT PlanetScale, Neon, or raw Postgres. |
| **Payments** | Stripe | latest | Industry standard, best webhooks, Customer Portal. NOT LemonSqueezy or Paddle. |
| **UI** | Shadcn/ui + Tailwind | latest | Copy-paste components, full control, accessible. NOT MUI, Chakra, or DaisyUI. |
| **Deployment** | Vercel | latest | Zero-config Next.js, edge functions, preview deployments. NOT Netlify, Railway, or fly.io. |
| **Email (Transactional)** | Resend | latest | Developer-friendly, React Email support. NOT SendGrid or Postmark. |
| **Auth** | Supabase Auth | latest | Integrated with DB, RLS-native. NOT NextAuth, Clerk, or Auth0. |

## Why These Specific Choices?

### 1. Next.js 14+ App Router (Not Pages Router)
- **Server Components** reduce client JS bundle size
- **Server Actions** eliminate API routes for mutations
- **Streaming** improves perceived performance
- **Why not Pages Router?** Deprecated patterns, no RSC support
- **Why not SvelteKit/Remix?** Smaller ecosystem, fewer examples, worse Vercel integration

### 2. Supabase (Not Separate Auth + DB)
- **RLS policies** > middleware auth checks (security at data layer)
- **Realtime subscriptions** built-in (no separate WebSocket service)
- **Auth + Storage + DB** in one service (reduces complexity)
- **Why not PlanetScale?** No RLS, limited free tier, branching adds complexity
- **Why not raw Postgres?** Need to build auth, storage, realtime separately

### 3. Stripe (Not LemonSqueezy/Paddle)
- **Customer Portal** (self-service subscription management)
- **Webhook reliability** (delivery guarantees, retries)
- **Global coverage** (supports most countries)
- **Why not LemonSqueezy?** Merchant of record model limits control, newer/less proven
- **Why not Paddle?** Similar merchant of record limitations, less flexible

### 4. Shadcn/ui + Tailwind (Not Component Libraries)
- **Copy-paste model** (full control, no black boxes)
- **Radix UI primitives** (accessible by default)
- **Tailwind** (utility-first, no CSS-in-JS runtime cost)
- **Why not MUI?** Heavy bundle size, opinionated design, hard to customize
- **Why not Chakra?** Runtime CSS-in-JS overhead, breaking changes between versions

### 5. Vercel (Not Self-Hosting)
- **Zero-config deployment** for Next.js (framework-aware)
- **Edge Functions** (low-latency globally)
- **Preview deployments** (automatic PR previews)
- **Why not Netlify?** Worse Next.js support, slower edge functions
- **Why not Railway/fly.io?** Require Docker setup, no framework-specific optimizations

### 6. Resend (Not Traditional ESPs)
- **React Email** (JSX for email templates)
- **Developer-first** (better DX than SendGrid)
- **Generous free tier** (100 emails/day)
- **Why not SendGrid?** Clunky API, marketing-focused, expensive for transactional
- **Why not Postmark?** More expensive, no React Email integration

### 7. Supabase Auth (Not NextAuth/Clerk)
- **RLS integration** (auth.uid() in policies)
- **Session management** (JWTs, refresh tokens handled)
- **Social providers** (Google, GitHub, etc. configured in dashboard)
- **Why not NextAuth?** Requires separate session storage, no RLS integration
- **Why not Clerk?** Expensive ($25/month after 10k MAU), vendor lock-in

## Stack Interactions (Where Failures Happen)

Understanding how components interact is critical for debugging:

```
User Action
    ↓
Next.js App Router (page.tsx / route.ts)
    ↓
Middleware (auth check via Supabase)
    ↓
Server Component / Server Action / API Route
    ↓
Supabase Client (queries with RLS)
    ↓
PostgreSQL (RLS policies evaluated with auth.uid())
    ↓
Response (back through the chain)
```

**Common failure points:**
1. **Middleware ↔ Supabase Auth:** Session cookie not set/expired
2. **API Route ↔ Supabase Client:** Using anon key when service role needed
3. **Supabase Client ↔ RLS:** Policy missing or auth.uid() returns null
4. **Next.js ↔ Stripe:** Webhook signature verification (raw body parsing)
5. **Vercel Edge ↔ Supabase:** Cold start initialization issues

## Environment Variables (Standard Naming)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only, bypasses RLS

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend
RESEND_API_KEY=re_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or https://yourdomain.com
```

## File Structure (Standard Layout)

```
/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   └── stripe/
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   └── ...
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── stripe.ts
│   └── middleware.ts
├── supabase/
│   └── migrations/
└── package.json
```

## Decision Trees (Built-In)

### When to use Server Actions vs API Routes?

| Use Case | Choice | Why |
|----------|--------|-----|
| Form submission | Server Action | Built-in progressive enhancement, automatic revalidation |
| Webhook handler | API Route | Need raw request body, external service calling |
| Public API endpoint | API Route | Needs to be callable outside your app |
| Internal mutation | Server Action | Simpler, fewer files, automatic CSRF protection |
| File upload | Server Action | Can stream FormData directly |

### When to use RLS vs middleware auth?

| Use Case | Choice | Why |
|----------|--------|-----|
| User-specific data | RLS | Security at data layer, can't be bypassed |
| Page-level access control | Middleware | Redirect before page loads |
| Admin operations | Service Role Key | Bypass RLS when needed |
| Public data with rate limiting | Middleware | RLS doesn't handle rate limits |

### When to use Edge vs Node.js runtime?

| Use Case | Choice | Why |
|----------|--------|-----|
| Auth middleware | Edge | Low latency, runs globally |
| Stripe webhooks | Node.js | Need crypto lib (not available in Edge) |
| Simple API routes | Edge | Faster cold starts |
| Heavy computation | Node.js | More CPU time, full Node API |
| Database queries | Both work | Edge has cold start advantage |

## Scaffold Templates (To Be Built)

MicroSaaSBot should reference these templates instead of generating from scratch:

1. **Full MicroSaaS Starter** (auth + billing + dashboard)
2. **Supabase Auth Module** (login/signup/middleware)
3. **Stripe Subscription Module** (checkout + webhooks + portal)
4. **Email Templates** (transactional with React Email)

## Updating This Stack

**When to consider alternatives:**
- Major security vulnerability in canonical choice
- Canonical choice is officially deprecated
- Clear successor emerges with >6 months of proven stability

**How to update:**
1. Propose change with evidence (not just "X is better")
2. Document migration path from current stack
3. Update all failure patterns for new component
4. Test migration on real project
5. Update this document

**Do NOT casually swap components based on trends.**

---

## For Research Agents

When researching failures:
1. Always specify the canonical technology (e.g., "Supabase" not "database")
2. Include stack interactions (e.g., "Next.js 14 App Router with Supabase Auth")
3. Verify solutions work with exact versions in this stack
4. Don't research alternatives unless evaluating a stack update
