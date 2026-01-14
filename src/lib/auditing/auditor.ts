/**
 * SEOAuditLite AEO Auditing Engine
 * Orchestrates all 6 AEO checks and generates score
 */

import { randomUUID } from 'node:crypto';
import {
  AEOGrade,
  AEOCheckType,
  SEOCheckType,
  AEOImprovement,
  AuditError,
  ValidationError,
  TimeoutError,
  NetworkError,
  GRADING_SCALE,
  AEO_CHECK_WEIGHTS,
  AI_CRAWLERS,
  AUDIT_TIMEOUT_MS,
} from './types';
import {
  AUDIT_SCHEMA_VERSION,
  type AuditCheck,
  type AuditRequest,
  type AuditResult,
} from './schema';

// ============================================================================
// Check 1: AI Crawler Accessibility (20 pts)
// ============================================================================

async function checkAICrawlerAccessibility(
  domain: string
): Promise<AEOCheckType> {
  try {
    const robotsUrl = new URL('/robots.txt', `https://${domain}`).href;
    const response = await fetch(robotsUrl, { timeout: 5000 });

    const content = response.ok ? await response.text() : null;
    const robotsAccessible = response.ok && response.status === 200;

    // Parse robots.txt to check AI bot allowance
    const aiBotsAllowed = AI_CRAWLERS.map((bot) => ({
      botName: bot.name,
      userAgent: bot.userAgent,
      allowed: !content || robotsContentAllows(content, bot.userAgent),
    }));

    const allowedCount = aiBotsAllowed.filter((b) => b.allowed).length;
    const score = Math.round((allowedCount / AI_CRAWLERS.length) * 20);

    const status =
      allowedCount === AI_CRAWLERS.length
        ? 'pass'
        : allowedCount >= 3
          ? 'warning'
          : 'fail';

    return {
      name: 'ai-crawler-accessibility',
      status,
      score,
      maxScore: 20,
      message: `${allowedCount}/${AI_CRAWLERS.length} AI crawlers allowed`,
      details: [
        robotsAccessible ? 'robots.txt is accessible' : 'robots.txt not found (default: allow all)',
        `AI crawlers allowed: ${allowedCount}/${AI_CRAWLERS.length}`,
        aiBotsAllowed.map((b) => `  ${b.allowed ? '✓' : '✗'} ${b.botName}`).join('\n'),
      ],
      recommendations: [
        allowedCount < AI_CRAWLERS.length
          ? 'Add explicit Allow rules for GPTBot, ClaudeBot, PerplexityBot'
          : 'No changes needed - all AI crawlers allowed',
      ],
      robotsUrl,
      robotsAccessible,
      robotsContent: content,
      aiBotsAllowed: aiBotsAllowed.map((b) => ({
        botName: b.botName,
        userAgent: b.userAgent,
        allowed: b.allowed,
      })),
    };
  } catch (error) {
    throw new NetworkError(domain, error instanceof Error ? error.message : 'Unknown error');
  }
}

function robotsContentAllows(content: string, userAgent: string): boolean {
  const lines = content.split('\n');
  let currentUserAgent = '*';
  let allowed = true;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toLowerCase().startsWith('user-agent:')) {
      currentUserAgent = trimmed.substring('user-agent:'.length).trim();
    }

    if (
      (currentUserAgent === userAgent || currentUserAgent === '*') &&
      trimmed.toLowerCase().startsWith('disallow:')
    ) {
      const disallowPath = trimmed.substring('disallow:'.length).trim();
      if (disallowPath === '/' || disallowPath === '') {
        allowed = false;
      }
    }
  }

  return allowed;
}

// ============================================================================
// Check 2: llms.txt Validation (15 pts)
// ============================================================================

async function checkLLMsTxt(domain: string): Promise<AEOCheckType> {
  try {
    const llmsUrl = new URL('/llms.txt', `https://${domain}`).href;
    const response = await fetch(llmsUrl, { timeout: 5000 });

    const llmsExists = response.ok && response.status === 200;
    const llmsContent = llmsExists ? await response.text() : null;

    const hasSitemap = llmsContent?.includes('sitemap') ?? false;
    const hasRSS = llmsContent?.includes('rss') ?? false;
    const isValid = llmsExists && hasSitemap;

    const score = llmsExists ? (isValid ? 15 : 10) : 0;
    const status = llmsExists ? 'pass' : 'fail';

    return {
      name: 'llms-txt-validation',
      status,
      score,
      maxScore: 15,
      message: llmsExists ? 'llms.txt found and valid' : 'llms.txt not found',
      details: [
        llmsExists ? '✓ llms.txt exists' : '✗ llms.txt missing',
        hasSitemap ? '✓ Sitemap referenced' : '✗ No sitemap reference',
        hasRSS ? '✓ RSS feed referenced' : '✗ No RSS reference',
      ],
      recommendations: [
        llmsExists
          ? 'Your content policy is declared'
          : 'Create /llms.txt with content policy, sitemap, and RSS references',
      ],
      llmsUrl,
      llmsExists,
      llmsContent,
      hasSitemap,
      hasRSS,
      isValid,
    };
  } catch (error) {
    throw new NetworkError(domain, error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============================================================================
// Check 3: Structured Data Quality (25 pts)
// ============================================================================

async function checkStructuredData(domain: string): Promise<AEOCheckType> {
  try {
    const response = await fetch(`https://${domain}`, { timeout: 10000 });
    const html = await response.text();

    // Parse schemas from HTML
    const schemas = parseSchemas(html);

    const schemaTypes = [
      { type: 'BlogPosting', weight: 10 },
      { type: 'WebSite', weight: 5 },
      { type: 'Person', weight: 5 },
      { type: 'FAQPage', weight: 3 },
      { type: 'HowTo', weight: 2 },
    ];

    const schemaResults = schemaTypes.map((st) => ({
      type: st.type,
      present: schemas.some((s) => s['@type']?.includes(st.type)),
      valid: schemas.some((s) => s['@type']?.includes(st.type) && validateSchema(s)),
    }));

    const score = schemaResults.reduce(
      (acc, s) => acc + (s.present ? (s.valid ? 5 : 2) : 0),
      0
    );

    const status = score >= 20 ? 'pass' : score >= 10 ? 'warning' : 'fail';

    return {
      name: 'structured-data-quality',
      status,
      score: Math.min(score, 25),
      maxScore: 25,
      message: `${schemaResults.filter((s) => s.present).length}/${schemaTypes.length} schema types found`,
      details: schemaResults.map(
        (s) => `${s.present ? (s.valid ? '✓' : '⚠') : '✗'} ${s.type}`
      ),
      recommendations: [
        !schemaResults.find((s) => s.type === 'BlogPosting')?.present
          ? 'Add BlogPosting schema to articles'
          : '',
        !schemaResults.find((s) => s.type === 'FAQPage')?.present
          ? 'Add FAQPage schema for FAQ content'
          : '',
        !schemaResults.find((s) => s.type === 'HowTo')?.present
          ? 'Add HowTo schema for tutorial content'
          : '',
      ].filter(Boolean),
      schemas: schemaResults,
      totalSchemas: schemas.length,
    };
  } catch (error) {
    throw new NetworkError(domain, error instanceof Error ? error.message : 'Unknown error');
  }
}

function parseSchemas(html: string): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];
  const scriptRegex = /<script type="application\/ld\+json">(.*?)<\/script>/gs;

  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const schema = JSON.parse(match[1]);
      schemas.push(schema);
    } catch {
      // Invalid JSON, skip
    }
  }

  return schemas;
}

function validateSchema(schema: Record<string, unknown>): boolean {
  const type = schema['@type'];
  if (typeof type !== 'string') return false;

  // Check required fields for common types
  const requirements: Record<string, string[]> = {
    BlogPosting: ['headline', 'author', 'datePublished'],
    FAQPage: ['mainEntity'],
    HowTo: ['step', 'name'],
    WebSite: ['name', 'url'],
    Person: ['name'],
  };

  const required = requirements[type] || [];
  return required.every((key) => key in schema);
}

// ============================================================================
// Check 4: Content Extractability (20 pts)
// ============================================================================

async function checkExtractability(domain: string): Promise<AEOCheckType> {
  try {
    const response = await fetch(`https://${domain}`, { timeout: 10000 });
    const html = await response.text();

    // Count semantic tags
    const hasArticleTag = /<article[\s>]/i.test(html);
    const hasSectionTag = /<section[\s>]/i.test(html);
    const hasSemanticTags = hasArticleTag || hasSectionTag;

    // Check heading hierarchy
    const headings = html.match(/<h[1-6][^>]*>[^<]*<\/h[1-6]>/gi) || [];
    const headingHierarchyValid = validateHeadingHierarchy(headings);

    // Calculate text-to-HTML ratio
    const textContent = html.replace(/<[^>]*>/g, ' ').trim();
    const textToHTMLRatio = textContent.length / html.length;

    // Count images with alt text
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    const imagesTotal = imgMatches.length;
    const imagesWithAlt = imgMatches.filter((img) => /alt="/i.test(img)).length;

    // Scoring
    let score = 0;
    score += hasSemanticTags ? 5 : 0;
    score += headingHierarchyValid ? 5 : 0;
    score += textToHTMLRatio > 0.3 ? 5 : 0;
    score += imagesWithAlt === imagesTotal && imagesTotal > 0 ? 5 : imagesWithAlt > 0 ? 2 : 0;

    const status = score >= 15 ? 'pass' : score >= 10 ? 'warning' : 'fail';

    return {
      name: 'content-extractability',
      status,
      score,
      maxScore: 20,
      message: `Content is ${status === 'pass' ? 'highly' : 'moderately'} extractable for AI`,
      details: [
        hasSemanticTags ? '✓ Semantic HTML tags present' : '✗ Missing semantic tags',
        headingHierarchyValid ? '✓ Heading hierarchy valid' : '✗ Heading hierarchy issues',
        textToHTMLRatio > 0.3 ? `✓ Text-to-HTML ratio good (${(textToHTMLRatio * 100).toFixed(1)}%)` : `✗ Low text ratio`,
        imagesWithAlt === imagesTotal
          ? `✓ All ${imagesTotal} images have alt text`
          : `${imagesWithAlt}/${imagesTotal} images have alt text`,
      ],
      recommendations: [
        !hasSemanticTags ? 'Use <article>, <section>, <nav> semantic HTML tags' : '',
        !headingHierarchyValid ? 'Fix heading hierarchy (should be h1 → h2 → h3)' : '',
        textToHTMLRatio < 0.3 ? 'Increase text content ratio (reduce HTML overhead)' : '',
        imagesWithAlt < imagesTotal
          ? `Add alt text to ${imagesTotal - imagesWithAlt} images`
          : '',
      ].filter(Boolean),
      htmlValid: true,
      hasSemanticTags,
      headingHierarchyValid,
      textToHTMLRatio: Math.round(textToHTMLRatio * 100) / 100,
      imagesWithAlt,
      imagesTotal,
    };
  } catch (error) {
    throw new NetworkError(domain, error instanceof Error ? error.message : 'Unknown error');
  }
}

function validateHeadingHierarchy(headings: string[]): boolean {
  if (headings.length === 0) return false;

  let lastLevel = 1;
  for (const heading of headings) {
    const level = parseInt(heading.match(/h([1-6])/i)?.[1] || '1');
    if (level > lastLevel + 1) return false;
    lastLevel = level;
  }

  return true;
}

// ============================================================================
// Check 5: AI Metadata (10 pts)
// ============================================================================

async function checkAIMetadata(domain: string): Promise<AEOCheckType> {
  try {
    const response = await fetch(`https://${domain}`, { timeout: 10000 });
    const html = await response.text();

    const metaExtractors = {
      canonical: /<link[^>]*rel=["']?canonical["']?[^>]*href=["']?([^"'\s>]+)["']?/i,
      description: /<meta[^>]*name=["']?description["']?[^>]*content=["']?([^"']+)["']?/i,
      ogTitle: /<meta[^>]*property=["']?og:title["']?[^>]*content=["']?([^"']+)["']?/i,
      datePublished:
        /<meta[^>]*property=["']?article:published_time["']?[^>]*content=["']?([^"']+)["']?/i,
    };

    const canonical = html.match(metaExtractors.canonical)?.[1] || '';
    const description = html.match(metaExtractors.description)?.[1] || '';
    const ogTitle = html.match(metaExtractors.ogTitle)?.[1] || '';
    const datePublished = html.match(metaExtractors.datePublished)?.[1] || '';

    const hasCanonical = !!canonical;
    const canonicalValid = hasCanonical && canonical.startsWith('http');
    const hasOGTags = !!ogTitle;
    const hasMetaDescription = !!description;
    const hasDatePublished = !!datePublished;
    const metaDescriptionLength = description.length;

    let score = 0;
    score += canonicalValid ? 3 : 0;
    score += hasOGTags ? 3 : 0;
    score += hasMetaDescription && metaDescriptionLength <= 160 ? 2 : hasMetaDescription ? 1 : 0;
    score += hasDatePublished ? 2 : 0;

    const status = score >= 8 ? 'pass' : score >= 5 ? 'warning' : 'fail';

    return {
      name: 'ai-metadata',
      status,
      score,
      maxScore: 10,
      message: `${score}/10 metadata checks passed`,
      details: [
        canonicalValid ? '✓ Valid canonical URL' : hasCanonical ? '⚠ Canonical found but not absolute' : '✗ No canonical',
        hasOGTags ? '✓ OpenGraph tags present' : '✗ No OpenGraph tags',
        hasMetaDescription
          ? metaDescriptionLength <= 160
            ? `✓ Meta description (${metaDescriptionLength} chars)`
            : `⚠ Meta description too long (${metaDescriptionLength} chars)`
          : '✗ No meta description',
        hasDatePublished ? '✓ Publication date present' : '✗ No publication date',
      ],
      recommendations: [
        !hasCanonical ? 'Add canonical URL meta tag' : '',
        !hasOGTags ? 'Add OpenGraph tags for social sharing' : '',
        !hasMetaDescription ? 'Add meta description (under 160 chars)' : '',
        !hasDatePublished ? 'Add article:published_time meta tag' : '',
      ].filter(Boolean),
      hasCanonical,
      canonicalValid,
      hasOGTags,
      hasMetaDescription,
      hasDatePublished,
      metaDescriptionLength,
    };
  } catch (error) {
    throw new NetworkError(domain, error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============================================================================
// Check 6: Answer-Ready Format (10 pts)
// ============================================================================

async function checkAnswerFormat(domain: string): Promise<AEOCheckType> {
  try {
    const response = await fetch(`https://${domain}`, { timeout: 10000 });
    const html = await response.text();

    const hasFAQSchema = /"@type"\s*:\s*"FAQPage"/.test(html);
    const hasHowToSchema = /"@type"\s*:\s*"HowTo"/.test(html);
    const hasLists = /<(ul|ol)[^>]*>/i.test(html);
    const hasTables = /<table[^>]*>/i.test(html);
    const hasDefinitionList = /<dl[^>]*>/i.test(html);

    const headerCount = (html.match(/<h[1-6][^>]*>/gi) || []).length;
    const questionsDetected = (html.match(/\?[\s<]/g) || []).length;

    let score = 0;
    score += hasFAQSchema ? 3 : 0;
    score += hasHowToSchema ? 2 : 0;
    score += hasLists ? 2 : 0;
    score += hasTables ? 2 : 0;
    score += hasDefinitionList ? 1 : 0;

    const status = score >= 7 ? 'pass' : score >= 4 ? 'warning' : 'fail';

    return {
      name: 'answer-format',
      status,
      score: Math.min(score, 10),
      maxScore: 10,
      message: `Content is ${score >= 7 ? 'well' : 'moderately'} formatted for AI extraction`,
      details: [
        hasFAQSchema ? '✓ FAQ schema present' : '✗ No FAQ schema',
        hasHowToSchema ? '✓ HowTo schema present' : '✗ No HowTo schema',
        hasLists ? '✓ Lists present' : '✗ No lists',
        hasTables ? '✓ Tables present' : '✗ No tables',
        hasDefinitionList ? '✓ Definition lists present' : '',
        `Headers: ${headerCount} (aim for 10+)`,
        `Questions detected: ${questionsDetected}`,
      ].filter(Boolean),
      recommendations: [
        !hasFAQSchema && questionsDetected > 0 ? 'Add FAQPage schema for Q&A content' : '',
        !hasHowToSchema ? 'Add HowTo schema for step-by-step content' : '',
        !hasLists ? 'Use lists for dense information' : '',
        !hasTables && headerCount < 8 ? 'Use tables for structured data comparison' : '',
        headerCount < 8
          ? `Increase headers (currently ${headerCount}, aim for 10-15)`
          : '',
      ].filter(Boolean),
      hasFAQSchema,
      hasHowToSchema,
      hasLists,
      hasTables,
      hasDefinitionList,
      headerCount,
      questionsDetected,
    };
  } catch (error) {
    throw new NetworkError(domain, error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============================================================================
// Main Auditor
// ============================================================================

// ============================================================================
// SEO Check Functions (5 checks)
// ============================================================================

async function checkSitemap(domain: string): Promise<SEOCheckType> {
  try {
    const sitemapUrl = new URL('/sitemap.xml', `https://${domain}`).href;
    const response = await fetch(sitemapUrl, { timeout: 5000 });
    const sitemapExists = response.ok && response.status === 200;
    let urlCount = 0;
    let lastModRecent = false;
    let sitemapValid = false;

    if (sitemapExists) {
      const content = await response.text();
      // Parse sitemap XML
      const urlMatches = content.match(/<url>/g) || [];
      urlCount = urlMatches.length;
      // Check if sitemap was modified in last 30 days
      const lastmodMatch = content.match(/<lastmod>([^<]+)<\/lastmod>/);
      if (lastmodMatch) {
        const lastModDate = new Date(lastmodMatch[1]);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        lastModRecent = lastModDate > thirtyDaysAgo;
      }
      sitemapValid = urlCount > 0;
    }

    const score = sitemapValid ? 20 : 0;
    return {
      checkType: 'seo',
      name: 'sitemap-validation',
      status: sitemapValid ? 'pass' : 'fail',
      score,
      maxScore: 20,
      message: sitemapValid ? `Sitemap found with ${urlCount} URLs` : 'Sitemap not found',
      details: [
        `Sitemap exists: ${sitemapExists ? 'Yes' : 'No'}`,
        `URLs in sitemap: ${urlCount}`,
        `Recently updated: ${lastModRecent ? 'Yes' : 'No'}`,
      ],
      recommendations: [
        sitemapExists ? 'Sitemap is accessible' : 'Create and submit sitemap.xml to improve discoverability',
        lastModRecent ? '' : 'Update sitemap regularly to signal fresh content',
      ].filter(Boolean),
      sitemapUrl,
      sitemapExists,
      sitemapValid,
      urlCount,
      lastModRecent,
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'sitemap-validation',
      status: 'fail',
      score: 0,
      maxScore: 20,
      message: 'Could not validate sitemap',
      details: ['Error fetching sitemap'],
      recommendations: ['Ensure sitemap.xml is accessible at domain root'],
      sitemapUrl: new URL('/sitemap.xml', `https://${domain}`).href,
      sitemapExists: false,
      sitemapValid: false,
      urlCount: 0,
      lastModRecent: false,
    };
  }
}

async function checkRobotsTxt(domain: string): Promise<SEOCheckType> {
  try {
    const robotsUrl = new URL('/robots.txt', `https://${domain}`).href;
    const response = await fetch(robotsUrl, { timeout: 5000 });
    const robotsValid = response.ok && response.status === 200;
    let content = '';
    let blocksUserAgent = false;
    let hasDisallowRules = false;

    if (robotsValid) {
      content = await response.text();
      // Check if robots.txt blocks important crawlers
      blocksUserAgent =
        content.toLowerCase().includes('user-agent: *\ndisallow: /') ||
        content.toLowerCase().includes('user-agent: *\ndisallow: /');
      hasDisallowRules = content.toLowerCase().includes('disallow:');
    }

    const score = robotsValid && !blocksUserAgent ? 15 : robotsValid ? 8 : 0;
    return {
      checkType: 'seo',
      name: 'robots-txt-analysis',
      status: robotsValid && !blocksUserAgent ? 'pass' : robotsValid ? 'warning' : 'fail',
      score,
      maxScore: 15,
      message: robotsValid ? 'robots.txt is configured' : 'robots.txt not found',
      details: [
        `robots.txt exists: ${robotsValid ? 'Yes' : 'No'}`,
        `Blocks all crawlers: ${blocksUserAgent ? 'Yes (blocking!)' : 'No'}`,
        `Has disallow rules: ${hasDisallowRules ? 'Yes' : 'No'}`,
      ],
      recommendations: [
        !robotsValid
          ? 'Create robots.txt to control crawler access'
          : blocksUserAgent
            ? 'Remove blanket disallow rule - it blocks search engines'
            : 'robots.txt is properly configured',
      ],
      robotsValid,
      blocksUserAgent,
      hasDisallowRules,
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'robots-txt-analysis',
      status: 'fail',
      score: 0,
      maxScore: 15,
      message: 'Could not validate robots.txt',
      details: ['Error fetching robots.txt'],
      recommendations: ['Create robots.txt to guide crawlers'],
      robotsValid: false,
      blocksUserAgent: true,
      hasDisallowRules: false,
    };
  }
}

async function checkMetaTags(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const titlePresent = !!titleMatch;
    const titleLength = titleMatch ? titleMatch[1].length : 0;

    const descriptionMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    const descriptionPresent = !!descriptionMatch;
    const descriptionLength = descriptionMatch ? descriptionMatch[1].length : 0;

    const hasCanonical = /<link\s+rel="canonical"/.test(html);
    const hasOGImage = /<meta\s+property="og:image"/.test(html);
    const viewportConfigured = /<meta\s+name="viewport"/.test(html);

    const titleValid = titleLength > 30 && titleLength < 60;
    const descriptionValid = descriptionLength > 120 && descriptionLength < 160;

    const score =
      (titlePresent && titleValid ? 8 : titlePresent ? 4 : 0) +
      (descriptionPresent && descriptionValid ? 8 : descriptionPresent ? 4 : 0) +
      (hasCanonical ? 5 : 0) +
      (hasOGImage ? 2 : 0) +
      (viewportConfigured ? 2 : 0);

    return {
      checkType: 'seo',
      name: 'meta-tags-validation',
      status: score > 18 ? 'pass' : score > 12 ? 'warning' : 'fail',
      score: Math.min(score, 25),
      maxScore: 25,
      message: `Meta tags configured: ${score}/25 points`,
      details: [
        `Title: ${titlePresent ? `Present (${titleLength} chars)` : 'Missing'} ${titleValid ? '✓' : ''}`,
        `Description: ${descriptionPresent ? `Present (${descriptionLength} chars)` : 'Missing'} ${descriptionValid ? '✓' : ''}`,
        `Canonical: ${hasCanonical ? 'Yes ✓' : 'No'}`,
        `OG Image: ${hasOGImage ? 'Yes ✓' : 'No'}`,
        `Viewport: ${viewportConfigured ? 'Yes ✓' : 'No'}`,
      ],
      recommendations: [
        !titlePresent || !titleValid
          ? 'Add title (30-60 chars, with keywords)'
          : 'Title tag is optimized',
        !descriptionPresent || !descriptionValid
          ? 'Add meta description (120-160 chars)'
          : 'Description is optimized',
        !hasCanonical ? 'Add canonical tag to avoid duplicate content' : 'Canonical tag present',
      ],
      titlePresent,
      titleLength,
      descriptionPresent,
      descriptionLength,
      hasCanonical,
      hasOGImage,
      viewportConfigured,
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'meta-tags-validation',
      status: 'fail',
      score: 0,
      maxScore: 25,
      message: 'Could not validate meta tags',
      details: ['Error fetching page'],
      recommendations: ['Ensure homepage is accessible and contains proper meta tags'],
      titlePresent: false,
      titleLength: 0,
      descriptionPresent: false,
      descriptionLength: 0,
      hasCanonical: false,
      hasOGImage: false,
      viewportConfigured: false,
    };
  }
}

async function checkPerformance(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    const hasCharset = /<meta\s+charset/.test(html);
    const hasViewport = /<meta\s+name="viewport"/.test(html);
    const images = html.match(/<img/g) || [];
    const imagesWithoutAlt = (html.match(/<img[^>]*(?<!alt=)[^>]*>/g) || []).length;
    const imagesWithoutLazyLoad = (html.match(/<img(?!.*loading=)/g) || []).length;
    const cssInline = /<style[^>]*>/.test(html);
    const minified = html.length < 50000 || !/\n\s{4,}/.test(html);

    const score =
      (hasCharset ? 3 : 0) +
      (hasViewport ? 3 : 0) +
      (imagesWithoutAlt === 0 ? 5 : 2) +
      (imagesWithoutLazyLoad < images.length ? 5 : 2) +
      (cssInline ? 2 : 0) +
      (minified ? 2 : 0);

    return {
      checkType: 'seo',
      name: 'performance-metrics',
      status: score > 16 ? 'pass' : score > 10 ? 'warning' : 'fail',
      score: Math.min(score, 20),
      maxScore: 20,
      message: `Performance score: ${score}/20`,
      details: [
        `Charset: ${hasCharset ? 'Yes ✓' : 'No'}`,
        `Viewport: ${hasViewport ? 'Yes ✓' : 'No'}`,
        `Images with alt text: ${images.length - imagesWithoutAlt}/${images.length}`,
        `Lazy loading: ${images.length - imagesWithoutLazyLoad} images`,
        `Minified: ${minified ? 'Yes ✓' : 'No'}`,
      ],
      recommendations: [
        imagesWithoutAlt > 0 ? `Add alt text to ${imagesWithoutAlt} images` : 'All images have alt text',
        imagesWithoutLazyLoad > 0
          ? 'Add loading="lazy" to below-fold images'
          : 'Images are lazy-loaded',
        !minified ? 'Minify HTML and CSS for faster loading' : 'Content is minified',
      ],
      metatags: { hasCharset, hasViewport },
      images: {
        total: images.length,
        withoutAlt: imagesWithoutAlt,
        withoutLazyLoad: imagesWithoutLazyLoad,
      },
      cssInline,
      minified,
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'performance-metrics',
      status: 'fail',
      score: 0,
      maxScore: 20,
      message: 'Could not validate performance',
      details: ['Error analyzing page'],
      recommendations: ['Ensure page is accessible and properly optimized'],
      metatags: { hasCharset: false, hasViewport: false },
      images: { total: 0, withoutAlt: 0, withoutLazyLoad: 0 },
      cssInline: false,
      minified: false,
    };
  }
}

async function checkHeadingStructure(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    const h1s = (html.match(/<h1[^>]*>/gi) || []).length;
    const h2s = (html.match(/<h2[^>]*>/gi) || []).length;
    const h3s = (html.match(/<h3[^>]*>/gi) || []).length;
    const headings = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];

    const h1Valid = h1s === 1;
    const hasHierarchy = h2s > 0;
    const score = (h1Valid ? 8 : 0) + (hasHierarchy ? 7 : 0) + Math.min(headings.length / 2, 5);

    return {
      checkType: 'seo',
      name: 'heading-structure',
      status: score > 15 ? 'pass' : score > 10 ? 'warning' : 'fail',
      score: Math.min(score, 15),
      maxScore: 15,
      message: `Headings: ${h1s} H1, ${h2s} H2, ${h3s} H3 (${headings.length} total)`,
      details: [
        `H1 count: ${h1s} ${h1Valid ? '✓ (should be 1)' : '✗ (should be exactly 1)'}`,
        `H2-H3 hierarchy: ${hasHierarchy ? 'Present ✓' : 'Missing ✗'}`,
        `Total headings: ${headings.length}`,
      ],
      recommendations: [
        !h1Valid ? 'Add exactly one H1 tag with your primary keyword' : 'H1 is properly structured',
        !hasHierarchy ? 'Use H2 and H3 tags to create content hierarchy' : 'Good heading hierarchy detected',
      ],
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'heading-structure',
      status: 'fail',
      score: 0,
      maxScore: 15,
      message: 'Could not analyze heading structure',
      details: ['Error fetching page'],
      recommendations: ['Ensure page is accessible and properly structured'],
    };
  }
}

async function checkCoreWebVitals(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    // Estimate web vitals from HTML analysis
    const hasCompression = html.length < 100000;
    const hasLazyLoad = /loading=["']lazy["']/.test(html);
    const hasMinifiedCSS = !/<style[^>]*>[\s\n]{4,}/.test(html);
    const scriptCount = (html.match(/<script/g) || []).length;
    const hasAsync = /async|defer/.test(html);

    const score =
      (hasCompression ? 6 : 2) +
      (hasLazyLoad ? 5 : 0) +
      (hasMinifiedCSS ? 5 : 2) +
      (scriptCount < 5 ? 4 : 0) +
      (hasAsync ? 5 : 0);

    return {
      checkType: 'seo',
      name: 'core-web-vitals',
      status: score > 18 ? 'pass' : score > 12 ? 'warning' : 'fail',
      score: Math.min(score, 20),
      maxScore: 20,
      message: `Page performance optimization score: ${Math.min(score, 20)}/20`,
      details: [
        `HTML size: ${(html.length / 1024).toFixed(1)}KB ${hasCompression ? '✓' : '✗'}`,
        `Lazy loading: ${hasLazyLoad ? 'Enabled ✓' : 'Not detected'}`,
        `Minified CSS: ${hasMinifiedCSS ? 'Yes ✓' : 'No'}`,
        `Scripts: ${scriptCount} ${scriptCount < 5 ? '✓' : '⚠️'}`,
        `Async/Defer: ${hasAsync ? 'Yes ✓' : 'No'}`,
      ],
      recommendations: [
        'Run Google PageSpeed Insights for exact Core Web Vitals metrics',
        hasCompression ? 'Page size is good' : 'Reduce HTML/CSS/JS size',
        !hasLazyLoad ? 'Add loading="lazy" to images' : 'Good lazy loading strategy',
      ],
      learnMore: 'https://web.dev/vitals/',
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'core-web-vitals',
      status: 'fail',
      score: 0,
      maxScore: 20,
      message: 'Could not analyze Core Web Vitals',
      details: ['Error fetching page'],
      recommendations: ['Check Google PageSpeed Insights for detailed metrics'],
    };
  }
}

async function checkContentAnalysis(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    // Extract text content
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).length;
    const uniqueWords = new Set(textContent.toLowerCase().split(/\s+/)).size;

    const score =
      (wordCount >= 400 ? 8 : wordCount >= 200 ? 4 : 0) +
      (uniqueWords > 50 ? 4 : 2) +
      (wordCount > 300 && uniqueWords / wordCount > 0.5 ? 3 : 0);

    return {
      checkType: 'seo',
      name: 'content-analysis',
      status: score > 12 ? 'pass' : score > 7 ? 'warning' : 'fail',
      score: Math.min(score, 15),
      maxScore: 15,
      message: `Content: ${wordCount} words, ${uniqueWords} unique words`,
      details: [
        `Word count: ${wordCount} ${wordCount >= 400 ? '✓ (good depth)' : wordCount >= 200 ? '⚠️ (minimal)' : '✗ (too short)'}`,
        `Unique words: ${uniqueWords} (diversity: ${((uniqueWords / Math.max(wordCount, 1)) * 100).toFixed(1)}%)`,
        `Content quality indicator: ${score > 12 ? 'Good' : score > 7 ? 'Fair' : 'Poor'}`,
      ],
      recommendations: [
        wordCount < 400 ? 'Expand content to at least 400 words for better rankings' : 'Content length is adequate',
        'Focus on answering user questions thoroughly',
        'Avoid keyword stuffing - aim for natural, readable content',
      ],
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'content-analysis',
      status: 'fail',
      score: 0,
      maxScore: 15,
      message: 'Could not analyze content',
      details: ['Error fetching page'],
      recommendations: ['Ensure page has sufficient text content'],
    };
  }
}

async function checkSecurityHeaders(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });

    const hasHSTS = response.headers.has('strict-transport-security');
    const hasCSP = response.headers.has('content-security-policy');
    const hasXFrameOptions = response.headers.has('x-frame-options');
    const hasXContentType = response.headers.has('x-content-type-options');

    const score = [hasHSTS, hasCSP, hasXFrameOptions, hasXContentType].filter(Boolean).length * 4;

    return {
      checkType: 'seo',
      name: 'security-headers',
      status: score > 12 ? 'pass' : score > 6 ? 'warning' : 'fail',
      score: Math.min(score, 15),
      maxScore: 15,
      message: `Security headers: ${score / 4 | 0}/4 configured`,
      details: [
        `HSTS: ${hasHSTS ? 'Yes ✓' : 'No'}`,
        `CSP: ${hasCSP ? 'Yes ✓' : 'No'}`,
        `X-Frame-Options: ${hasXFrameOptions ? 'Yes ✓' : 'No'}`,
        `X-Content-Type-Options: ${hasXContentType ? 'Yes ✓' : 'No'}`,
      ],
      recommendations: [
        !hasHSTS ? 'Enable HSTS to force HTTPS connections' : 'HSTS is enabled',
        !hasCSP ? 'Implement Content Security Policy for protection' : 'CSP is configured',
        !hasXFrameOptions ? 'Set X-Frame-Options to prevent clickjacking' : 'Clickjacking protection enabled',
      ],
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'security-headers',
      status: 'warning',
      score: 0,
      maxScore: 15,
      message: 'Could not verify security headers',
      details: ['Unable to fetch headers'],
      recommendations: ['Configure security headers on your server'],
    };
  }
}

async function checkInternalLinking(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    const internalLinks = (html.match(/href=["'][^"']*\/[^"']*["']/gi) || []).length;
    const externalLinks = (html.match(/href=["']https?:\/\/(?!.*\/)["']/gi) || []).length;
    const totalLinks = internalLinks + externalLinks;

    const hasFooterLinks = /<footer[\s\S]*?<\/footer>/.test(html);
    const hasNavigation = /<nav[\s\S]*?<\/nav>/.test(html);

    const score =
      (internalLinks > 0 ? 5 : 0) +
      (internalLinks > 5 ? 5 : 0) +
      (hasNavigation ? 3 : 0) +
      (hasFooterLinks ? 2 : 0);

    return {
      checkType: 'seo',
      name: 'internal-linking',
      status: score > 12 ? 'pass' : score > 6 ? 'warning' : 'fail',
      score: Math.min(score, 15),
      maxScore: 15,
      message: `Internal links: ${internalLinks}, External: ${externalLinks}`,
      details: [
        `Internal links: ${internalLinks} ${internalLinks > 5 ? '✓' : '⚠️'}`,
        `External links: ${externalLinks}`,
        `Navigation structure: ${hasNavigation ? 'Present ✓' : 'Not detected'}`,
        `Footer links: ${hasFooterLinks ? 'Present ✓' : 'Missing'}`,
      ],
      recommendations: [
        internalLinks < 5 ? 'Add more internal links to guide users and distribute page authority' : 'Good internal linking',
        'Link to relevant pages with descriptive anchor text',
        'Create a logical site structure with clear navigation',
      ],
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'internal-linking',
      status: 'fail',
      score: 0,
      maxScore: 15,
      message: 'Could not analyze internal linking',
      details: ['Error fetching page'],
      recommendations: ['Add internal links to improve site structure'],
    };
  }
}

async function checkIndexability2(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    const hasNoindex = /<meta[^>]*name=["']robots["'][^>]*content=["']noindex/.test(html);
    const hasCanonical = /<link[^>]*rel=["']canonical/.test(html);
    const blockImages = /Disallow:.*\.jpg|Disallow:.*\.png/.test(html);

    const score =
      (!hasNoindex ? 5 : 0) +
      (hasCanonical ? 3 : 0) +
      (!blockImages ? 2 : 0);

    return {
      checkType: 'seo',
      name: 'indexability',
      status: score > 8 ? 'pass' : score > 4 ? 'warning' : 'fail',
      score: Math.min(score, 10),
      maxScore: 10,
      message: `Indexability: ${!hasNoindex ? 'Indexable ✓' : 'Blocked ✗'}`,
      details: [
        `Noindex meta tag: ${hasNoindex ? 'Present (blocking!) ✗' : 'Not found ✓'}`,
        `Canonical tag: ${hasCanonical ? 'Present ✓' : 'Missing'}`,
        `Images blocked: ${blockImages ? 'Yes (bad) ✗' : 'No ✓'}`,
      ],
      recommendations: [
        hasNoindex ? 'Remove noindex meta tag to allow indexing' : 'Page is properly set for indexing',
        !hasCanonical ? 'Add canonical tag to prevent duplicate content issues' : 'Canonical tag present',
        'Ensure important resources are not blocked in robots.txt',
      ],
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'indexability',
      status: 'warning',
      score: 0,
      maxScore: 10,
      message: 'Could not verify indexability',
      details: ['Error fetching page'],
      recommendations: ['Check robots.txt and meta robots tags'],
    };
  }
}

async function checkMobileUsability(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    const hasViewport = /<meta[^>]*name=["']viewport/.test(html);
    const hasMediaQueries = /media\s*=\s*["']\(max-width/.test(html) || /@media[^{]*\(max-width/.test(html);
    const noSmallFont = !/font-size:\s*\d{1,2}px/i.test(html);

    const score =
      (hasViewport ? 7 : 0) +
      (hasMediaQueries ? 4 : 0) +
      (noSmallFont ? 1 : 0);

    return {
      checkType: 'seo',
      name: 'mobile-usability',
      status: score > 10 ? 'pass' : score > 5 ? 'warning' : 'fail',
      score: Math.min(score, 12),
      maxScore: 12,
      message: `Mobile optimized: ${hasViewport && hasMediaQueries ? 'Yes ✓' : 'Partially'}`,
      details: [
        `Viewport meta: ${hasViewport ? 'Present ✓' : 'Missing ✗'}`,
        `Media queries: ${hasMediaQueries ? 'Found ✓' : 'Not detected'}`,
        `Font sizing: ${noSmallFont ? 'Good ✓' : 'May be too small'}`,
      ],
      recommendations: [
        !hasViewport ? 'Add <meta name="viewport" content="width=device-width, initial-scale=1">' : 'Viewport is configured',
        !hasMediaQueries ? 'Use responsive design with media queries' : 'Responsive design detected',
        'Test on mobile devices and use Google Mobile-Friendly Test',
      ],
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'mobile-usability',
      status: 'warning',
      score: 0,
      maxScore: 12,
      message: 'Could not analyze mobile usability',
      details: ['Error fetching page'],
      recommendations: ['Test mobile friendliness in Google Search Console'],
    };
  }
}

async function checkSchema(domain: string): Promise<SEOCheckType> {
  try {
    const url = `https://${domain}/`;
    const response = await fetch(url, { timeout: 5000 });
    const html = response.ok ? await response.text() : '';

    const schemaMatches = html.match(/<script\s+type="application\/ld\+json"[^>]*>([^<]+)<\/script>/g) || [];
    const hasSchema = schemaMatches.length > 0;
    const schemaTypes: string[] = [];

    for (const match of schemaMatches) {
      try {
        const jsonMatch = match.match(/>([^<]+)</);
        if (jsonMatch) {
          const schema = JSON.parse(jsonMatch[1]);
          if (schema['@type']) {
            schemaTypes.push(schema['@type']);
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    }

    const schemaValid =
      hasSchema &&
      (schemaTypes.includes('Organization') ||
        schemaTypes.includes('BlogPosting') ||
        schemaTypes.includes('Article'));

    const score = hasSchema ? (schemaValid ? 20 : 10) : 0;

    return {
      checkType: 'seo',
      name: 'schema-validation',
      status: schemaValid ? 'pass' : hasSchema ? 'warning' : 'fail',
      score,
      maxScore: 20,
      message: schemaValid
        ? `Valid schema found: ${schemaTypes.join(', ')}`
        : hasSchema
          ? 'Schema found but may not be optimal'
          : 'No structured data found',
      details: [
        `Schemas present: ${schemaMatches.length}`,
        `Schema types: ${schemaTypes.length > 0 ? schemaTypes.join(', ') : 'None'}`,
        schemaValid ? 'Using recommended schemas' : 'Consider adding Organization, BlogPosting, or Article schema',
      ],
      recommendations: [
        !hasSchema
          ? 'Add JSON-LD structured data (Organization, BlogPosting, or Article schema)'
          : schemaValid
            ? 'Schema is properly configured'
            : 'Consider adding more specific schema types',
      ],
      hasSchema,
      schemaTypes,
      schemaValid,
    };
  } catch (error) {
    return {
      checkType: 'seo',
      name: 'schema-validation',
      status: 'fail',
      score: 0,
      maxScore: 20,
      message: 'Could not validate schema',
      details: ['Error analyzing page'],
      recommendations: ['Add structured data markup to improve search visibility'],
      hasSchema: false,
      schemaTypes: [],
      schemaValid: false,
    };
  }
}

const AEO_CHECK_MAP = {
  'ai-crawler-accessibility': {
    id: 'ai_crawler_access',
    label: 'AI Crawler Access',
    category: 'access',
    proOnly: false,
    shareSafe: true,
  },
  'llms-txt-validation': {
    id: 'llms_txt',
    label: 'llms.txt',
    category: 'access',
    proOnly: false,
    shareSafe: true,
  },
  'structured-data-quality': {
    id: 'structured_data',
    label: 'Structured Data',
    category: 'metadata',
    proOnly: true,
    shareSafe: true,
  },
  'content-extractability': {
    id: 'extractability',
    label: 'Extractability',
    category: 'structure',
    proOnly: true,
    shareSafe: true,
  },
  'ai-metadata': {
    id: 'ai_metadata',
    label: 'AI Metadata',
    category: 'metadata',
    proOnly: false,
    shareSafe: true,
  },
  'answer-format': {
    id: 'answer_format',
    label: 'Answer Format',
    category: 'content',
    proOnly: true,
    shareSafe: true,
  },
} as const;

function mapAeoCheck(check: AEOCheckType): AuditCheck {
  const config = AEO_CHECK_MAP[check.name as keyof typeof AEO_CHECK_MAP];
  const score = Math.round((check.score / check.maxScore) * 100);
  const explanation = check.details.join(' ');
  const recommendation =
    check.recommendations.find((rec) => rec.trim().length > 0) || 'No changes needed.';

  return {
    id: config?.id ?? check.name,
    label: config?.label ?? check.name,
    status: check.status,
    score,
    summary: check.message,
    details: {
      explanation,
      evidence: [],
      recommendation,
    },
    metadata: {
      is_share_safe: config?.shareSafe ?? true,
      is_pro_only: config?.proOnly ?? false,
      category: config?.category ?? 'content',
    },
  };
}

function normalizeAuditUrl(input: string): { auditedUrl: string; domain: string } {
  const trimmed = input.trim();
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(normalized);
  return { auditedUrl: parsed.origin, domain: parsed.hostname };
}

export async function auditDomain(request: AuditRequest): Promise<AuditResult> {
  if (!request.domain?.trim()) {
    throw new ValidationError('Domain is required');
  }

  const { auditedUrl, domain } = normalizeAuditUrl(request.domain);

  if (!/^[a-z0-9]([a-z0-9-]*\.)+[a-z]{2,}$/i.test(domain)) {
    throw new ValidationError(`Invalid domain format: ${domain}`);
  }

  const checksPromise = Promise.all([
    checkAICrawlerAccessibility(domain),
    checkLLMsTxt(domain),
    checkStructuredData(domain),
    checkExtractability(domain),
    checkAIMetadata(domain),
    checkAnswerFormat(domain),
  ]);

  let aeoChecks: AEOCheckType[];
  try {
    aeoChecks = await Promise.race([
      checksPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new TimeoutError(domain)), AUDIT_TIMEOUT_MS)
      ),
    ]);
  } catch (error) {
    if (error instanceof AuditError) throw error;
    throw new NetworkError(domain, error instanceof Error ? error.message : 'Unknown error');
  }

  const overallScore = Math.round(
    aeoChecks.reduce((acc, check) => {
      const weight = AEO_CHECK_WEIGHTS[check.name as keyof typeof AEO_CHECK_WEIGHTS] || 0;
      return acc + (check.score / check.maxScore) * weight;
    }, 0)
  );

  const safeScore = Math.max(0, Math.min(100, overallScore));

  return {
    schema_version: AUDIT_SCHEMA_VERSION,
    audit_id: randomUUID(),
    audited_url: auditedUrl,
    audited_at: new Date().toISOString(),
    overall_score: safeScore,
    visibility_summary: {
      ai_visible_percentage: safeScore,
      ai_invisible_percentage: 100 - safeScore,
    },
    checks: aeoChecks.map(mapAeoCheck),
    notes: [],
    limits: {
      plan: 'free',
      audits_remaining: 3,
      export_available: false,
      history_days: 0,
    },
  };
}

function getGrade(score: number): AEOGrade {
  for (const [grade, range] of Object.entries(GRADING_SCALE)) {
    if (score >= range.min && score <= range.max) {
      return grade as AEOGrade;
    }
  }
  return 'F';
}

function getScoreMessage(score: number, grade: AEOGrade): string {
  const messages: Record<AEOGrade, string> = {
    A: 'Excellent AI Search Readiness - Your content is optimized for Perplexity, Claude, ChatGPT',
    B: 'Good AI Search Readiness - Minor improvements recommended',
    C: 'Moderate AI Search Readiness - Several areas need optimization',
    D: 'Poor AI Search Readiness - Significant improvements needed',
    F: 'Critical Issues - Your site is largely invisible to AI search engines',
  };
  return messages[grade];
}

function generateImprovements(checks: AEOCheckType[]): AEOImprovement[] {
  const improvements: AEOImprovement[] = [];

  for (const check of checks) {
    if (check.score < check.maxScore) {
      const pointsGain = check.maxScore - check.score;
      const priority: 'critical' | 'high' | 'medium' | 'low' =
        check.status === 'fail'
          ? 'critical'
          : check.status === 'warning'
            ? 'high'
            : 'medium';

      check.recommendations.forEach((rec) => {
        if (rec) {
          improvements.push({
            priority,
            check: check.name,
            issue: check.message,
            fix: rec,
            pointsGain,
            effort: pointsGain > 5 ? 'complex' : pointsGain > 2 ? 'medium' : 'quick',
          });
        }
      });
    }
  }

  // Sort by priority and points gain
  return improvements.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return (
      (priorityOrder[a.priority] - priorityOrder[b.priority]) ||
      (b.pointsGain - a.pointsGain)
    );
  });
}
