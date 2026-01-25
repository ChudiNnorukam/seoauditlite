-- ============================================================
-- FAILURE-PATTERN-DRIVEN KNOWLEDGE BASE
-- Track real failures, not generic categories
-- ============================================================

-- 1. CANONICAL STACK DEFINITION
CREATE TABLE IF NOT EXISTS canonical_stack (
    component TEXT PRIMARY KEY,
    technology TEXT NOT NULL,
    version_constraint TEXT,
    rationale TEXT,
    alternatives_rejected JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert canonical stack
INSERT INTO canonical_stack (component, technology, version_constraint, rationale, alternatives_rejected) VALUES
('framework', 'Next.js App Router', '>=14.0.0', 'RSC support, server actions, best Vercel integration', '["Pages Router", "Remix", "SvelteKit"]'),
('database', 'Supabase', 'latest', 'Postgres + Auth + RLS + Realtime in one service', '["PlanetScale", "Neon", "raw Postgres"]'),
('payments', 'Stripe', 'latest', 'Industry standard, best webhooks, Customer Portal', '["LemonSqueezy", "Paddle"]'),
('ui', 'Shadcn/ui + Tailwind', 'latest', 'Copy-paste components, full control, accessible', '["MUI", "Chakra", "DaisyUI"]'),
('deployment', 'Vercel', 'latest', 'Zero-config Next.js, edge functions, previews', '["Netlify", "Railway", "fly.io"]'),
('email-transactional', 'Resend', 'latest', 'Developer-friendly, React Email support', '["SendGrid", "Postmark"]'),
('auth', 'Supabase Auth', 'latest', 'Integrated with DB, RLS-native', '["NextAuth", "Clerk", "Auth0"]')
ON CONFLICT (component) DO NOTHING;

-- 2. FAILURE PATTERNS TABLE
CREATE TABLE IF NOT EXISTS microsaas_failure_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Classification
    stack_component TEXT NOT NULL REFERENCES canonical_stack(component),
    failure_category TEXT NOT NULL, -- 'auth', 'db', 'payments', 'deployment', 'ui', 'api'

    -- Problem description
    failure_symptom TEXT NOT NULL,  -- What the user sees/experiences
    error_message TEXT,             -- Exact error if applicable
    reproduction_steps TEXT[],      -- How to trigger the failure

    -- Root cause analysis
    root_cause TEXT NOT NULL,       -- Why it fails
    stack_interaction TEXT,         -- Which parts of stack interact to cause this

    -- Solution
    fix_pattern TEXT NOT NULL,      -- Exact code/config that resolves it
    verification_steps TEXT[],      -- How to confirm it's fixed

    -- Learning metrics
    tokens_wasted_estimate INT,     -- Estimated token cost before discovery
    shots_before_fix INT,           -- How many attempts it took
    frequency TEXT DEFAULT 'rare',  -- 'common', 'occasional', 'rare'

    -- Context
    discovered_in_project TEXT,     -- Which project surfaced this
    tags TEXT[],                    -- Searchable tags

    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_encountered TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_failure_component ON microsaas_failure_patterns(stack_component);
CREATE INDEX idx_failure_category ON microsaas_failure_patterns(failure_category);
CREATE INDEX idx_failure_frequency ON microsaas_failure_patterns(frequency);
CREATE INDEX idx_failure_tags ON microsaas_failure_patterns USING GIN(tags);

-- 3. STACK-SPECIFIC SCAFFOLDS
CREATE TABLE IF NOT EXISTS stack_scaffolds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    scaffold_type TEXT NOT NULL, -- 'full-app', 'feature-module', 'integration'
    name TEXT NOT NULL,
    description TEXT,

    -- What's included
    includes_components TEXT[], -- Which canonical_stack components
    file_structure JSONB,       -- Directory tree

    -- Customization points
    customization_points JSONB, -- What needs to be changed per-project
    env_vars_required TEXT[],

    -- Code/config
    repo_url TEXT,              -- GitHub template repo
    setup_commands TEXT[],      -- How to initialize

    -- Quality metrics
    tested BOOLEAN DEFAULT false,
    last_tested TIMESTAMPTZ,
    known_issues TEXT[],

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DECISION TREES
CREATE TABLE IF NOT EXISTS stack_decision_trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    decision_point TEXT NOT NULL,  -- e.g., "When to use Server Actions vs API Routes"
    context TEXT,                  -- When this decision comes up

    -- Options
    options JSONB NOT NULL,        -- Array of {choice, when_to_use, tradeoffs, code_example}

    -- Recommendation
    default_choice TEXT,
    reasoning TEXT,

    stack_components TEXT[],       -- Which parts of canonical stack this applies to

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMMON FAILURE PATTERNS (Seed Data)
INSERT INTO microsaas_failure_patterns (
    stack_component,
    failure_category,
    failure_symptom,
    error_message,
    reproduction_steps,
    root_cause,
    stack_interaction,
    fix_pattern,
    verification_steps,
    shots_before_fix,
    frequency,
    tags
) VALUES

-- Failure 1: Supabase RLS blocking authenticated API calls
(
    'database',
    'auth',
    'API returns 401 or empty results despite user being logged in',
    'new row violates row-level security policy',
    ARRAY[
        'User logs in via Supabase Auth',
        'Frontend makes API call with auth token',
        'Database query returns empty or fails with 401'
    ],
    'RLS policy doesn''t check auth.uid() or uses wrong JWT verification',
    'Supabase Auth JWT → API Route → Supabase Client → RLS Policy',
    E'-- In Supabase SQL Editor, create policy:\nCREATE POLICY "Users can read own data"\nON table_name\nFOR SELECT\nUSING (auth.uid() = user_id);\n\n-- In API route, use service role for admin operations:\nimport { createClient } from ''@supabase/supabase-js'';\n\nconst supabase = createClient(\n  process.env.NEXT_PUBLIC_SUPABASE_URL!,\n  process.env.SUPABASE_SERVICE_ROLE_KEY! // NOT anon key\n);',
    ARRAY[
        'Check RLS policy in Supabase dashboard',
        'Verify auth.uid() returns expected user ID in SQL query',
        'Test API call with valid auth token',
        'Confirm data returns without 401 error'
    ],
    3,
    'common',
    ARRAY['supabase', 'rls', 'auth', 'api']
),

-- Failure 2: Stripe webhook signature verification failing locally
(
    'payments',
    'api',
    'Stripe webhook returns 400 "No signatures found matching the expected signature"',
    'Error: No signatures found matching the expected signature for payload',
    ARRAY[
        'Set up Stripe webhook endpoint',
        'Use Stripe CLI to forward events locally',
        'Webhook handler fails signature verification'
    ],
    'Using wrong webhook secret or not reading raw body correctly',
    'Stripe CLI → ngrok/localhost → Next.js API Route → stripe.webhooks.constructEvent()',
    E'// In next.config.js, disable body parsing for webhook route:\nexport const config = {\n  api: {\n    bodyParser: false,\n  },\n};\n\n// In API route:\nimport { buffer } from ''micro'';\nimport Stripe from ''stripe'';\n\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\n\nexport async function POST(req: Request) {\n  const buf = await req.arrayBuffer();\n  const rawBody = Buffer.from(buf);\n  const sig = req.headers.get(''stripe-signature'')!;\n\n  let event;\n  try {\n    // Use WEBHOOK secret (starts with whsec_), NOT API key\n    event = stripe.webhooks.constructEvent(\n      rawBody,\n      sig,\n      process.env.STRIPE_WEBHOOK_SECRET!\n    );\n  } catch (err) {\n    return new Response(`Webhook Error: ${err.message}`, { status: 400 });\n  }\n\n  // Handle event\n  switch (event.type) {\n    case ''checkout.session.completed'':\n      // Process payment\n      break;\n  }\n\n  return new Response(JSON.stringify({ received: true }), { status: 200 });\n}',
    ARRAY[
        'Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe',
        'Copy webhook signing secret (whsec_xxx) to .env as STRIPE_WEBHOOK_SECRET',
        'Trigger test event: stripe trigger checkout.session.completed',
        'Confirm webhook handler logs successful verification'
    ],
    4,
    'common',
    ARRAY['stripe', 'webhooks', 'signature', 'nextjs', 'api']
),

-- Failure 3: Next.js middleware infinite redirect loop
(
    'framework',
    'auth',
    'Page keeps redirecting infinitely between login and dashboard',
    'ERR_TOO_MANY_REDIRECTS',
    ARRAY[
        'Set up middleware.ts to check auth',
        'Redirect unauthenticated users to /login',
        'Browser shows infinite redirect error'
    ],
    'Middleware redirects /login to /dashboard, which redirects back to /login',
    'Next.js Middleware → Supabase Auth check → redirect logic',
    E'// middleware.ts\nimport { createMiddlewareClient } from ''@supabase/auth-helpers-nextjs'';\nimport { NextResponse } from ''next/server'';\n\nexport async function middleware(req) {\n  const res = NextResponse.next();\n  const supabase = createMiddlewareClient({ req, res });\n  const { data: { session } } = await supabase.auth.getSession();\n\n  const isAuthPage = req.nextUrl.pathname.startsWith(''/login'');\n  const isProtectedPage = req.nextUrl.pathname.startsWith(''/dashboard'');\n\n  // Redirect logic with loop prevention\n  if (!session && isProtectedPage) {\n    return NextResponse.redirect(new URL(''/login'', req.url));\n  }\n\n  if (session && isAuthPage) {\n    return NextResponse.redirect(new URL(''/dashboard'', req.url));\n  }\n\n  return res;\n}\n\nexport const config = {\n  matcher: [''/dashboard/:path*'', ''/login''],\n};',
    ARRAY[
        'Clear browser cookies and cache',
        'Navigate to /login (should load without redirect)',
        'Log in and verify redirect to /dashboard',
        'Check browser network tab for redirect loop (status 307)'
    ],
    5,
    'common',
    ARRAY['nextjs', 'middleware', 'auth', 'redirect', 'supabase']
),

-- Failure 4: Shadcn component hydration mismatch in SSR
(
    'ui',
    'ui',
    'Warning: Text content did not match. Server rendered X but client rendered Y',
    'Hydration failed because the initial UI does not match what was rendered on the server',
    ARRAY[
        'Use Shadcn Dialog or Popover component',
        'Component renders on server with SSR',
        'Client hydration fails with mismatch warning'
    ],
    'Radix UI Popper uses useLayoutEffect which runs differently on server vs client',
    'Next.js SSR → Radix UI Primitives → React Hydration',
    E'// Use dynamic import with ssr: false for Radix-based components\nimport dynamic from ''next/dynamic'';\n\nconst Dialog = dynamic(\n  () => import(''@/components/ui/dialog'').then(mod => mod.Dialog),\n  { ssr: false }\n);\n\n// Or wrap in ClientOnly component:\n// components/client-only.tsx\nimport { useEffect, useState } from ''react'';\n\nexport function ClientOnly({ children }) {\n  const [hasMounted, setHasMounted] = useState(false);\n\n  useEffect(() => {\n    setHasMounted(true);\n  }, []);\n\n  if (!hasMounted) return null;\n  return <>{children}</>;\n}\n\n// Usage:\n<ClientOnly>\n  <Dialog>...</Dialog>\n</ClientOnly>',
    ARRAY[
        'Check browser console for hydration warnings',
        'Verify component renders correctly without warnings',
        'Test in both dev and production builds',
        'Confirm no SSR/client content mismatch'
    ],
    3,
    'occasional',
    ARRAY['shadcn', 'radix', 'ssr', 'hydration', 'nextjs']
),

-- Failure 5: Vercel cold start breaking edge middleware auth
(
    'deployment',
    'auth',
    'First request after deploy returns 401, subsequent requests work fine',
    'null',
    ARRAY[
        'Deploy Next.js app to Vercel with edge middleware',
        'First request to protected route fails auth',
        'Refresh page and auth works'
    ],
    'Edge middleware cold start doesn''t initialize Supabase client properly',
    'Vercel Edge Runtime → Supabase Auth Helpers → Session check',
    E'// Use edge-compatible auth check with proper initialization\nimport { createServerClient } from ''@supabase/ssr'';\nimport { NextResponse } from ''next/server'';\n\nexport async function middleware(request) {\n  let response = NextResponse.next({\n    request: {\n      headers: request.headers,\n    },\n  });\n\n  const supabase = createServerClient(\n    process.env.NEXT_PUBLIC_SUPABASE_URL!,\n    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\n    {\n      cookies: {\n        get(name) {\n          return request.cookies.get(name)?.value;\n        },\n        set(name, value, options) {\n          request.cookies.set({ name, value, ...options });\n          response = NextResponse.next({\n            request: { headers: request.headers },\n          });\n          response.cookies.set({ name, value, ...options });\n        },\n        remove(name, options) {\n          request.cookies.set({ name, value: '''', ...options });\n          response = NextResponse.next({\n            request: { headers: request.headers },\n          });\n          response.cookies.set({ name, value: '''', ...options });\n        },\n      },\n    }\n  );\n\n  const { data: { user } } = await supabase.auth.getUser();\n\n  if (!user && request.nextUrl.pathname.startsWith(''/dashboard'')) {\n    return NextResponse.redirect(new URL(''/login'', request.url));\n  }\n\n  return response;\n}\n\nexport const config = {\n  matcher: [''/dashboard/:path*''],\n};',
    ARRAY[
        'Deploy to Vercel',
        'Wait 5 minutes for cold start',
        'Test protected route in incognito window',
        'Verify first request authenticates correctly'
    ],
    4,
    'occasional',
    ARRAY['vercel', 'edge', 'middleware', 'cold-start', 'supabase', 'auth']
);

-- 6. VIEWS FOR FAILURE ANALYSIS

-- View: Most common failures
CREATE OR REPLACE VIEW v_common_failures AS
SELECT
    stack_component,
    failure_category,
    failure_symptom,
    frequency,
    shots_before_fix,
    tokens_wasted_estimate,
    last_encountered
FROM microsaas_failure_patterns
WHERE frequency IN ('common', 'occasional')
ORDER BY
    CASE frequency
        WHEN 'common' THEN 1
        WHEN 'occasional' THEN 2
        ELSE 3
    END,
    shots_before_fix DESC;

-- View: Failures by stack component
CREATE OR REPLACE VIEW v_failures_by_component AS
SELECT
    stack_component,
    COUNT(*) as failure_count,
    AVG(shots_before_fix) as avg_shots_to_fix,
    SUM(tokens_wasted_estimate) as total_tokens_wasted,
    MAX(last_encountered) as most_recent_failure
FROM microsaas_failure_patterns
GROUP BY stack_component
ORDER BY failure_count DESC;

-- 7. FUNCTIONS

-- Function: Log new failure pattern
CREATE OR REPLACE FUNCTION log_failure_pattern(
    p_stack_component TEXT,
    p_failure_category TEXT,
    p_symptom TEXT,
    p_root_cause TEXT,
    p_fix_pattern TEXT,
    p_shots_before_fix INT DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    failure_id UUID;
BEGIN
    INSERT INTO microsaas_failure_patterns (
        stack_component,
        failure_category,
        failure_symptom,
        root_cause,
        fix_pattern,
        shots_before_fix,
        frequency
    ) VALUES (
        p_stack_component,
        p_failure_category,
        p_symptom,
        p_root_cause,
        p_fix_pattern,
        p_shots_before_fix,
        CASE
            WHEN p_shots_before_fix >= 4 THEN 'common'
            WHEN p_shots_before_fix >= 2 THEN 'occasional'
            ELSE 'rare'
        END
    )
    RETURNING id INTO failure_id;

    RETURN failure_id;
END;
$$;

-- Function: Get relevant failures for current issue
CREATE OR REPLACE FUNCTION get_relevant_failures(
    p_search_terms TEXT[],
    p_stack_component TEXT DEFAULT NULL,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    failure_symptom TEXT,
    root_cause TEXT,
    fix_pattern TEXT,
    relevance_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.failure_symptom,
        f.root_cause,
        f.fix_pattern,
        -- Simple relevance scoring
        (
            CASE WHEN f.tags && p_search_terms THEN 2.0 ELSE 0.0 END +
            CASE WHEN f.frequency = 'common' THEN 1.5
                 WHEN f.frequency = 'occasional' THEN 1.0
                 ELSE 0.5 END
        ) as relevance_score
    FROM microsaas_failure_patterns f
    WHERE
        (p_stack_component IS NULL OR f.stack_component = p_stack_component)
        AND (
            f.tags && p_search_terms
            OR f.failure_symptom ILIKE ANY(SELECT '%' || term || '%' FROM unnest(p_search_terms) AS term)
            OR f.error_message ILIKE ANY(SELECT '%' || term || '%' FROM unnest(p_search_terms) AS term)
        )
    ORDER BY relevance_score DESC, f.frequency, f.shots_before_fix DESC
    LIMIT p_limit;
END;
$$;

-- ============================================================
-- USAGE EXAMPLES
-- ============================================================

-- View canonical stack:
-- SELECT * FROM canonical_stack;

-- Check common failures:
-- SELECT * FROM v_common_failures;

-- Log a new failure:
-- SELECT log_failure_pattern(
--     'database',
--     'auth',
--     'Users can see other users data',
--     'Missing RLS policy on new table',
--     'ALTER TABLE ... ENABLE ROW LEVEL SECURITY; CREATE POLICY ...',
--     3
-- );

-- Search for failures:
-- SELECT * FROM get_relevant_failures(
--     ARRAY['auth', 'rls', '401'],
--     'database',
--     5
-- );
