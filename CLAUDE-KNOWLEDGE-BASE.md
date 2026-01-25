# MicroSaaSBot Knowledge Base Integration

> This file instructs Claude Code CLI how to use the Supabase knowledge base for reflexive learning.

## Available MCP Tools

When the Supabase MCP server is connected, you can:
- Query `sops`, `mistakes`, `patterns`, `decisions` tables directly
- Use similarity search functions for semantic retrieval
- Insert new learnings and update existing records

## Workflow: Before Starting Any Task

### 1. Query Relevant SOPs

```sql
SELECT title, content
FROM sops
WHERE category = '[relevant-category]'
ORDER BY updated_at DESC
LIMIT 3;
```

Categories: `auth`, `billing`, `deployment`, `database`, `seo`, `testing`, `security`

### 2. Check for Similar Past Mistakes

```sql
SELECT error_signature, root_cause, fix_applied, outcome
FROM mistakes
WHERE outcome = 'success'
  AND (
    error_signature ILIKE '%[keyword]%'
    OR root_cause ILIKE '%[keyword]%'
  )
ORDER BY created_at DESC
LIMIT 3;
```

### 3. Load Implementation Patterns

```sql
SELECT pattern_name, implementation, gotchas
FROM patterns
WHERE stack = '[current-stack]'
  AND component = '[current-component]'
ORDER BY times_used DESC;
```

Stacks: `sveltekit`, `nextjs`, `astro`, `general`
Components: `auth`, `billing`, `api`, `seo`, `forms`, `database`

### 4. Review Past Decisions

```sql
SELECT title, decision_made, rationale, outcome
FROM decisions
WHERE category = '[decision-category]'
ORDER BY created_at DESC
LIMIT 3;
```

## Workflow: After Completing a Task

### 1. Log Any Errors Encountered

```sql
INSERT INTO mistakes (error_signature, context, root_cause, fix_applied, outcome)
VALUES (
  '[concise-error-identifier]',
  '{"file": "...", "function": "...", "stack": "..."}',
  '[what caused it]',
  '[how it was fixed]',
  'success'  -- or 'partial', 'failed', 'pending'
);
```

### 2. Update SOPs If Process Changed

```sql
UPDATE sops
SET content = '[updated-content]',
    version = version + 1,
    updated_at = NOW()
WHERE id = '[sop-id]';
```

### 3. Add New Patterns Discovered

```sql
INSERT INTO patterns (stack, layer, component, pattern_name, implementation, gotchas)
VALUES (
  '[stack]',
  '[layer]',
  '[component]',
  '[descriptive-name]',
  '[step-by-step-implementation]',
  '[common-pitfalls]'
);
```

### 4. Record Significant Decisions

```sql
INSERT INTO decisions (project, category, title, context, options_considered, decision_made, rationale)
VALUES (
  '[project-name]',
  '[category]',
  '[decision-title]',
  '[why-decision-was-needed]',
  '[{"option": "...", "pros": "...", "cons": "..."}]',
  '[chosen-option]',
  '[why-this-was-chosen]'
);
```

## Reflexive Learning Protocol

When an error occurs:

1. **Search for similar mistakes** using semantic similarity or keyword match
2. **If found with 'success' outcome** → Apply the known fix
3. **If new error** → Document fully before attempting fix:
   - Error signature (unique identifier)
   - Context (what was happening)
   - Initial hypothesis for root cause
4. **After resolution** → Update mistake record with:
   - Confirmed root cause
   - Fix that worked
   - Outcome status

## Semantic Search (When Embeddings Available)

For more accurate retrieval, use the similarity search functions:

```sql
-- Find similar SOPs
SELECT * FROM search_sops(
  '[query-embedding-vector]'::vector,
  'auth',  -- optional category filter
  5        -- number of results
);

-- Find similar past mistakes
SELECT * FROM find_similar_mistakes(
  '[query-embedding-vector]'::vector,
  3  -- number of results
);

-- Find relevant patterns
SELECT * FROM find_patterns(
  '[query-embedding-vector]'::vector,
  'sveltekit',  -- optional stack filter
  'auth',       -- optional component filter
  5             -- number of results
);
```

Note: Generate embeddings using the Ollama pipeline script before using semantic search.

## Quick Reference: Categories

| Table | Categories/Types |
|-------|-----------------|
| SOPs | auth, billing, deployment, database, seo, testing, security, performance |
| Patterns | **Stacks**: sveltekit, nextjs, astro, general |
| Patterns | **Layers**: frontend, backend, database, infra, integration |
| Patterns | **Components**: auth, billing, api, seo, validation, caching, logging, forms |
| Decisions | architecture, tooling, library, pattern, infrastructure |
| Mistakes | outcome: success, partial, failed, pending |

## Usage Pattern

```
[Before task]
1. What SOPs exist for this type of task?
2. Have I seen similar errors before?
3. What patterns should I follow?

[During task]
4. Follow established patterns
5. Note any deviations or issues

[After task]
6. Log new mistakes (if any)
7. Update SOPs if process improved
8. Add new patterns discovered
9. Record significant decisions
```
