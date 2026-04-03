/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/anthropic.ts
 *
 * Official Anthropic SDK wrapper.
 * Provides non-streaming and SSE-streaming calls to Claude models.
 * Falls back gracefully when ANTHROPIC_API_KEY is not set.
 *
 * Models:
 *   claude-opus-4-5      — most intelligent, best for complex strategy
 *   claude-sonnet-4-5    — best speed/quality balance (default)
 *   claude-haiku-4-5     — fastest, for hooks / quick tasks
 */

import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODELS = {
  opus:   "claude-opus-4-5",
  sonnet: "claude-sonnet-4-5",
  haiku:  "claude-haiku-4-5-20251001",
} as const;

export type ClaudeModel = keyof typeof CLAUDE_MODELS;

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  if (!key) return null;
  if (!_client) _client = new Anthropic({ apiKey: key });
  return _client;
}

// ── Smart model router ─────────────────────────────────────────────────────────
export function routeClaudeModel(hint: ClaudeModel, promptLen: number): ClaudeModel {
  if (hint !== "sonnet") return hint;
  if (promptLen > 6000) return "opus";     // large context → best model
  if (promptLen > 1500) return "sonnet";   // medium → balanced
  return "haiku";                          // short → fast
}

// ── Non-streaming call ─────────────────────────────────────────────────────────
export async function callClaude(
  system: string,
  prompt: string,
  maxTokens = 4096,
  model: ClaudeModel = "sonnet",
  temperature = 0.8,
): Promise<string> {
  const client = getClient();
  if (!client) return "⚠️ ANTHROPIC_API_KEY не задан.";

  const resolved = routeClaudeModel(model, (system + prompt).length);

  try {
    const msg = await client.messages.create({
      model:      CLAUDE_MODELS[resolved],
      max_tokens: maxTokens,
      system,
      messages:   [{ role: "user", content: prompt }],
      temperature,
    });

    const block = msg.content[0];
    return block.type === "text" ? block.text : "Нет ответа от Claude.";
  } catch (e: any) {
    if (e.status === 429) return "⚠️ Лимит Claude API. Попробуй через минуту.";
    return `⚠️ Claude error: ${e.message ?? String(e)}`;
  }
}

// ── Streaming call — returns ReadableStream of SSE chunks ─────────────────────
// Each chunk: { type: "delta", text: string } | { type: "done" } | { type: "error", message }
export async function callClaudeStream(
  system: string,
  prompt: string,
  maxTokens = 4096,
  model: ClaudeModel = "sonnet",
  temperature = 0.8,
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  function sseChunk(data: object): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  }

  const client = getClient();
  if (!client) {
    return new ReadableStream({
      start(c) {
        c.enqueue(sseChunk({ type: "error", message: "ANTHROPIC_API_KEY не задан." }));
        c.close();
      },
    });
  }

  const resolved = routeClaudeModel(model, (system + prompt).length);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const stream = await client.messages.create({
          model:      CLAUDE_MODELS[resolved],
          max_tokens: maxTokens,
          system,
          messages:   [{ role: "user", content: prompt }],
          temperature,
          stream:     true,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(sseChunk({ type: "delta", text: event.delta.text }));
          }
        }

        controller.enqueue(sseChunk({ type: "done" }));
      } catch (e: any) {
        controller.enqueue(sseChunk({ type: "error", message: e.message ?? String(e) }));
      } finally {
        controller.close();
      }
    },
  });
}

// ── Token count estimate (no API call) ────────────────────────────────────────
// Approximate: ~4 chars per token for Russian/English mixed text
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ── Provider availability check ───────────────────────────────────────────────
export function isClaudeAvailable(): boolean {
  return !!(process.env.ANTHROPIC_API_KEY);
}
