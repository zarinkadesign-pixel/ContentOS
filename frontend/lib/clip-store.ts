/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/clip-store.ts
 *
 * In-memory job store with JSON file persistence.
 * Lives in the Node.js process — safe for local dev / single-instance.
 */
import fs   from "fs";
import path from "path";

/* ── types ──────────────────────────────────────────────────────── */
export type JobStatus =
  | "pending"
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "cutting"
  | "completed"
  | "failed";

export interface TranscriptSegment {
  start: number;
  end:   number;
  text:  string;
}

export interface OwnClip {
  id:             string;
  title:          string;
  start_time:     number;
  end_time:       number;
  duration:       number;
  virality_score: number;
  hook:           string;
  transcript:     string;
  file_path:      string;        // abs path (or "" if analysis-only)
  download_url:   string;        // public URL (or "" if analysis-only)
  thumbnail_url:  string;
}

export interface ClipJob {
  id:           string;
  status:       JobStatus;
  progress:     number;          // 0–100
  video_url:    string;
  language:     string;
  clip_length:  string;          // "0-30" | "30-90" | "90-180"
  aspect_ratio: string;
  mode:         "full" | "analysis_only";
  created_at:   string;
  updated_at:   string;
  error?:       string;
  video_path?:  string;
  transcript?:  TranscriptSegment[];
  clips?:       OwnClip[];
}

/* ── persistence ─────────────────────────────────────────────────── */
const STORE_FILE = path.join(process.cwd(), ".tmp", "clip-jobs.json");

function ensureDir() {
  const dir = path.dirname(STORE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(): Map<string, ClipJob> {
  ensureDir();
  if (!fs.existsSync(STORE_FILE)) return new Map();
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const arr: ClipJob[] = JSON.parse(raw);
    return new Map(arr.map(j => [j.id, j]));
  } catch {
    return new Map();
  }
}

function save(store: Map<string, ClipJob>) {
  ensureDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify([...store.values()], null, 2));
}

/* ── global in-process store ─────────────────────────────────────── */
const _store: Map<string, ClipJob> = load();

export function createJob(params: Pick<ClipJob, "video_url" | "language" | "clip_length" | "aspect_ratio">): ClipJob {
  const id  = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();
  const job: ClipJob = {
    ...params,
    id,
    status:     "pending",
    progress:   0,
    mode:       "analysis_only",
    created_at: now,
    updated_at: now,
  };
  _store.set(id, job);
  save(_store);
  return job;
}

export function updateJob(id: string, patch: Partial<ClipJob>) {
  const job = _store.get(id);
  if (!job) return;
  const updated = { ...job, ...patch, updated_at: new Date().toISOString() };
  _store.set(id, updated);
  save(_store);
}

export function getJob(id: string): ClipJob | undefined {
  return _store.get(id);
}

export function listJobs(): ClipJob[] {
  return [..._store.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
