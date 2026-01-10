/**
 * SEOAuditLite Type Definitions
 * Core types for AEO auditing engine
 */

// ============================================================================
// AEO Check Results
// ============================================================================

export type CheckStatus = 'pass' | 'warning' | 'fail';

export interface AEOCheckResult {
  name: string;
  status: CheckStatus;
  score: number;
  maxScore: number;
  message: string;
  details: string[];
  recommendations: string[];
}

// ============================================================================
// Individual AEO Checks
// ============================================================================

export interface AIChecks {
  botName: string;
  allowed: boolean;
  userAgent: string;
}

export interface RobotsCheckResult extends AEOCheckResult {
  name: 'ai-crawler-accessibility';
  robotsUrl: string;
  robotsAccessible: boolean;
  robotsContent: string | null;
  aiBotsAllowed: AIChecks[];
}

export interface LLMsCheckResult extends AEOCheckResult {
  name: 'llms-txt-validation';
  llmsUrl: string;
  llmsExists: boolean;
  llmsContent: string | null;
  hasSitemap: boolean;
  hasRSS: boolean;
  isValid: boolean;
}

export interface StructuredDataCheckResult extends AEOCheckResult {
  name: 'structured-data-quality';
  schemas: {
    type: string;
    present: boolean;
    valid: boolean;
  }[];
  totalSchemas: number;
}

export interface ExtractabilityCheckResult extends AEOCheckResult {
  name: 'content-extractability';
  htmlValid: boolean;
  hasSemanticTags: boolean;
  headingHierarchyValid: boolean;
  textToHTMLRatio: number;
  imagesWithAlt: number;
  imagesTotal: number;
}

export interface AIMetadataCheckResult extends AEOCheckResult {
  name: 'ai-metadata';
  hasCanonical: boolean;
  canonicalValid: boolean;
  hasOGTags: boolean;
  hasMetaDescription: boolean;
  hasDatePublished: boolean;
  metaDescriptionLength: number;
}

export interface AnswerFormatCheckResult extends AEOCheckResult {
  name: 'answer-format';
  hasFAQSchema: boolean;
  hasHowToSchema: boolean;
  hasLists: boolean;
  hasTables: boolean;
  hasDefinitionList: boolean;
  headerCount: number;
  questionsDetected: number;
}

export type AEOCheckType =
  | RobotsCheckResult
  | LLMsCheckResult
  | StructuredDataCheckResult
  | ExtractabilityCheckResult
  | AIMetadataCheckResult
  | AnswerFormatCheckResult;

// ============================================================================
// Overall AEO Score
// ============================================================================

export type AEOGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface SEOCheckResult extends AEOCheckResult {
  checkType: 'seo';
}

export interface SitemapCheckResult extends SEOCheckResult {
  name: 'sitemap-validation';
  sitemapUrl: string;
  sitemapExists: boolean;
  sitemapValid: boolean;
  urlCount: number;
  lastModRecent: boolean;
}

export interface RobotsCheckResultSEO extends SEOCheckResult {
  name: 'robots-txt-analysis';
  robotsValid: boolean;
  blocksUserAgent: boolean;
  hasDisallowRules: boolean;
}

export interface MetaTagsCheckResult extends SEOCheckResult {
  name: 'meta-tags-validation';
  titlePresent: boolean;
  titleLength: number;
  descriptionPresent: boolean;
  descriptionLength: number;
  hasCanonical: boolean;
  hasOGImage: boolean;
  viewportConfigured: boolean;
}

export interface PerformanceCheckResult extends SEOCheckResult {
  name: 'performance-metrics';
  metatags: {
    hasCharset: boolean;
    hasViewport: boolean;
  };
  images: {
    total: number;
    withoutAlt: number;
    withoutLazyLoad: number;
  };
  cssInline: boolean;
  minified: boolean;
}

export interface SchemaValidationResult extends SEOCheckResult {
  name: 'schema-validation';
  hasSchema: boolean;
  schemaTypes: string[];
  schemaValid: boolean;
}

export type SEOCheckType =
  | SitemapCheckResult
  | RobotsCheckResultSEO
  | MetaTagsCheckResult
  | PerformanceCheckResult
  | SchemaValidationResult;

export interface AEOScore {
  domain: string;
  auditDate: Date;
  aeoScore: number;
  seoScore: number;
  combinedScore: number;
  grade: AEOGrade;
  message: string;
  breakdown: {
    aeo: {
      aiCrawlers: number;
      llmsTxt: number;
      structuredData: number;
      extractability: number;
      aiMetadata: number;
      answerFormat: number;
    };
    seo: {
      sitemap: number;
      robots: number;
      metaTags: number;
      performance: number;
      schema: number;
    };
  };
  checks: {
    aeo: AEOCheckType[];
    seo: SEOCheckType[];
  };
  improvements: AEOImprovement[];
}

// ============================================================================
// Improvements and Recommendations
// ============================================================================

export interface AEOImprovement {
  priority: 'critical' | 'high' | 'medium' | 'low';
  check: string;
  issue: string;
  fix: string;
  pointsGain: number;
  effort: 'quick' | 'medium' | 'complex';
}

// ============================================================================
// API Request/Response
// ============================================================================

export interface AuditRequest {
  domain: string;
  fullUrl?: boolean;
}

export interface AuditResponse {
  success: boolean;
  data?: AEOScore;
  error?: string;
  code?: string;
}

// ============================================================================
// Audit History (for Pro tier)
// ============================================================================

export interface AuditHistory {
  id: string;
  domain: string;
  score: number;
  grade: AEOGrade;
  auditDate: Date;
  userId?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class AuditError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuditError';
  }
}

export class NetworkError extends AuditError {
  constructor(domain: string, message: string) {
    super('NETWORK_ERROR', `Failed to fetch ${domain}: ${message}`, 503);
  }
}

export class ValidationError extends AuditError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class TimeoutError extends AuditError {
  constructor(domain: string) {
    super('TIMEOUT_ERROR', `Audit timeout for ${domain} (>30s)`, 504);
  }
}

// ============================================================================
// Configuration
// ============================================================================

export const AEO_CHECK_WEIGHTS = {
  'ai-crawler-accessibility': 20,
  'llms-txt-validation': 15,
  'structured-data-quality': 25,
  'content-extractability': 20,
  'ai-metadata': 10,
  'answer-format': 10,
} as const;

export const SEO_CHECK_WEIGHTS = {
  'sitemap-validation': 10,
  'robots-txt-analysis': 8,
  'meta-tags-validation': 15,
  'performance-metrics': 10,
  'schema-validation': 10,
  'heading-structure': 15,
  'core-web-vitals': 20,
  'content-analysis': 15,
  'security-headers': 15,
  'internal-linking': 15,
  'indexability': 10,
  'mobile-usability': 12,
  'images-media': 10,
} as const;

// Educational metadata for each check
export const CHECK_EDUCATION = {
  'heading-structure': {
    title: 'Heading Structure',
    importance: 'Critical for both SEO and AI readability',
    whatItMeans: 'Search engines and AI models use headings to understand page structure. Each page should have one H1, proper H2-H3 hierarchy.',
    whyItMatters: 'Poor heading structure makes content harder to scan for users and confuses crawlers about page topic.',
    learnMore: 'https://moz.com/learn/seo/heading',
  },
  'core-web-vitals': {
    title: 'Core Web Vitals',
    importance: 'Major Google ranking factor (100% of grade)',
    whatItMeans: 'LCP (Largest Contentful Paint) measures loading speed, FID (First Input Delay) measures interactivity, CLS (Cumulative Layout Shift) measures visual stability.',
    whyItMatters: 'Google announced Core Web Vitals as ranking signals in 2021. Poor vitals hurt rankings and cause users to leave.',
    learnMore: 'https://web.dev/vitals/',
  },
  'content-analysis': {
    title: 'Content Quality & Depth',
    importance: 'Foundation of SEO and AEO performance',
    whatItMeans: 'Measures word count (400+ recommended), readability, keyword coverage, and unique value.',
    whyItMatters: 'Search engines prefer comprehensive, original content. AI models look for substantive, well-structured information.',
    learnMore: 'https://moz.com/learn/seo/content',
  },
  'security-headers': {
    title: 'Security Headers',
    importance: 'Protects your site and users from attacks',
    whatItMeans: 'HTTP headers like HSTS, CSP, X-Frame-Options, X-Content-Type-Options prevent security vulnerabilities.',
    whyItMatters: 'Browsers trust sites with proper security headers. Google prioritizes secure sites in rankings.',
    learnMore: 'https://owasp.org/www-project-secure-headers/',
  },
  'internal-linking': {
    title: 'Internal Linking',
    importance: 'Distributes page authority throughout your site',
    whatItMeans: 'Links between your own pages guide crawlers to important content and distribute ranking power.',
    whyItMatters: 'Poor internal linking buries important pages. Strong internal links increase crawlability and establish topic hierarchy.',
    learnMore: 'https://moz.com/learn/seo/internal-link',
  },
  'indexability': {
    title: 'Crawlability & Indexability',
    importance: 'Prerequisite for all rankings',
    whatItMeans: 'Checks if search engines can crawl and index your pages. Detects noindex tags, redirect chains, blocked resources.',
    whyItMatters: 'If a page cannot be indexed, it cannot rank. Broken redirect chains waste crawler budget.',
    learnMore: 'https://support.google.com/webmasters/answer/7440203',
  },
  'mobile-usability': {
    title: 'Mobile Friendliness',
    importance: 'Google uses mobile-first indexing exclusively',
    whatItMeans: 'Verifies pages are responsive, have proper viewport settings, and fast on mobile networks.',
    whyItMatters: 'Google now crawls desktop versions last. Most users visit from mobile. Poor mobile experience kills rankings and conversions.',
    learnMore: 'https://developers.google.com/search/mobile-sites',
  },
  'images-media': {
    title: 'Image Optimization',
    importance: 'Improves accessibility, performance, and rankings',
    whatItMeans: 'Checks alt text (for accessibility), lazy loading (for speed), file sizes, and modern formats (WebP).',
    whyItMatters: 'Optimized images improve Core Web Vitals scores, accessibility for screen readers, and allow Google to index images.',
    learnMore: 'https://web.dev/performance-images/',
  },
} as const;

export const GRADING_SCALE = {
  A: { min: 90, max: 100 },
  B: { min: 80, max: 89 },
  C: { min: 70, max: 79 },
  D: { min: 60, max: 69 },
  F: { min: 0, max: 59 },
} as const;

export const AI_CRAWLERS = [
  { userAgent: 'GPTBot', name: 'OpenAI GPT' },
  { userAgent: 'ClaudeBot', name: 'Anthropic Claude' },
  { userAgent: 'PerplexityBot', name: 'Perplexity' },
  { userAgent: 'Googlebot-Extended', name: 'Google AI' },
  { userAgent: 'CCBot', name: 'CommonCrawl' },
] as const;

export const AUDIT_TIMEOUT_MS = 30000; // 30 seconds
export const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB
