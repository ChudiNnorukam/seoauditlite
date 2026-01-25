# Supabase Knowledge Base for MicroSaaSBot: Claude Code CLI Integration

> **Purpose**: Free all-in-one cloud backend for reflexive learning where Claude Code CLI (Max plan) serves as the intelligent agent—no Anthropic SDK required.

---

## Executive Summary

**Recommendation**: Supabase Free Tier

| Feature | Free Tier Allocation |
|---------|---------------------|
| PostgreSQL | 500MB database |
| pgvector | Built-in (no setup) |
| Edge Functions | 500K invocations/month |
| Auth | 50K monthly active users |
| Storage | 1GB file storage |
| Realtime | Included |
| **Monthly Cost** | $0 |

**Why this works**: Claude Code CLI handles all reasoning locally via your Max subscription. Supabase provides persistent storage, semantic search via pgvector, and serverless functions—all free.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Your Local Machine                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Claude Code CLI (Max Plan)                  │  │
│  │                                                       │  │
│  │  • Reads SOPs from Supabase                          │  │
│  │  • Queries similar past mistakes (semantic search)   │  │
│  │  • Generates fixes using local reasoning             │  │
│  │  • Writes learnings back to database                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                        │                                     │
│                        ▼                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Supabase MCP Server (Official)                │  │
│  │         https://mcp.supabase.com                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase Cloud (Free Tier)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐          │
│  │ PostgreSQL  │  │  pgvector   │  │  Storage   │          │
│  │  SOPs       │  │  Embeddings │  │  Files     │          │
│  │  Mistakes   │  │  Similarity │  │  Artifacts │          │
│  │  Patterns   │  │  Search     │  │            │          │
│  └─────────────┘  └─────────────┘  └────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → Sign up / Log in
2. Click "New Project"
3. Select organization and region (choose closest to you)
4. Note your **Project ID** (visible in Settings → General)

### Step 2: Enable pgvector Extension

Run in Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Step 3: Run Schema

Execute the schema from `supabase/schema.sql` in this project.

### Step 4: Configure MCP Server

```bash
claude mcp add supabase \
  --url "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_ID"
```

### Step 5: Seed Initial Data

Run the seed file from `supabase/seed.sql` after creating the project.

### Step 6: Set Up Embedding Pipeline

Use the embedding script at `scripts/generate-embeddings.ts` with Ollama.

---

## File Structure

```
supabase/
├── schema.sql          # Database schema with pgvector
├── seed.sql            # Initial micro-saas knowledge
└── functions/          # Edge functions (optional)

scripts/
└── generate-embeddings.ts  # Ollama embedding pipeline
```

---

## Validation Checklist

- [ ] Supabase project created
- [ ] pgvector extension enabled
- [ ] Schema applied
- [ ] MCP server connected (`claude mcp list`)
- [ ] Ollama running (`ollama list`)
- [ ] Seed data loaded
- [ ] Test query works

---

## Related Documentation

- [Supabase MCP Official Docs](https://supabase.com/docs/guides/getting-started/mcp)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Ollama Models](https://ollama.com/library)
