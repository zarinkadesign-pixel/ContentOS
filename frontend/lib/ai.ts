/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/ai.ts
 *
 * Universal AI provider router.
 * Automatically selects the best available provider per task type.
 *
 * Priority:
 *   - Claude (Anthropic) — for complex strategy, long analysis, multi-step reasoning
 *   - Groq               — for fast generation, hooks, scripts, content plans
 *
 * Usage:
 *   import { ai, aiStream } from "@/lib/ai"
 *   const text = await ai(system, prompt, { task: "strategy" })
 */

import { callClaude, callClaudeStream, isClaudeAvailable } from "./anthropic";
import { callGemini, callGeminiStream }                    from "./gemini";

export type AiTask =
  | "strategy"      // → Claude Opus (deep analysis)
  | "content"       // → Groq fast (posts, scripts)
  | "ads"           // → Claude Sonnet (persuasive copy)
  | "analysis"      // → Claude Sonnet (data interpretation)
  | "funnel"        // → Claude Sonnet (conversion logic)
  | "hook"          // → Groq fast (short, punchy)
  | "default";      // → smart routing

export interface AiOptions {
  task?:        AiTask;
  maxTokens?:   number;
  temperature?: number;
  /** Force a specific provider regardless of routing */
  provider?:    "claude" | "groq" | "auto";
}

// ── Routing table ──────────────────────────────────────────────────────────────
const CLAUDE_TASKS = new Set<AiTask>(["strategy", "ads", "analysis", "funnel"]);
const GROQ_TASKS   = new Set<AiTask>(["content", "hook"]);

function shouldUseClaude(task: AiTask, provider: "claude" | "groq" | "auto"): boolean {
  if (provider === "claude") return true;
  if (provider === "groq")   return false;
  // Auto: use Claude for complex tasks if available
  return isClaudeAvailable() && (CLAUDE_TASKS.has(task) || task === "default");
}

// ── Non-streaming call ─────────────────────────────────────────────────────────
export async function ai(
  system: string,
  prompt: string,
  opts: AiOptions = {},
): Promise<string> {
  const {
    task        = "default",
    maxTokens   = 4096,
    temperature = 0.8,
    provider    = "auto",
  } = opts;

  if (shouldUseClaude(task, provider)) {
    const model = task === "strategy" ? "opus" : "sonnet";
    return callClaude(system, prompt, maxTokens, model, temperature);
  }

  // Groq — pick model based on task
  const groqModel = task === "hook" ? "fast" : "default";
  return callGemini(system, prompt, maxTokens, groqModel, temperature);
}

// ── Streaming call ─────────────────────────────────────────────────────────────
export async function aiStream(
  system: string,
  prompt: string,
  opts: AiOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const {
    task        = "default",
    maxTokens   = 4096,
    temperature = 0.8,
    provider    = "auto",
  } = opts;

  if (shouldUseClaude(task, provider)) {
    const model = task === "strategy" ? "opus" : "sonnet";
    return callClaudeStream(system, prompt, maxTokens, model, temperature);
  }

  const groqModel = task === "hook" ? "fast" : "default";
  return callGeminiStream(system, prompt, maxTokens, groqModel, temperature);
}

// ── Provider info (for UI display) ────────────────────────────────────────────
export function getProviderInfo(): {
  claude: boolean;
  groq:   boolean;
  default: "claude" | "groq";
} {
  const claude = isClaudeAvailable();
  const groq   = !!(process.env.GROQ_KEY ?? process.env.GROQ_API_KEY);
  return {
    claude,
    groq,
    default: claude ? "claude" : "groq",
  };
}
