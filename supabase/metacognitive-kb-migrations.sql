-- ============================================================
-- METACOGNITIVE KNOWLEDGE BASE EXTENSIONS
-- Run this in Supabase SQL Editor to enable self-aware research
-- ============================================================

-- ============================================================
-- 1. DECISIONS TABLE (if not exists)
-- Track architectural and research decisions
-- ============================================================
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_type TEXT NOT NULL,          -- 'research_strategy', 'architecture', 'tool_choice'
    context JSONB,                         -- What situation prompted this decision
    options_considered JSONB,              -- What alternatives were evaluated
    chosen_option TEXT NOT NULL,           -- What was selected
    rationale TEXT,                        -- Why this was chosen
    outcome TEXT DEFAULT 'pending',        -- 'success', 'partial', 'failed', 'pending'
    outcome_notes TEXT,                    -- What happened
    created_at TIMESTAMPTZ DEFAULT NOW(),
    evaluated_at TIMESTAMPTZ              -- When outcome was assessed
);

CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_outcome ON decisions(outcome);

-- ============================================================
-- 2. RESEARCH SESSIONS TABLE
-- Track each research session for learning
-- ============================================================
CREATE TABLE IF NOT EXISTS research_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What was researched
    focus_areas TEXT[],                    -- Categories targeted
    gaps_identified JSONB,                 -- What gaps were found
    
    -- What was done
    queries_used TEXT[],                   -- Search queries executed
    sources_found JSONB,                   -- URLs and sources discovered
    entries_created INT DEFAULT 0,         -- How many new entries added
    entries_updated INT DEFAULT 0,         -- How many entries refreshed
    
    -- Effectiveness tracking
    search_strategy TEXT,                  -- 'foundational', 'depth', 'refresh', 'pattern'
    strategy_effectiveness TEXT,           -- 'high', 'medium', 'low' (set after usage)
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_minutes INT GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at)) / 60
    ) STORED
);

CREATE INDEX idx_research_focus ON research_sessions USING GIN(focus_areas);
CREATE INDEX idx_research_strategy ON research_sessions(search_strategy);

-- ============================================================
-- 3. KNOWLEDGE GAPS TABLE
-- Persistent tracking of identified gaps
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Gap identification
    gap_type TEXT NOT NULL,                -- 'missing_category', 'low_coverage', 'stale', 'missing_pattern'
    target_table TEXT NOT NULL,            -- 'sops', 'patterns', 'mistakes'
    category TEXT,                         -- Which category/component
    stack TEXT,                            -- For patterns: which tech stack
    
    -- Gap details
    current_count INT DEFAULT 0,           -- How many entries exist
    target_count INT DEFAULT 3,            -- Minimum desired entries
    last_entry_age_days INT,               -- Days since last update
    
    -- Priority and status
    priority TEXT DEFAULT 'medium',        -- 'critical', 'high', 'medium', 'low'
    status TEXT DEFAULT 'open',            -- 'open', 'in_progress', 'filled', 'deferred'
    
    -- Resolution tracking
    filled_by_session UUID REFERENCES research_sessions(id),
    filled_at TIMESTAMPTZ,
    
    -- Metadata
    identified_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT
);

CREATE INDEX idx_gaps_status ON knowledge_gaps(status);
CREATE INDEX idx_gaps_priority ON knowledge_gaps(priority);
CREATE INDEX idx_gaps_type ON knowledge_gaps(gap_type);

-- ============================================================
-- 4. SEARCH EFFECTIVENESS TABLE
-- Learn which search queries work best for which topics
-- ============================================================
CREATE TABLE IF NOT EXISTS search_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Query details
    query_template TEXT NOT NULL,          -- The search query pattern used
    category TEXT,                         -- What category it was for
    
    -- Results
    results_found INT,                     -- How many results returned
    results_useful INT,                    -- How many were actually useful
    usefulness_ratio FLOAT GENERATED ALWAYS AS (
        CASE WHEN results_found > 0 
             THEN results_useful::FLOAT / results_found 
             ELSE 0 
        END
    ) STORED,
    
    -- What was extracted
    entries_created INT DEFAULT 0,         -- How many KB entries resulted
    
    -- Learning
    effectiveness_score FLOAT,             -- Manual rating 0-1
    notes TEXT,                            -- What made it effective/ineffective
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_category ON search_effectiveness(category);
CREATE INDEX idx_search_effectiveness ON search_effectiveness(effectiveness_score DESC);

-- ============================================================
-- 5. VIEWS FOR GAP ANALYSIS
-- ============================================================

-- View: Current knowledge gaps by category
CREATE OR REPLACE VIEW v_category_gaps AS
WITH category_targets AS (
    SELECT unnest(ARRAY[
        'auth', 'billing', 'deployment', 'database', 'seo', 
        'testing', 'security', 'performance', 'monitoring', 'devops',
        'api', 'caching', 'validation', 'error-handling', 'logging'
    ]) as target_category,
    3 as min_entries  -- Minimum desired per category
)
SELECT 
    ct.target_category as category,
    COALESCE(s.entry_count, 0) as current_entries,
    ct.min_entries as target_entries,
    ct.min_entries - COALESCE(s.entry_count, 0) as entries_needed,
    s.newest_entry,
    s.oldest_entry,
    EXTRACT(DAY FROM NOW() - s.newest_entry) as days_since_update,
    CASE 
        WHEN COALESCE(s.entry_count, 0) = 0 THEN 'CRITICAL'
        WHEN COALESCE(s.entry_count, 0) < ct.min_entries THEN 'HIGH'
        WHEN s.newest_entry < NOW() - INTERVAL '60 days' THEN 'STALE'
        ELSE 'OK'
    END as gap_status
FROM category_targets ct
LEFT JOIN (
    SELECT 
        category, 
        COUNT(*) as entry_count,
        MAX(updated_at) as newest_entry,
        MIN(created_at) as oldest_entry
    FROM sops 
    GROUP BY category
) s ON ct.target_category = s.category
ORDER BY 
    CASE 
        WHEN COALESCE(s.entry_count, 0) = 0 THEN 1
        WHEN COALESCE(s.entry_count, 0) < ct.min_entries THEN 2
        WHEN s.newest_entry < NOW() - INTERVAL '60 days' THEN 3
        ELSE 4
    END,
    s.entry_count ASC NULLS FIRST;

-- View: Pattern coverage matrix
CREATE OR REPLACE VIEW v_pattern_coverage AS
WITH stacks AS (SELECT unnest(ARRAY['nextjs', 'sveltekit', 'astro']) as stack),
     layers AS (SELECT unnest(ARRAY['frontend', 'backend', 'database', 'infra']) as layer),
     components AS (SELECT unnest(ARRAY['auth', 'billing', 'api', 'seo', 'validation', 'caching', 'logging']) as component)
SELECT 
    s.stack,
    l.layer,
    c.component,
    CASE WHEN p.id IS NOT NULL THEN '✓' ELSE '✗' END as has_pattern,
    p.times_used,
    p.last_used
FROM stacks s
CROSS JOIN layers l
CROSS JOIN components c
LEFT JOIN patterns p ON p.stack = s.stack AND p.layer = l.layer AND p.component = c.component
ORDER BY s.stack, l.layer, c.component;

-- View: Research effectiveness summary
CREATE OR REPLACE VIEW v_search_strategy_effectiveness AS
SELECT 
    category,
    COUNT(*) as queries_run,
    AVG(usefulness_ratio) as avg_usefulness,
    AVG(effectiveness_score) as avg_effectiveness,
    SUM(entries_created) as total_entries_created,
    -- Best performing query template for this category
    (SELECT query_template 
     FROM search_effectiveness se2 
     WHERE se2.category = se.category 
     ORDER BY effectiveness_score DESC NULLS LAST 
     LIMIT 1) as best_query_template
FROM search_effectiveness se
GROUP BY category
ORDER BY avg_effectiveness DESC NULLS LAST;

-- View: Knowledge base health dashboard
CREATE OR REPLACE VIEW v_kb_health AS
SELECT 
    'SOPs' as table_name,
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embeddings,
    ROUND(COUNT(*) FILTER (WHERE embedding IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 1) as embedding_pct,
    COUNT(DISTINCT category) as categories_covered,
    MAX(updated_at) as last_updated,
    COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '60 days') as stale_entries
FROM sops
UNION ALL
SELECT 
    'Patterns',
    COUNT(*),
    COUNT(*) FILTER (WHERE embedding IS NOT NULL),
    ROUND(COUNT(*) FILTER (WHERE embedding IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 1),
    COUNT(DISTINCT stack || '/' || component),
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '60 days')
FROM patterns
UNION ALL
SELECT 
    'Mistakes',
    COUNT(*),
    COUNT(*) FILTER (WHERE embedding IS NOT NULL),
    ROUND(COUNT(*) FILTER (WHERE embedding IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 1),
    COUNT(DISTINCT error_signature),
    MAX(created_at),
    0  -- Mistakes don't go stale
FROM mistakes;

-- ============================================================
-- 6. FUNCTIONS FOR RESEARCH AUTOMATION
-- ============================================================

-- Function: Get recommended research priorities
CREATE OR REPLACE FUNCTION get_research_priorities(max_items INT DEFAULT 5)
RETURNS TABLE (
    priority_rank INT,
    gap_type TEXT,
    category TEXT,
    current_count INT,
    reason TEXT,
    suggested_query TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY 
            CASE gap_status 
                WHEN 'CRITICAL' THEN 1 
                WHEN 'HIGH' THEN 2 
                WHEN 'STALE' THEN 3 
                ELSE 4 
            END,
            current_entries ASC
        )::INT as priority_rank,
        gap_status as gap_type,
        v.category,
        current_entries::INT as current_count,
        CASE gap_status
            WHEN 'CRITICAL' THEN 'Zero entries - needs foundational research'
            WHEN 'HIGH' THEN 'Below minimum threshold'
            WHEN 'STALE' THEN 'Content is outdated (' || days_since_update::INT || ' days old)'
            ELSE 'Adequate coverage'
        END as reason,
        CASE gap_status
            WHEN 'CRITICAL' THEN v.category || ' best practices 2025 micro-saas serverless'
            WHEN 'HIGH' THEN v.category || ' advanced techniques NOT basic'
            WHEN 'STALE' THEN v.category || ' updates changes 2025'
            ELSE NULL
        END as suggested_query
    FROM v_category_gaps v
    WHERE gap_status != 'OK'
    LIMIT max_items;
END;
$$;

-- Function: Record research session
CREATE OR REPLACE FUNCTION start_research_session(
    p_focus_areas TEXT[],
    p_strategy TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO research_sessions (focus_areas, search_strategy, gaps_identified)
    SELECT 
        p_focus_areas,
        p_strategy,
        jsonb_agg(jsonb_build_object(
            'category', category,
            'gap_type', gap_type,
            'current_count', current_count
        ))
    FROM get_research_priorities(10)
    WHERE category = ANY(p_focus_areas) OR array_length(p_focus_areas, 1) IS NULL
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$;

-- Function: Complete research session
CREATE OR REPLACE FUNCTION complete_research_session(
    p_session_id UUID,
    p_queries_used TEXT[],
    p_entries_created INT,
    p_entries_updated INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE research_sessions
    SET 
        completed_at = NOW(),
        queries_used = p_queries_used,
        entries_created = p_entries_created,
        entries_updated = p_entries_updated
    WHERE id = p_session_id;
END;
$$;

-- ============================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sops_category_updated ON sops(category, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_stack_component ON patterns(stack, component);

-- ============================================================
-- USAGE EXAMPLES
-- ============================================================

-- Get top research priorities:
-- SELECT * FROM get_research_priorities(5);

-- Check knowledge health:
-- SELECT * FROM v_kb_health;

-- See category gaps:
-- SELECT * FROM v_category_gaps WHERE gap_status != 'OK';

-- Start a research session:
-- SELECT start_research_session(ARRAY['security', 'billing'], 'foundational');

-- Complete a research session:
-- SELECT complete_research_session('session-uuid', ARRAY['query1', 'query2'], 3, 1);
