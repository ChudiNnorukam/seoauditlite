# SEOAuditLite

Free AEO (Answer Engine Optimization) audit tool that scores your website's readiness for AI-powered search engines like ChatGPT, Perplexity, and Claude.

## What It Does

SEOAuditLite analyzes your website against 6 critical checks that determine how visible and quotable your content is to AI search engines:

- **AI Crawler Access** - Checks robots.txt for GPTBot, ClaudeBot, PerplexityBot directives
- **llms.txt** - Detects the new AI-focused content declaration file
- **Structured Data** - Evaluates JSON-LD schema quality and completeness
- **Content Extractability** - Analyzes semantic HTML structure AI can parse
- **AI Metadata** - Validates canonical URLs, OG tags, and publish dates
- **Answer Format** - Checks for FAQ/HowTo schema and quotable content structures

Results include a 0-100 AEO score, pass/warn/fail status per check, and actionable recommendations.

## Live Demo

[seoauditlite.com](https://seoauditlite.com)

## Tech Stack

- **Frontend:** SvelteKit 2 + Svelte 5
- **Database:** Turso (LibSQL)
- **Auth:** Google OAuth 2.0 (Arctic + Lucia v3)
- **Payments:** LemonSqueezy
- **Deployment:** Vercel
- **Monitoring:** Sentry

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
git clone <repo-url>
cd seoauditlite
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
TURSO_DATABASE_URL=       # Turso database connection
TURSO_AUTH_TOKEN=          # Turso auth token

# Optional (features degrade gracefully without these)
GOOGLE_CLIENT_ID=          # Google OAuth
GOOGLE_CLIENT_SECRET=      # Google OAuth
ORIGIN=https://seoauditlite.com
LEMONSQUEEZY_API_KEY=      # Billing
REPLICATE_API_TOKEN=       # OG image generation
SENTRY_DSN=                # Error tracking
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
pnpm preview
```

### Testing

```bash
pnpm test:unit      # Vitest unit tests
pnpm test:e2e       # Playwright end-to-end tests
pnpm test           # Run all tests
```

## Deployment

Deployed on Vercel with automatic builds on push to `main`.

```bash
# Type check before deploying
pnpm check

# Build
pnpm build
```

## Pricing

| Feature | Free | Pro ($29/mo) |
|---------|------|-------------|
| Audits per month | 3 | Unlimited |
| AEO score + checks | Full | Full |
| Report retention | 7 days | 30 days |
| PDF export | - | Yes |
| Score tracking | - | Yes |
| Signup required | No | Yes |

## Author

**Chudi Nnorukam** - [chudi.dev](https://chudi.dev)

## License

Proprietary. All rights reserved.
