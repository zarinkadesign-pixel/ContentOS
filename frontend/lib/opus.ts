// ── Opus Clip (clip.opus.pro) API client ──────────────────────────────────────
// Docs: https://www.opus.pro/api
// Replace VIZARD_KEY → OPUS_KEY in your .env

const BASE = "https://api.opus.pro/v1";

function headers() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${process.env.OPUS_KEY ?? ""}`,
  };
}

// ── 1. Submit video URL for AI clipping ──────────────────────────────────────
export async function createOpusProject(
  videoUrl:   string,
  language  = "ru",
  clipLength = "30-90",   // "0-30" | "30-90" | "90-180" seconds
  aspectRatio = "9:16"    // "9:16" | "1:1" | "16:9"
) {
  if (!process.env.OPUS_KEY) return { error: "OPUS_KEY не задан в .env" };
  try {
    const res = await fetch(`${BASE}/clips`, {
      method:  "POST",
      headers: headers(),
      body: JSON.stringify({
        url:          videoUrl,
        language,
        clip_length:  clipLength,
        aspect_ratio: aspectRatio,
        caption:      true,    // авто-субтитры
        emoji:        true,    // эмодзи по контексту
        virality:     true,    // скор виральности
      }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message ?? `HTTP ${res.status}` };
    return data;
  } catch (e: any) { return { error: e.message }; }
}

// ── 2. Poll project status & get clips ───────────────────────────────────────
export async function pollOpusProject(projectId: string) {
  if (!process.env.OPUS_KEY) return { error: "OPUS_KEY не задан в .env" };
  try {
    const res = await fetch(`${BASE}/clips/${projectId}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return { error: data.message ?? `HTTP ${res.status}` };
    return data;
    // Ожидаемый ответ:
    // {
    //   id: string,
    //   status: "processing" | "completed" | "failed",
    //   progress: number,          // 0–100
    //   clips: [
    //     {
    //       id: string,
    //       title: string,
    //       start_time: number,
    //       end_time: number,
    //       duration: number,
    //       virality_score: number, // 0–100
    //       download_url: string,
    //       thumbnail_url: string,
    //       transcript: string,
    //       hook: string,           // AI-выделенный хук
    //     }
    //   ]
    // }
  } catch (e: any) { return { error: e.message }; }
}

// ── 3. Get social copy for a clip (caption + hashtags) ───────────────────────
export async function getOpusSocialCopy(clipId: string) {
  if (!process.env.OPUS_KEY) return { error: "OPUS_KEY не задан в .env" };
  try {
    const res = await fetch(`${BASE}/clips/${clipId}/social-copy`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return { error: data.message ?? `HTTP ${res.status}` };
    return data;
    // { caption: string, hashtags: string[], hooks: string[] }
  } catch (e: any) { return { error: e.message }; }
}

// ── 4. List all projects ──────────────────────────────────────────────────────
export async function listOpusProjects(page = 1, limit = 20) {
  if (!process.env.OPUS_KEY) return { error: "OPUS_KEY не задан в .env" };
  try {
    const res = await fetch(`${BASE}/clips?page=${page}&limit=${limit}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) return { error: data.message ?? `HTTP ${res.status}` };
    return data;
  } catch (e: any) { return { error: e.message }; }
}
