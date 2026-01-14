export const AUDIT_SCHEMA_VERSION = '1.0.0';

export type AuditCheckStatus = 'pass' | 'fail' | 'warning';
export type AuditNoteType = 'info' | 'warning';
export type AuditCheckCategory = 'access' | 'structure' | 'metadata' | 'content';

export interface AuditCheck {
  id: string;
  label: string;
  status: AuditCheckStatus;
  score: number;
  summary: string;
  details: {
    explanation: string;
    evidence: string[];
    recommendation: string;
  };
  metadata: {
    is_share_safe: boolean;
    is_pro_only: boolean;
    category: AuditCheckCategory;
  };
}

export interface AuditNote {
  type: AuditNoteType;
  message: string;
}

export interface AuditLimits {
  plan: 'free' | 'pro';
  audits_remaining: number;
  export_available: boolean;
  history_days: number;
}

export interface AuditResult {
  schema_version: string;
  audit_id: string;
  audited_url: string;
  audited_at: string;
  overall_score: number;
  visibility_summary: {
    ai_visible_percentage: number;
    ai_invisible_percentage: number;
  };
  checks: AuditCheck[];
  notes: AuditNote[];
  limits: AuditLimits;
}

export interface AuditRequest {
  domain: string;
  fullUrl?: boolean;
}

export interface AuditApiResponse {
  success: boolean;
  data?: AuditResult;
  error?: string;
  code?: string;
}
