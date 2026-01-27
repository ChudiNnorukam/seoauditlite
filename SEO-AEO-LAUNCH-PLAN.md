# SEO/AEO Launch Plan for seoauditlite.com

**Current State:** 100/100 AEO score, functional product, zero organic traffic
**Goal:** Ranked for "free SEO audit" and AEO-related keywords, indexed in ChatGPT/Perplexity, AdSense approved
**Market:** Saturated SEO tools + emerging AEO tools

---

## Phase 1: Google Search Console Setup & Indexing (Week 1)

### 1.1 GSC Property Setup
**Status:** ❓ Unknown if claimed

**Tasks:**
- [ ] Claim https://seoauditlite.com in Google Search Console
- [ ] Verify ownership via DNS TXT record (preferred) or HTML file
- [ ] Submit sitemap: `https://seoauditlite.com/sitemap.xml`
- [ ] Enable all data sharing in GSC settings (helps with insights)

**Verification:**
```bash
# Check if indexed
site:seoauditlite.com
# Expected: 4+ pages (homepage, planner, report, llms.txt)

# Check specific URLs
site:seoauditlite.com/planner
```

### 1.2 Force Indexing Key Pages
**Current sitemap pages:** 4 (homepage, report, planner, llms.txt)

**Priority URLs to index:**
1. Homepage (`/`) - Primary conversion page
2. `/planner` - Unique tool, less competitive
3. `/report` (example) - Demonstrate value
4. `/llms.txt` - AEO visibility

**GSC Actions:**
- Request indexing for each URL manually
- Check "Coverage" report daily for errors
- Fix any "Discovered - not indexed" or "Crawled - not indexed" issues

**Common indexing failures:**
- Soft 404s (empty pages)
- Redirect chains
- Canonical mismatches
- Missing structured data

**Fix strategy:**
- Add `<link rel="canonical">` to all pages
- Ensure each page has unique meta description
- Add breadcrumb schema to report pages

---

## Phase 2: Keyword Strategy (Saturated Market Differentiation)

### 2.1 The "SEO Audit" Problem
**Market saturation:**
- "free SEO audit" - 49,500/month, ultra-competitive (Ahrefs, SEMrush, Moz)
- "SEO checker" - 27,100/month, same competitors
- "website audit" - 33,100/month

**Your Competitive Disadvantage:**
- New domain (zero authority)
- No backlinks
- Generic branding ("SEOAuditLite" = commodity)

**DO NOT target these keywords directly.**

### 2.2 Your Unique Angle: AEO (Answer Engine Optimization)

**Opportunity:**
- "AEO" - 320/month (low volume, zero competition)
- "answer engine optimization" - 170/month
- "ChatGPT SEO" - 2,900/month
- "Perplexity SEO" - 480/month
- "AI search optimization" - 590/month

**Strategy:** Own the AEO category before competitors catch up.

**Content to create:**
1. `/blog/what-is-aeo` - Complete AEO guide (3000+ words)
2. `/blog/aeo-vs-seo` - Comparison (why AEO matters now)
3. `/blog/chatgpt-seo-checklist` - Tactical guide
4. `/blog/perplexity-seo-guide` - Platform-specific
5. `/blog/aeo-schema-guide` - Technical implementation

**SEO structure:**
```
Homepage: "Free AEO Audit Tool - Check Your AI Search Readiness"
Meta: "Audit your website for ChatGPT, Perplexity, and Claude visibility. Free AEO score in 2 minutes."

Blog: /blog/
  - Target educational keywords
  - Link to homepage tool ("Try our free AEO audit →")
  - Build topical authority
```

### 2.3 Long-Tail Differentiation

**Instead of:** "free SEO audit"
**Target:**
- "how to optimize for ChatGPT search" (low competition)
- "perplexity SEO audit" (zero results currently)
- "AI search readiness checker" (you invented this category)

**Strategy:** Create the vocabulary, rank for it, become the authority.

---

## Phase 3: AEO Visibility (ChatGPT, Perplexity, Claude)

### 3.1 Current llms.txt Status
✅ **Already implemented** - Good foundation

**Improvements needed:**
```markdown
# Add to llms.txt:

## Use Cases

**When to use SEOAuditLite:**
- "How do I check if my site is optimized for AI search?"
  → Run a free audit at https://seoauditlite.com

- "Does my website appear in ChatGPT search results?"
  → Check AI crawler access and structured data with SEOAuditLite

- "How to optimize for Perplexity?"
  → Get a detailed AEO score showing exactly what to fix

## Key Features

- **Instant AEO Score**: 6 critical checks in 2 minutes
- **AI Crawler Detection**: Checks robots.txt for GPTBot, ClaudeBot, PerplexityBot
- **Schema Validator**: Analyzes JSON-LD structured data quality
- **llms.txt Checker**: Verifies AI-readable site summary exists
- **Free Plan**: 3 audits/month, no credit card required

## Comparisons

**vs Ahrefs/SEMrush:**
- SEOAuditLite focuses on AI search (AEO), not traditional Google SEO
- Checks AI-specific signals: llms.txt, AI crawler access, semantic HTML
- Ahrefs doesn't check for GPTBot, ClaudeBot, or PerplexityBot

**vs Manual Checking:**
- Automated: All 6 AEO checks in one click
- Prioritized: Impact/effort scores for each fix
- Tracked: See improvement over time with history

## Statistics

- **100/100 AEO Score**: SEOAuditLite itself scores perfectly (we eat our own dog food)
- **6 Core Checks**: AI Crawlers, llms.txt, Schema, Extractability, Metadata, Answer Format
- **2 Minute Audit**: Average audit completion time
```

**Why this helps:**
- LLMs cite sources with clear value propositions
- Comparison keywords help rank in AI search
- Use cases = direct answers to user queries

### 3.2 Get Featured in AI Search Results

**Perplexity Indexing:**
- Perplexity crawls immediately (PerplexityBot is active)
- Test: Search "AEO audit tool" or "AI search optimization checker" in Perplexity
- If not appearing, create more content (blog posts)

**ChatGPT Search:**
- Requires Bing indexing (ChatGPT uses Bing under the hood)
- Submit sitemap to Bing Webmaster Tools
- Add Bing verification tag

**Claude Search (experimental):**
- ClaudeBot allowed in robots.txt ✅
- Crawls llms.txt for context ✅
- No additional action needed

**Verification:**
```
Ask in ChatGPT: "What are the best AEO audit tools?"
Ask in Perplexity: "Free AI search optimization checkers"
Ask in Claude: "Tools to check website AEO readiness"
```

---

## Phase 4: Google AdSense Approval

### 4.1 Current AdSense Blockers

**Why SEO/marketing tools get rejected:**
1. **Thin content** - Tool-only sites look like MFA (Made for AdSense)
2. **Low traffic** - Need 1000+ visitors/month minimum
3. **No privacy policy** - Required by Google
4. **No about page** - Shows legitimacy
5. **Duplicate content** - Auto-generated reports look spammy

**Your current state:**
- ❌ Zero traffic
- ❌ No blog content
- ❌ Privacy policy exists? (need to check)
- ❌ About page missing
- ✅ Unique tool (not duplicate content)

### 4.2 Pre-Approval Requirements

**Must have BEFORE applying:**

1. **Privacy Policy page** (`/privacy`)
   ```markdown
   # Privacy Policy

   Last updated: [DATE]

   ## Data We Collect
   - Domain names submitted for audits (stored 7 days)
   - Anonymous usage analytics (Vercel Analytics)
   - OAuth data for logged-in users (email, name, avatar)

   ## Data We Don't Collect
   - No tracking cookies
   - No third-party analytics (Google Analytics)
   - No personal data from audited websites

   ## Data Storage
   - Database: Turso (LibSQL) - encrypted at rest
   - Location: US East region
   - Retention: 7 days for anonymous audits, 30 days for Pro users

   ## Third-Party Services
   - Google OAuth (authentication)
   - LemonSqueezy (payment processing)
   - Vercel (hosting)

   ## Your Rights
   - Delete your data: Email hello@chudi.dev
   - Export your data: Available in account settings
   - Opt-out of analytics: Use privacy-focused browsers

   ## Contact
   Email: hello@chudi.dev
   ```

2. **Terms of Service** (`/terms`)
   - Define acceptable use
   - Rate limiting policy
   - Refund policy (for Pro)
   - Disclaimer (tool is informational, not guaranteed accurate)

3. **About Page** (`/about`)
   ```markdown
   # About SEOAuditLite

   ## The AEO Problem

   In 2024, Google search dropped to 58% market share. ChatGPT, Perplexity,
   and Claude are how millions now find information. But most websites are
   invisible to AI search.

   ## Our Solution

   SEOAuditLite is the first AEO (Answer Engine Optimization) audit tool.
   We check 6 critical signals that AI search engines use to rank and cite
   your content.

   ## Who Built This

   Created by Chudi Nnorukam, a software engineer focused on AI-native web
   experiences. After achieving 100/100 on our own AEO audit, we packaged
   the methodology into a tool anyone can use.

   ## Why Trust Us

   - **We use it ourselves**: SEOAuditLite.com scores 100/100
   - **Open methodology**: All 6 checks are documented
   - **Free tier**: No credit card required to try it

   ## Contact

   Email: hello@chudi.dev
   Twitter: @chudin
   Website: https://chudi.dev
   ```

4. **Contact Page** (`/contact`)
   - Email: hello@chudi.dev
   - Response time expectation
   - Support hours

5. **Blog with 10+ articles** (AdSense wants content sites, not just tools)
   - 1500+ words each
   - Original research/insights
   - Updated regularly

**Timeline to AdSense approval:** 3-6 months minimum (need traffic + content)

### 4.3 Alternative: AdSense for Search

**Different product:** AdSense for Search allows you to add Google search to your site and earn from ads on search results.

**Requirements:**
- Less strict than display ads
- Can apply with lower traffic
- Needs search functionality

**Implementation:**
- Add site-specific search: "Search SEOAuditLite blog"
- Apply for AdSense for Search
- Monetize blog content searches

---

## Phase 5: Local SEO (if applicable)

### 5.1 Is Local SEO Relevant for SaaS?

**Typical local SEO:**
- "SEO agency near me"
- "web developer Los Angeles"

**Your product:** Cloud SaaS (no geographic dependency)

**Conclusion:** Local SEO is NOT applicable.

**Exception:** If you offer consulting/services alongside the tool, then:
- Create Google Business Profile
- Target "[your city] AEO consultant"
- But this is a pivot from product to service

---

## Phase 6: Content Calendar (First 90 Days)

### Week 1-2: Foundation
- [ ] Set up Google Search Console
- [ ] Set up Bing Webmaster Tools
- [ ] Create `/privacy`, `/terms`, `/about`, `/contact` pages
- [ ] Add structured data to all pages (Organization, WebSite, FAQPage)

### Week 3-4: Content Launch
- [ ] Publish `/blog/what-is-aeo` (cornerstone content, 3000 words)
- [ ] Publish `/blog/aeo-vs-seo` (comparison, 2000 words)
- [ ] Update llms.txt with use cases and comparisons

### Week 5-6: Technical SEO
- [ ] Add canonical tags to all pages
- [ ] Create dynamic Open Graph images for reports
- [ ] Implement breadcrumb schema
- [ ] Add FAQ schema to blog posts

### Week 7-8: AEO Content
- [ ] Publish `/blog/chatgpt-seo-checklist`
- [ ] Publish `/blog/perplexity-seo-guide`
- [ ] Test visibility in Perplexity and ChatGPT search

### Week 9-10: Long-Tail Content
- [ ] "How to add llms.txt to your website"
- [ ] "AI crawler detection guide"
- [ ] "Best schema types for AI search"

### Week 11-12: Case Studies
- [ ] "We scored 100/100 on our own AEO audit - here's how"
- [ ] Audit 10 popular sites, publish results (with permission)
- [ ] Reddit/Twitter distribution

---

## Phase 7: Distribution Strategy

### 7.1 Where Your Audience Is

**Target audience:**
- Technical founders building AI-native products
- SEO professionals adapting to AI search
- Content marketers exploring AEO

**Distribution channels:**

1. **Reddit**
   - r/SEO (3.2M members) - Post: "AEO vs SEO: The shift to AI search"
   - r/bigseo (118K) - More technical, better fit
   - r/marketing (1.7M)
   - r/startups (1.5M) - "How we built an AEO audit tool"

2. **Twitter/X**
   - Tweet thread: "Google search is dying. Here's what's replacing it."
   - Tag: @perplexity_ai when posting Perplexity optimization guides
   - Hashtags: #AEO #AISearch #ChatGPT

3. **Hacker News**
   - "Show HN: Free AEO audit tool (check your ChatGPT visibility)"
   - Post on Tuesday 8-10am PT (best engagement)
   - Title must be factual, not salesy

4. **Product Hunt**
   - Launch as "Product of the Day"
   - Tagline: "SEO is dead, long live AEO - audit your AI search readiness"
   - Need 5+ upvotes in first hour (coordinate with friends)

5. **Indie Hackers**
   - Post: "Built an AEO audit tool, here's the tech stack"
   - Share learnings: Lucia auth, Turso DB, Vercel deployment
   - Transparent metrics (traffic, revenue)

### 7.2 Backlink Strategy

**Goal:** 10 high-quality backlinks (month 1-3)

**Sources:**

1. **Your personal site** (chudi.dev)
   - Case study: "Building SEOAuditLite"
   - Link to tool from portfolio

2. **Guest posts**
   - Target: Dev.to, Medium, Hashnode
   - Topic: "How to optimize your dev blog for AI search"
   - Include tool link in author bio

3. **Resource pages**
   - Search: "inurl:resources SEO tools"
   - Email site owners: "I built an AEO tool, would it fit your resources page?"

4. **Comparison sites**
   - AlternativeTo.net (submit SEOAuditLite)
   - SaaSHub (requires submission)
   - G2 (for reviews)

5. **Directory submissions**
   - betalist.com (for new startups)
   - launching.io
   - producthunt.com/upcoming

---

## Phase 8: Programmatic SEO (Advanced)

### 8.1 The Opportunity

**Pattern:** Auto-generate landing pages for common searches

**Example:**
- `/tools/[tool-name]` - "Is [Webflow] optimized for AI search?"
- Auto-audit popular sites: `/audit/[domain]` - "Shopify.com AEO Report"

**Implementation:**
```typescript
// src/routes/audit/[domain]/+page.server.ts
export async function load({ params }) {
    const { domain } = params;

    // Run audit
    const audit = await auditDomain(domain);

    // Generate SEO metadata
    return {
        audit,
        meta: {
            title: `${domain} AEO Audit - AI Search Readiness Score`,
            description: `Free AEO audit for ${domain}. Check ChatGPT, Perplexity, and Claude visibility. Score: ${audit.overall_score}/100.`
        }
    };
}
```

**Pre-generate popular sites:**
- Top 1000 websites (Alexa/Tranco list)
- SaaS tools (ProductHunt top 100)
- E-commerce platforms

**SEO value:**
- 1000 indexed pages vs 4 pages
- Long-tail: "Stripe AEO score", "Notion AI search optimization"

**Risks:**
- Google may see as thin content
- Only do this AFTER you have traffic from content

---

## Phase 9: Metrics & Success Criteria

### 9.1 Month 1 Goals (Foundation)
- [ ] 10+ pages indexed in Google
- [ ] 100+ organic visitors/month
- [ ] 1 mention in Perplexity or ChatGPT results
- [ ] Privacy/Terms/About pages live
- [ ] 5 blog posts published

### 9.2 Month 3 Goals (Traction)
- [ ] 1,000+ organic visitors/month
- [ ] Top 20 for "AEO audit tool"
- [ ] Top 50 for "AI search optimization"
- [ ] 50+ backlinks
- [ ] 20+ blog posts

### 9.3 Month 6 Goals (Monetization Ready)
- [ ] 5,000+ organic visitors/month
- [ ] Featured in ChatGPT/Perplexity for AEO queries
- [ ] 100+ Pro conversions
- [ ] AdSense approved (if desired)
- [ ] DA 20+ (Moz Domain Authority)

---

## Implementation Priority (Next 7 Days)

### Day 1: GSC Setup
1. Claim https://seoauditlite.com in Google Search Console
2. Submit sitemap
3. Request indexing for homepage, planner, report

### Day 2-3: Legal Pages
4. Create `/privacy` page
5. Create `/terms` page
6. Create `/about` page
7. Create `/contact` page
8. Add links to footer

### Day 4-5: First Blog Post
9. Write `/blog/what-is-aeo` (3000 words, cornerstone content)
10. Add FAQPage schema
11. Submit to GSC for indexing

### Day 6: Enhanced llms.txt
12. Add use cases section
13. Add comparison section
14. Add statistics

### Day 7: Distribution
15. Post "What is AEO?" on r/SEO
16. Share on Twitter/X
17. Submit to Indie Hackers

---

## Technical SEO Checklist

### On-Page SEO (All Pages)
- [ ] Unique `<title>` (50-60 chars)
- [ ] Unique `<meta name="description">` (150-160 chars)
- [ ] `<link rel="canonical">`
- [ ] `<meta name="robots" content="index, follow">`
- [ ] H1 tag (one per page)
- [ ] Semantic HTML (proper heading hierarchy)
- [ ] Alt text on all images

### Structured Data (JSON-LD)
- [ ] Organization schema (homepage)
- [ ] WebSite schema with search action
- [ ] FAQPage schema (homepage FAQ section)
- [ ] BlogPosting schema (all blog posts)
- [ ] BreadcrumbList schema (report pages)
- [ ] HowTo schema (planner page)

### Performance
- [ ] Lighthouse Performance score >90
- [ ] Core Web Vitals: LCP <2.5s, CLS <0.1, INP <200ms
- [ ] Images optimized (WebP, lazy loading)
- [ ] Fonts preloaded

### Mobile
- [ ] Responsive design (already done ✅)
- [ ] Touch targets >48px
- [ ] No horizontal scroll

---

## Budget Estimate

**Free (DIY approach):**
- Google Search Console: Free
- Bing Webmaster Tools: Free
- Content creation: Time investment
- Distribution: Reddit, Twitter, Indie Hackers (free)

**Paid options (optional):**
- Ahrefs/SEMrush ($99-199/month) - Track rankings
- Surfer SEO ($89/month) - Content optimization
- ProductHunt "Ship" ($79/month) - Featured launch
- Paid ads ($500-1000/month) - Google Ads for "AEO" keywords

**Recommendation:** Start with $0 budget. Invest time in content, not tools.

---

## Common Pitfalls to Avoid

1. **Don't compete with Ahrefs for "SEO audit"**
   - You'll lose (zero domain authority vs their DA 91)
   - Target AEO instead (blue ocean)

2. **Don't apply for AdSense too early**
   - Wait until 5K+ visitors/month
   - Have 20+ blog posts
   - Show consistent traffic growth

3. **Don't neglect llms.txt updates**
   - This is your AEO advantage
   - Update monthly with new use cases

4. **Don't skip legal pages**
   - Privacy policy is required (GDPR, CCPA)
   - Terms protect you from abuse
   - About page builds trust

5. **Don't rely on programmatic SEO alone**
   - Create manual content first (proves value)
   - Only scale with automation after success

---

## Next Steps

**Immediate (This Week):**
1. Set up Google Search Console → verify ownership → submit sitemap
2. Create privacy, terms, about pages
3. Write first blog post: "What is AEO?"

**Short-term (This Month):**
4. Publish 5 AEO-focused blog posts
5. Submit to Product Hunt
6. Post on Reddit (r/SEO, r/bigseo)

**Long-term (3-6 Months):**
7. Build backlink portfolio (50+ links)
8. Apply for AdSense (if traffic goal met)
9. Programmatic SEO for popular domains

**Tracking:**
- Google Search Console (organic traffic)
- Vercel Analytics (total traffic)
- Plausible/Simple Analytics (privacy-friendly alternative to GA)

---

**Ready to start? Let me know which phase to implement first, and I'll build it.**
