Perfect. Below is a **BMAD-correct Phase-2 Quick Flow tech-spec**, written to **retrofit and legitimize the existing `/planner` implementation exactly as it exists today** — no scope creep, no future-casting.

This is ready to:

* drop into your repo (e.g. `docs/seoauditlite-planner-tech-spec.md`)
* or paste into BMAD story context
* or use as the approval artifact before `resume_story`

---

## Phase-2 Quick Flow Tech-Spec

**Project:** SEOAuditLite
**Feature:** AEO Quick Wins Planner (`/planner`)
**BMAD Track:** Quick Flow
**Status:** Retroactive spec for existing implementation
**Authoritative after approval**

# Phase-2 Tech Spec — AEO Quick Wins Planner

## 1. Purpose

The **AEO Quick Wins Planner** is a lightweight, human-centered micro-app designed to help developers and founders identify **high-impact, low-effort actions** that improve AI search readiness (SEO, AEO, LLM discoverability).

It prioritizes *clarity and actionability* over exhaustive analysis and deliberately avoids “full audit” complexity.

This feature lives inside **SEOAuditLite** as a focused decision-support tool, not a crawler or automation engine.

---

## 2. Target User & Primary Use Case

**Primary user**

* Indie developers, technical founders, or small teams
* Already thinking about SEO/AEO, but unsure where to start
* Wants fast guidance without running a full audit

**Primary use case**

* User has (or just completed) a lightweight SEO/AEO audit
* User wants to decide **what to fix first**
* Planner helps rank tasks by **impact vs effort**
* User exports a short, actionable plan

---

## 3. Feature Scope (Acceptance Criteria)

The planner MUST provide:

### 3.1 Route & Access

* Route available at `/planner`
* Discoverable via:

  * Homepage CTA
  * Sitemap entry

---

### 3.2 Domain Context

* Input field for target domain
* If a previous audit exists in `sessionStorage`, the domain is auto-prefilled
* Domain is treated as *context only* (no validation, crawling, or API calls)

---

### 3.3 Task Library

* Curated set of predefined “AEO quick win” tasks
* Tasks grouped by category (e.g. Structure, Metadata, Content, Technical)
* Tasks are human-readable and educational, not prescriptive automation

---

### 3.4 Impact / Effort Scoring

* Each task can be scored on:

  * **Impact** (relative benefit)
  * **Effort** (relative cost)
* Scores are lightweight (not statistically precise)
* Planner computes a combined prioritization signal (e.g. quick wins)

---

### 3.5 Planner Output

* User can generate a prioritized list of actions
* Output supports:

  * Copy to clipboard
  * Download (e.g. text/markdown)

No external persistence is required.

---

## 4. UX & Interaction Principles

* Calm, focused UI
* One primary task at a time
* No dashboards, charts, or gamification
* Clear language; no SEO jargon without explanation
* Optimized for thinking, not scanning

Design should feel:

* Lightweight
* Non-overwhelming
* Purposeful

---

## 5. Data Model (Conceptual)

All data is client-side only.

**Entities**

* `Task`

  * id
  * title
  * category
  * description
  * impactScore
  * effortScore

**State**

* Selected tasks
* Computed priority ordering
* Optional domain string (from input or sessionStorage)

No backend, database, or API integrations.

---

## 6. Non-Goals (Explicit)

This feature will NOT:

* Crawl websites
* Analyze competitors
* Generate keywords
* Rewrite content
* Integrate with Google Search Console or analytics
* Persist user data beyond the session
* Replace a full SEO/AEO audit

If a request exceeds these bounds, it is out of scope for `/planner`.

---

## 7. Risks & Constraints

* Over-expansion risk: feature must remain “lite”
* Scores are heuristic and must not be presented as objective truth
* Planner should guide judgment, not replace it

Primary constraint:

> **The planner exists to help users decide what to do next — not to do it for them.**

---

## 8. Implementation Notes (Current State)

* Implemented as `src/routes/planner/+page.svelte`
* Homepage CTA added in `src/routes/+page.svelte`
* Sitemap updated in `src/routes/sitemap.xml/+server.ts`
* No automated tests added
* Smoke testing sufficient for this feature

---

## 9. Phase-4 Expectation

Upon approval of this spec:

* Existing implementation is treated as valid
* BMAD resumes in **verify-only** mode
* No new features added during verification
* Story may be marked complete or paused for future iteration

---

### Facilitator note (plain English)

This spec does **three critical things**:

1. It legitimizes what already exists
2. It freezes scope cleanly
3. It gives BMAD an artifact it can trust

If you want, next I can:

* Help you **attach this spec to the BMAD story**
* Or walk you through the **exact `resume_story` call** and what will happen next

You’re back on solid rails now.
