-- ============================================================
-- MicroSaaSBot Knowledge Base Schema
-- Supabase + pgvector for reflexive learning
-- ============================================================

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- SOPs: Standard Operating Procedures for micro-saas patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS sops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,           -- 'auth', 'billing', 'deployment', 'database', 'seo'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),            -- Using 768 dimensions (nomic-embed-text)
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sops_category ON sops(category);
CREATE INDEX IF NOT EXISTS idx_sops_embedding ON sops USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- Mistakes: Error logs and learnings for reflexive improvement
-- ============================================================
CREATE TABLE IF NOT EXISTS mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_signature TEXT,             -- Unique identifier for error type
    context JSONB,                    -- What was happening (file, function, etc.)
    root_cause TEXT,
    fix_applied TEXT,
    outcome TEXT CHECK (outcome IN ('success', 'partial', 'failed', 'pending')),
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mistakes_signature ON mistakes(error_signature);
CREATE INDEX IF NOT EXISTS idx_mistakes_outcome ON mistakes(outcome);
CREATE INDEX IF NOT EXISTS idx_mistakes_embedding ON mistakes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- Patterns: Reusable full-stack implementation patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stack TEXT NOT NULL,              -- 'sveltekit', 'nextjs', 'astro'
    layer TEXT NOT NULL,              -- 'frontend', 'backend', 'database', 'infra'
    component TEXT NOT NULL,          -- 'auth', 'billing', 'api', 'seo', 'validation'
    pattern_name TEXT NOT NULL,
    implementation TEXT NOT NULL,
    gotchas TEXT,                     -- Common pitfalls to avoid
    embedding vector(768),
    times_used INT DEFAULT 0,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patterns_stack ON patterns(stack);
CREATE INDEX IF NOT EXISTS idx_patterns_layer ON patterns(layer);
CREATE INDEX IF NOT EXISTS idx_patterns_component ON patterns(component);
CREATE INDEX IF NOT EXISTS idx_patterns_embedding ON patterns USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- ============================================================
-- Decisions: Track architectural and implementation decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project TEXT,                     -- Which project this applies to
    category TEXT NOT NULL,           -- 'architecture', 'tooling', 'library', 'pattern'
    title TEXT NOT NULL,
    context TEXT NOT NULL,            -- Why this decision was needed
    options_considered JSONB,         -- [{option, pros, cons}]
    decision_made TEXT NOT NULL,
    rationale TEXT NOT NULL,
    outcome TEXT,                     -- How it worked out
    embedding vector(768),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(category);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project);

-- ============================================================
-- Similarity Search Functions
-- ============================================================

-- Search SOPs by category with semantic filter
CREATE OR REPLACE FUNCTION search_sops(
    query_embedding vector(768),
    filter_category TEXT DEFAULT NULL,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    category TEXT,
    title TEXT,
    content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.category,
        s.title,
        s.content,
        1 - (s.embedding <=> query_embedding) as similarity
    FROM sops s
    WHERE s.embedding IS NOT NULL
      AND (filter_category IS NULL OR s.category = filter_category)
    ORDER BY s.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Find similar past mistakes
CREATE OR REPLACE FUNCTION find_similar_mistakes(
    query_embedding vector(768),
    match_count INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    error_signature TEXT,
    root_cause TEXT,
    fix_applied TEXT,
    outcome TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.error_signature,
        m.root_cause,
        m.fix_applied,
        m.outcome,
        1 - (m.embedding <=> query_embedding) as similarity
    FROM mistakes m
    WHERE m.embedding IS NOT NULL
      AND m.outcome = 'success'  -- Only return successful fixes
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Find relevant patterns
CREATE OR REPLACE FUNCTION find_patterns(
    query_embedding vector(768),
    filter_stack TEXT DEFAULT NULL,
    filter_component TEXT DEFAULT NULL,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    stack TEXT,
    layer TEXT,
    component TEXT,
    pattern_name TEXT,
    implementation TEXT,
    gotchas TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.stack,
        p.layer,
        p.component,
        p.pattern_name,
        p.implementation,
        p.gotchas,
        1 - (p.embedding <=> query_embedding) as similarity
    FROM patterns p
    WHERE p.embedding IS NOT NULL
      AND (filter_stack IS NULL OR p.stack = filter_stack)
      AND (filter_component IS NULL OR p.component = filter_component)
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ============================================================
-- Helper function to update pattern usage stats
-- ============================================================
CREATE OR REPLACE FUNCTION increment_pattern_usage(pattern_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE patterns
    SET times_used = times_used + 1,
        last_used = NOW()
    WHERE id = pattern_id;
END;
$$;

-- ============================================================
-- Trigger to auto-update updated_at on SOPs
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sops_updated_at
    BEFORE UPDATE ON sops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
