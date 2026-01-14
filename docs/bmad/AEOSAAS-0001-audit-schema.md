AEOSAAS-0001 — Audit Result JSON Schema (v1)

Purpose

This schema defines the canonical output of an AI Search Readiness (AEO) audit.

It is the contract for:

Frontend rendering

Shareable audit links

Subscription gating

Planner inputs

PDF exports

Affiliate demos

Versioning
{
  "schema_version": "1.0.0"
}
Top-Level Structure
{
  "schema_version": "1.0.0",
  "audit_id": "uuid",
  "audited_url": "https://example.com",
  "audited_at": "ISO-8601 timestamp",

  "overall_score": 72,
  "visibility_summary": {
    "ai_visible_percentage": 40,
    "ai_invisible_percentage": 60
  },

  "checks": [],
  "notes": [],
  "limits": {}
}
Checks Array (Core Domain)

Each check follows a strict, repeatable shape.

{
  "id": "ai_crawler_access",
  "label": "AI Crawler Access",
  "status": "pass | fail | warning",
  "score": 0-100,

  "summary": "Plain-language outcome sentence.",

  "details": {
    "explanation": "Human-readable explanation.",
    "evidence": [],
    "recommendation": "Actionable next step."
  },

  "metadata": {
    "is_share_safe": true,
    "is_pro_only": false,
    "category": "access | structure | metadata | content"
  }
}
Required Checks (v1)
1. AI Crawler Access

robots.txt rules

GPTBot / ClaudeBot / PerplexityBot

2. llms.txt

Presence

Validity

Discoverability

3. Structured Data

JSON-LD presence

Schema.org validity

Coverage

4. Extractability

Semantic HTML

Headings

Main content clarity

5. AI Metadata

Canonical URLs

Dates

Open Graph tags

6. Answer Format

FAQ / HowTo schema

Lists and sections

Notes (Cross-Cutting Observations)
{
  "type": "info | warning",
  "message": "High-level observation not tied to a single check."
}
Limits Object (Plan-Aware)

Used to explain gated features clearly.

{
  "plan": "free | pro",
  "audits_remaining": 1,
  "export_available": false,
  "history_days": 0
}
Share-Safe Rules

All summary fields must be non-technical

No internal scoring weights exposed

No sensitive headers or crawl internals

Pro-Only Fields

Fields marked is_pro_only: true may be:

Redacted

Blurred

Previewed with upgrade CTA

Forward Compatibility

New checks must be additive

Existing IDs are immutable

Schema version bumps required for breaking changes
