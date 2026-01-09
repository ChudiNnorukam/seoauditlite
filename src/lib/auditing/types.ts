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
  'sitemap-validation': 20,
  'robots-txt-analysis': 15,
  'meta-tags-validation': 25,
  'performance-metrics': 20,
  'schema-validation': 20,
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
