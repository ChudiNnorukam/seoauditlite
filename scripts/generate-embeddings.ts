#!/usr/bin/env bun
/**
 * MicroSaaSBot Embedding Pipeline
 * Generates embeddings for knowledge base records using Ollama
 *
 * Usage:
 *   bun run scripts/generate-embeddings.ts
 *
 * Prerequisites:
 *   - Ollama running locally: ollama serve
 *   - Embedding model pulled: ollama pull nomic-embed-text
 *   - Supabase credentials in .env
 */

import { createClient } from "@supabase/supabase-js";

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "nomic-embed-text";
const BATCH_SIZE = 10;

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment");
  console.log("\nAdd to your .env:");
  console.log("SUPABASE_URL=https://your-project.supabase.co");
  console.log("SUPABASE_SERVICE_KEY=your-service-role-key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate embedding using Ollama
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.embedding;
}

/**
 * Check if Ollama is running and model is available
 */
async function checkOllama(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) return false;

    const data = await response.json();
    const models = data.models?.map((m: { name: string }) => m.name) || [];

    if (!models.some((m: string) => m.includes(EMBEDDING_MODEL.split(":")[0]))) {
      console.log(`Model ${EMBEDDING_MODEL} not found. Pulling...`);
      const pullResponse = await fetch(`${OLLAMA_URL}/api/pull`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: EMBEDDING_MODEL }),
      });
      if (!pullResponse.ok) {
        console.error("Failed to pull model. Run: ollama pull", EMBEDDING_MODEL);
        return false;
      }
    }

    return true;
  } catch {
    console.error("Ollama not running. Start with: ollama serve");
    return false;
  }
}

/**
 * Process records from a table
 */
async function processTable(
  tableName: string,
  textColumns: string[],
  idColumn: string = "id"
): Promise<number> {
  console.log(`\nProcessing ${tableName}...`);

  // Fetch records without embeddings
  const { data: records, error } = await supabase
    .from(tableName)
    .select(`${idColumn}, ${textColumns.join(", ")}`)
    .is("embedding", null);

  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    return 0;
  }

  if (!records || records.length === 0) {
    console.log(`  No records need embeddings`);
    return 0;
  }

  console.log(`  Found ${records.length} records to process`);
  let processed = 0;

  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    for (const record of batch) {
      try {
        // Combine text columns for embedding
        const text = textColumns
          .map((col) => record[col])
          .filter(Boolean)
          .join(" | ");

        if (!text) {
          console.log(`  Skipping ${record[idColumn]}: no text content`);
          continue;
        }

        const embedding = await getEmbedding(text);

        // Update record with embedding
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ embedding })
          .eq(idColumn, record[idColumn]);

        if (updateError) {
          console.error(`  Error updating ${record[idColumn]}:`, updateError.message);
        } else {
          processed++;
          process.stdout.write(`\r  Processed: ${processed}/${records.length}`);
        }
      } catch (err) {
        console.error(`  Error processing ${record[idColumn]}:`, err);
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < records.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`\n  Completed: ${processed} embeddings generated`);
  return processed;
}

/**
 * Main execution
 */
async function main() {
  console.log("🧠 MicroSaaSBot Embedding Pipeline");
  console.log("==================================\n");

  // Check Ollama
  console.log("Checking Ollama...");
  if (!(await checkOllama())) {
    process.exit(1);
  }
  console.log(`✓ Ollama ready with model: ${EMBEDDING_MODEL}`);

  // Process each table
  const results = {
    sops: await processTable("sops", ["title", "content"]),
    mistakes: await processTable("mistakes", ["error_signature", "root_cause", "fix_applied"]),
    patterns: await processTable("patterns", ["pattern_name", "implementation", "gotchas"]),
    decisions: await processTable("decisions", ["title", "context", "decision_made", "rationale"]),
  };

  // Summary
  console.log("\n==================================");
  console.log("Summary:");
  console.log(`  SOPs: ${results.sops} embeddings`);
  console.log(`  Mistakes: ${results.mistakes} embeddings`);
  console.log(`  Patterns: ${results.patterns} embeddings`);
  console.log(`  Decisions: ${results.decisions} embeddings`);
  console.log(
    `  Total: ${Object.values(results).reduce((a, b) => a + b, 0)} embeddings generated`
  );
  console.log("==================================\n");
}

main().catch(console.error);
