/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/useStream.ts
 *
 * React hook for consuming SSE streaming endpoints.
 * Works with any endpoint that emits:
 *   data: { type: "delta", text: "..." }
 *   data: { type: "done" }
 *   data: { type: "error", message: "..." }
 */
"use client";

import { useCallback, useRef, useState } from "react";

export interface StreamState {
  text:      string;
  loading:   boolean;
  error:     string;
}

export interface StreamOptions {
  /** POST body (JSON) or GET url (string) */
  url:     string;
  method?: "POST" | "GET";
  body?:   Record<string, unknown>;
  /** Called on each text delta — useful for scroll-to-bottom */
  onDelta?: (chunk: string) => void;
  /** Called when stream completes */
  onDone?:  (fullText: string) => void;
}

export function useStream() {
  const [state, setState] = useState<StreamState>({ text: "", loading: false, error: "" });
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (opts: StreamOptions) => {
    // Cancel previous stream if running
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ text: "", loading: true, error: "" });

    try {
      const fetchOpts: RequestInit = {
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
      };

      if ((opts.method ?? "POST") === "POST") {
        fetchOpts.method = "POST";
        fetchOpts.body   = JSON.stringify(opts.body ?? {});
      }

      const res = await fetch(opts.url, fetchOpts);
      if (!res.ok || !res.body) {
        setState({ text: "", loading: false, error: `HTTP ${res.status}` });
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buf  = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const msg = JSON.parse(line.slice(6));
            if (msg.type === "delta" && msg.text) {
              full += msg.text;
              opts.onDelta?.(msg.text);
              setState((prev) => ({ ...prev, text: full }));
            } else if (msg.type === "done") {
              opts.onDone?.(full);
              setState({ text: full, loading: false, error: "" });
              return;
            } else if (msg.type === "error") {
              setState({ text: full, loading: false, error: msg.message ?? "Ошибка" });
              return;
            }
          } catch { /* skip */ }
        }
      }

      setState((prev) => ({ ...prev, loading: false }));
      opts.onDone?.(full);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setState((prev) => ({ ...prev, loading: false }));
      } else {
        setState((prev) => ({ ...prev, loading: false, error: e.message }));
      }
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ text: "", loading: false, error: "" });
  }, []);

  return { ...state, start, stop, reset };
}
