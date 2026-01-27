# Google Search Console - Quick Start (5 Minutes)

**Goal:** Get seoauditlite.com indexed in Google search
**Time:** 5 minutes setup + 3-7 days for indexing
**Priority:** DO THIS TODAY

---

## Step 1: Add Property (2 minutes)

1. Go to: https://search.google.com/search-console
2. Click **"Add Property"**
3. Enter: `https://seoauditlite.com`
4. Click **"Continue"**

---

## Step 2: Verify with DNS (2 minutes)

### Get the TXT record

1. Google shows verification methods
2. Click **"DNS record"** tab
3. Copy the code (looks like: `google-site-verification=abc123xyz...`)

### Add to Vercel

1. Open: https://vercel.com/chudi-nnorukams-projects/seoauditlite/settings/domains
2. Click on `seoauditlite.com`
3. Scroll to **"DNS Records"**
4. Click **"Add"** → Select **"TXT"**
5. Fill in:
   - **Name:** `@`
   - **Value:** `google-site-verification=abc123xyz...` (paste the code)
   - **TTL:** `3600`
6. Click **"Save"**

### Verify in GSC

1. Go back to Google Search Console
2. Click **"Verify"**
3. If it fails: Wait 10 minutes, try again (DNS propagation)

---

## Step 3: Submit Sitemap (1 minute)

1. In GSC, click **"Sitemaps"** (left sidebar)
2. Enter: `sitemap.xml`
3. Click **"Submit"**

**Your sitemap:** https://seoauditlite.com/sitemap.xml (8 pages)

---

## Step 4: Request Indexing (Optional - speeds up discovery)

**Only do this for top 4 pages** (Google limits requests):

1. Click **"URL Inspection"** at top
2. Paste each URL, click **"Request Indexing"**:
   - `https://seoauditlite.com/`
   - `https://seoauditlite.com/planner`
   - `https://seoauditlite.com/about`
   - `https://seoauditlite.com/contact`

---

## Step 5: Verify It Worked (3-7 days later)

### Check indexing status

**In Google search:**
```
site:seoauditlite.com
```

**Expected:** 8 results (homepage, planner, about, contact, privacy, terms, report, llms.txt)

**If 0 results after 7 days:**
1. Go to GSC → **Indexing** → **Pages**
2. Look for errors under "Why pages aren't indexed"
3. Fix errors, request indexing again

---

## Common Issues

### "Verification failed"
**Fix:** Wait 15 minutes for DNS propagation, try verify again

### "Sitemap couldn't be read"
**Check:** Open https://seoauditlite.com/sitemap.xml in browser (should load XML)

### "Discovered - not indexed" (after 7 days)
**Fix:** Request indexing manually for that URL

### "Crawled - not indexed"
**Fix:** Add more content to page or internal links

---

## What Happens Next

| Time | What Happens |
|------|-------------|
| **5 minutes** | You finish setup ✅ |
| **1 hour** | DNS propagates, verification works ✅ |
| **1-3 days** | Googlebot discovers your sitemap 🕷️ |
| **3-7 days** | Homepage gets indexed 🎉 |
| **7-14 days** | All pages indexed (check with `site:` search) 📊 |
| **2-4 weeks** | GSC shows first impressions/clicks 📈 |

---

## That's It!

**GSC is now set up.** Google will automatically:
- Crawl your site every few days
- Index new pages you add
- Show you in search results (once you rank)
- Send you emails if errors occur

**Next:**
- Wait 3-7 days for indexing
- Monitor GSC "Coverage" report for errors
- Start driving traffic (Reddit, Twitter, Product Hunt)

---

## Pro Tips

1. **Check GSC weekly** for new errors
2. **Don't spam "Request Indexing"** (10/day limit)
3. **Add new pages to sitemap** automatically (already done via code)
4. **Link from chudi.dev** to speed up discovery

---

## Bing Webmaster Tools (Bonus - 2 minutes)

Once GSC is verified:

1. Go to: https://www.bing.com/webmasters
2. Click **"Import from Google Search Console"**
3. Sign in with Google
4. Select `seoauditlite.com`
5. Done! (Bing copies all settings from GSC)

---

**Questions?** Check the full guide: `GSC-BING-SETUP-GUIDE.md`
