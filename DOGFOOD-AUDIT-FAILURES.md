# SEOAuditLite Dogfooding Audit - FAILED
**Date:** January 26, 2026
**Score:** 68/100 (32% invisible to AI)
**Status:** ❌ UNACCEPTABLE - Cannot sell audit tool that fails its own audit

---

## The Credibility Problem

**What customers see:**
- Homepage claims: "Know your AI search readiness"
- Promises: "See how Perplexity, ChatGPT, and Claude see your site"
- Trust signal: "2,847 audits run this month"

**What the audit reveals:**
- **68/100 score** - Below "good" threshold (75+)
- **32% invisible to AI** - Nearly a third of content unreachable
- **3 of 6 checks failing** - Half the criteria not met

**The irony:** A tool selling AI search readiness that isn't AI-ready itself.

---

## Audit Results Breakdown

### ✅ PASSING (3/6)

#### 1. AI Crawler Access - 100/100
- ✅ robots.txt accessible
- ✅ All 5/5 AI crawlers allowed (GPTBot, ClaudeBot, PerplexityBot, Google AI, CommonCrawl)
- **Next step:** No changes needed

#### 2. llms.txt - 100/100
- ✅ llms.txt exists
- ✅ Sitemap referenced
- ✗ No RSS reference (not critical)
- **Next step:** "Your content policy is declared"

#### 3. AI Metadata - 80/100
- ✅ Valid canonical URL
- ✅ OpenGraph tags present
- ✅ Meta description (15 chars - acceptable length)
- ✗ **No publication date** (missing `article:published_time`)
- **Next step:** Add article:published_time meta tag

---

### ❌ FAILING (3/6)

#### 4. Structured Data - 40/100 ⚠️
**Score:** 2/5 schema types found

**Missing schemas:**
- ✗ **BlogPosting** - No blog/article markup
- ✓ WebSite - Present
- ✗ **Person** - No author markup
- ✓ FAQPage - Present (good!)
- ✗ **HowTo** - No how-to guides marked up

**Why it matters:**
AI engines use structured data to understand content relationships. Missing schemas = AI can't confidently extract/cite your content.

**Fix priority:** HIGH
**Effort:** 2-3 hours
**Impact:** Could raise score to 80+ if fixed

#### 5. Extractability - 50/100 ⚠️
**Status:** "Content is moderately extractable for AI"

**What's failing:**
- ✓ Semantic HTML tags present
- ✓ Heading hierarchy valid
- ✗ **Low text ratio** - Too much visual content, not enough text for AI to parse
- ✗ **All 0 images have alt text** - CRITICAL accessibility & AI extraction failure

**Why it matters:**
AI needs text to understand context. Images without alt text = invisible to AI. Low text ratio = AI can't determine what page is about.

**Fix priority:** CRITICAL
**Effort:** 1-2 hours
**Impact:** Major - alt text alone could raise score 10-15 points

#### 6. Answer Format - 50/100 ⚠️
**Status:** "Content is moderately formatted for AI extraction"

**What's failing:**
- ✓ FAQ schema present (good!)
- ✗ **No HowTo schema** - No step-by-step guides marked up
- ✓ Lists present
- ✗ **No tables** - Headers detected: 14 (aim for 10+)
- ✗ **Questions detected: 4** - Should have more Q&A format content

**Why it matters:**
AI engines prefer structured Q&A and step-by-step content. FAQ schema is great, but not enough alone.

**Fix priority:** MEDIUM
**Effort:** 3-4 hours (requires content additions)
**Impact:** Moderate - would push score to 75+

---

## Critical Fixes Required (To Reach 90+)

### 🔴 Priority 1: Add Alt Text to All Images (1-2 hours)
**Current:** "All 0 images have alt text"
**Impact:** +10-15 points

**Where:**
- Check icons (6 icons on homepage)
- Logo in header
- Social proof icons
- Any decorative SVGs

**Implementation:**
```svelte
<!-- BEFORE -->
<Robot size={24} />

<!-- AFTER -->
<Robot size={24} aria-label="AI Bot access check" />
```

**Files to update:**
- `src/routes/+page.svelte` (check icons, logo)
- `src/lib/components/Header.svelte` (logo, navigation icons)
- Any icon components using Phosphor

---

### 🔴 Priority 2: Add Publication Date Meta Tag (15 minutes)
**Current:** "No publication date"
**Impact:** +5-10 points (brings AI Metadata to 100/100)

**Implementation:**
```html
<!-- Add to <svelte:head> in +page.svelte -->
<meta property="article:published_time" content="2025-12-15T00:00:00Z" />
<meta property="article:modified_time" content="2026-01-26T00:00:00Z" />
```

**Files to update:**
- `src/routes/+page.svelte` (homepage)
- `src/routes/planner/+page.svelte`
- Any other public pages

---

### 🔴 Priority 3: Add Missing Structured Data (2-3 hours)
**Current:** 2/5 schemas (WebSite, FAQPage)
**Target:** 4/5 schemas
**Impact:** +20-25 points (brings Structured Data to 80-90/100)

#### 3A. Add Organization Schema (30 min)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SEOAuditLite",
  "url": "https://seoauditlite.com",
  "logo": "https://seoauditlite.com/logo.png",
  "sameAs": [
    "https://twitter.com/seoauditlite",
    "https://github.com/chudix/seoauditlite"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "hello@seoauditlite.com",
    "contactType": "Customer Support"
  }
}
```

#### 3B. Add Person Schema for Author (30 min)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Chudi Nnorukam",
  "url": "https://chudi.dev",
  "sameAs": [
    "https://twitter.com/chudi",
    "https://linkedin.com/in/chudi"
  ],
  "jobTitle": "Developer",
  "worksFor": {
    "@type": "Organization",
    "name": "SEOAuditLite"
  }
}
```

#### 3C. Add HowTo Schema (1-2 hours - requires content)
Create a "How to improve your AEO score" guide with HowTo schema:
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Improve Your AI Search Readiness",
  "description": "Step-by-step guide to optimize your site for AI search engines",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Check AI Crawler Access",
      "text": "Verify your robots.txt allows GPTBot, ClaudeBot, and PerplexityBot",
      "url": "https://seoauditlite.com/#ai-crawler-access"
    },
    {
      "@type": "HowToStep",
      "name": "Create llms.txt",
      "text": "Publish an llms.txt file declaring your AI crawling policy",
      "url": "https://seoauditlite.com/#llms-txt"
    }
    // ... more steps
  ]
}
```

**Files to update:**
- `src/routes/+page.svelte` (add schemas to <svelte:head>)
- Consider creating `/docs/how-to-improve-aeo` page with HowTo markup

---

### 🟡 Priority 4: Increase Text Ratio (1-2 hours)
**Current:** "Low text ratio"
**Impact:** +5-10 points

**Strategies:**
1. Add descriptive text to each check card (currently icon + heading only)
2. Expand FAQ answers (currently terse)
3. Add a "Why AEO matters" section with 200+ words
4. Add customer testimonials (text-based social proof)

**Example - Expand check cards:**
```svelte
<!-- BEFORE -->
<h3>AI Crawler Access</h3>
<p>Does your robots.txt allow GPTBot, ClaudeBot, and PerplexityBot?</p>

<!-- AFTER -->
<h3>AI Crawler Access</h3>
<p>Does your robots.txt allow GPTBot, ClaudeBot, and PerplexityBot to crawl your content?</p>
<p>Without explicit permission, AI search engines won't index your site. This check verifies that your robots.txt file includes allow directives for the major AI crawlers, ensuring your content appears in AI-powered search results.</p>
```

---

### 🟡 Priority 5: Add More Q&A Content (2-3 hours)
**Current:** "Questions detected: 4"
**Target:** 8-10 questions
**Impact:** +5-10 points

**Where to add:**
- Expand FAQ from 3 to 6-8 questions
- Add "Common AEO Mistakes" section as Q&A
- Add "How do I..." questions throughout the page

**New FAQ questions to add:**
- "How often should I run an audit?"
- "What's the difference between SEO and AEO?"
- "Do I need technical knowledge to fix issues?"
- "How long does it take to see results?"
- "Can AEO hurt my traditional SEO?"

---

## Expected Score After Fixes

| Fix | Current | After Fix | Points Gained |
|-----|---------|-----------|---------------|
| Alt text on all images | 50 | 70 | +20 |
| Publication date meta tag | 80 | 100 | +5 |
| Add 2 missing schemas | 40 | 70 | +30 |
| Increase text ratio | 50 | 60 | +10 |
| Add more Q&A content | 50 | 70 | +20 |

**Projected new score:** **85/100** (15% invisible to AI)
**Time investment:** 8-12 hours
**Credibility restored:** ✅ Can confidently sell audit tool

---

## Long-Term Improvements (To Reach 95+)

### Add BlogPosting Schema
- Requires: Creating a blog/resources section
- Effort: 4-8 hours (content creation + schema)
- Impact: +10 points (Structured Data to 90+)

### Add More HowTo Content
- Requires: Step-by-step guides for each check
- Effort: 6-10 hours (content creation + markup)
- Impact: +5-10 points (Answer Format to 80+)

### Add Tables & Data Visualization
- Requires: Comparison tables (AEO vs SEO, pricing tiers, etc.)
- Effort: 2-4 hours
- Impact: +5 points (Answer Format improvement)

---

## Competitive Benchmark

**Other SEO tools' scores (estimated):**
- Moz: ~75 (good traditional SEO, weak AEO)
- Ahrefs: ~70 (heavy on visuals, low text ratio)
- SEMrush: ~65 (complex navigation, poor extractability)
- Screaming Frog: ~80 (technical focus, good structured data)

**Goal:** 90+ score to differentiate and prove expertise

---

## Action Plan

### Week 1: Critical Fixes (Score: 68 → 80)
- [ ] Day 1: Add alt text to all images (2 hours)
- [ ] Day 1: Add publication date meta tags (30 min)
- [ ] Day 2-3: Add Organization + Person schemas (1 hour)
- [ ] Day 4-5: Increase text ratio on homepage (2 hours)

### Week 2: Major Improvements (Score: 80 → 85)
- [ ] Day 1-2: Create HowTo guide with schema (4 hours)
- [ ] Day 3: Expand FAQ to 8 questions (2 hours)
- [ ] Day 4: Test and verify new score (1 hour)
- [ ] Day 5: Document improvements in blog post (2 hours)

### Week 3: Polish (Score: 85 → 90+)
- [ ] Add blog section with BlogPosting schema
- [ ] Create comparison tables
- [ ] Add more step-by-step content
- [ ] Add testimonials with Review schema

---

## Risk of Not Fixing

**Customer conversation:**
```
Customer: "I ran your audit tool on your own site. You got 68/100."
You: "Uh... we're working on improvements."
Customer: "Why should I trust an audit tool that doesn't ace its own test?"
You: [crickets]
```

**Competitor attack vector:**
```
Competitor Tweet: "LOL @SEOAuditLite scores 68/100 on their own audit tool.
Maybe they should audit themselves before auditing others? 🤡"
```

**Review site critique:**
```
ProductHunt Comment: "Tool seems useful but ironic that seoauditlite.com
only scores 68/100. Feels like a dentist with rotten teeth."
```

---

## Conclusion

**Current state:** Embarrassing and indefensible
**Required action:** Fix critical issues within 1 week
**Target:** 90+ score before any marketing push
**Investment:** 8-12 hours to reach 85, 20-30 hours to reach 95+

**Bottom line:** Cannot sell audit expertise without acing your own audit.

---

**Next Steps:**
1. Read this document
2. Prioritize fixes by impact/effort ratio
3. Start with alt text + publication dates (quick wins)
4. Ship structured data improvements
5. Re-run audit weekly until 90+ achieved
6. Add "We practice what we preach: 93/100" to homepage
