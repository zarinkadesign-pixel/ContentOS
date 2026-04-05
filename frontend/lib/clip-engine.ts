/**
 * NOESIS — Deterministic Hybrid Control Framework for Frozen Neural Operators (DHCF-FNO)
 * Copyright (c) 2026 AMAImedia.com
 * All rights reserved. lib/clip-engine.ts
 *
 * Own AI clip engine — no third-party clipping API.
 * Pipeline: download → transcribe (Groq Whisper) → analyse (Groq LLaMA) → cut (ffmpeg)
 * Graceful degradation: works in analysis-only mode if ffmpeg/yt-dlp are missing.
 */
import { exec }    from "child_process";
import { promisify } from "util";
import fs            from "fs";
import path          from "path";
import { createReadStream } from "fs";
import { updateJob, type TranscriptSegment, type OwnClip } from "./clip-store";

const execAsync = promisify(exec);

/* ── directories ─────────────────────────────────────────────────── */
const CLIPS_PUBLIC = path.join(process.cwd(), "public", "generated", "clips");
const TEMP_DIR     = path.join(process.cwd(), ".tmp", "clips");
[CLIPS_PUBLIC, TEMP_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

/* ── tool detection ──────────────────────────────────────────────── */
async function probe(cmd: string): Promise<string | null> {
  const candidates = [cmd, `${cmd}.exe`];
  // Check Windows common paths too
  if (cmd === "ffmpeg") {
    candidates.push(
      "C:\\ffmpeg\\bin\\ffmpeg.exe",
      "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
      "C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe",
    );
  }
  if (cmd === "yt-dlp") {
    candidates.push(
      "C:\\Users\\2026\\AppData\\Local\\Programs\\yt-dlp\\yt-dlp.exe",
      "C:\\ProgramData\\chocolatey\\bin\\yt-dlp.exe",
    );
  }
  for (const c of candidates) {
    try {
      await execAsync(`"${c}" --version`);
      return c;
    } catch { /* try next */ }
  }
  return null;
}

export async function checkTools() {
  const [ffmpeg, ytdlp] = await Promise.all([probe("ffmpeg"), probe("yt-dlp")]);
  return { ffmpeg, ytdlp };
}

/* ── step 1: download ────────────────────────────────────────────── */
async function downloadVideo(
  url:        string,
  outputPath: string,
  ytdlpPath:  string | null,
): Promise<void> {
  // Direct file URL: use Node.js fetch (no yt-dlp needed)
  if (/\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} downloading video`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outputPath, buf);
    return;
  }
  // YouTube / other: require yt-dlp
  if (!ytdlpPath) throw new Error("yt-dlp not installed — paste a direct .mp4 URL or install yt-dlp");
  await execAsync(`"${ytdlpPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" -o "${outputPath}" --no-playlist "${url}"`);
}

/* ── step 2: extract audio ───────────────────────────────────────── */
async function extractAudio(
  videoPath: string,
  audioPath: string,
  ffmpegPath: string,
): Promise<void> {
  await execAsync(`"${ffmpegPath}" -i "${videoPath}" -vn -ar 16000 -ac 1 -c:a pcm_s16le -y "${audioPath}"`);
}

/* ── step 3: transcribe with Groq Whisper ────────────────────────── */
async function transcribeAudio(
  audioPath: string,
  language:  string,
): Promise<TranscriptSegment[]> {
  const GROQ_KEY = process.env.GROQ_API_KEY ?? process.env.GROQ_KEY ?? "";
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set in .env.local");

  const form = new FormData();
  const blob = new Blob([fs.readFileSync(audioPath)], { type: "audio/wav" });
  form.append("file", blob, path.basename(audioPath));
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", language === "kz" ? "kk" : language);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method:  "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}` },
    body:    form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Groq Whisper error ${res.status}`);

  // Normalise to our format
  if (data.segments) {
    return data.segments.map((s: { start: number; end: number; text: string }) => ({
      start: s.start,
      end:   s.end,
      text:  s.text.trim(),
    }));
  }
  // Fallback: single segment
  return [{ start: 0, end: 9999, text: data.text ?? "" }];
}

/* ── step 4: transcribe audio via URL (no download) ─────────────── */
async function transcribeUrl(url: string, language: string): Promise<TranscriptSegment[]> {
  // Download to temp, transcribe, remove
  const tmp = path.join(TEMP_DIR, `audio_${Date.now()}.tmp`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Cannot fetch audio for transcription: HTTP ${res.status}`);
  fs.writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  try {
    return await transcribeAudio(tmp, language);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/* ── step 5: analyse with Groq LLaMA ────────────────────────────── */
async function analyzeViralMoments(
  segments:   TranscriptSegment[],
  clipLength: string,
  language:   string,
): Promise<Omit<OwnClip, "id" | "file_path" | "download_url" | "thumbnail_url">[]> {
  const GROQ_KEY = process.env.GROQ_API_KEY ?? process.env.GROQ_KEY ?? "";
  if (!GROQ_KEY) throw new Error("GROQ_API_KEY not set in .env.local");

  const [minSec, maxSec] = clipLength.split("-").map(Number);
  const fullText = segments.map(s => `[${s.start.toFixed(1)}-${s.end.toFixed(1)}] ${s.text}`).join("\n");

  const system = `You are a viral social media expert. Find the best moments to clip from a video transcript for short-form content (TikTok, Instagram Reels, YouTube Shorts). Each clip must be ${minSec}–${maxSec} seconds. Return ONLY a valid JSON array, no markdown.`;

  const prompt = `Find 5–8 viral clips from this transcript. Use exact timestamps shown in brackets.

TRANSCRIPT:
${fullText.slice(0, 12000)}

Return JSON array:
[
  {
    "title": "Short catchy title (max 60 chars)",
    "start_time": 12.5,
    "end_time": 45.2,
    "hook": "Why this moment grabs attention (1 sentence)",
    "virality_score": 85,
    "transcript": "exact words from start_time to end_time"
  }
]

Rules:
- start_time and end_time must be timestamps from the transcript
- end_time - start_time must be between ${minSec} and ${maxSec} seconds
- virality_score: 90+ = strong emotional hook, 70-89 = valuable insight, 50-69 = decent
- Sort by virality_score descending
- Respond in the same language as the transcript`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:  "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user",   content: prompt },
      ],
      temperature: 0.3,
      max_tokens:  2000,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Groq LLaMA error ${res.status}`);

  const raw = data.choices?.[0]?.message?.content ?? "[]";
  // Extract JSON array even if surrounded by markdown
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Could not parse viral moments from AI response");
  return JSON.parse(match[0]);
}

/* ── step 6: cut clip with ffmpeg ────────────────────────────────── */
async function cutClip(
  inputPath:   string,
  outputPath:  string,
  start:       number,
  duration:    number,
  aspectRatio: string,
  ffmpegPath:  string,
): Promise<void> {
  const [w, h] =
    aspectRatio === "9:16" ? ["1080", "1920"] :
    aspectRatio === "1:1"  ? ["1080", "1080"] :
                             ["1920", "1080"];

  const vf = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
  await execAsync(
    `"${ffmpegPath}" -i "${inputPath}" -ss ${start} -t ${duration} ` +
    `-vf "${vf}" -c:v libx264 -preset fast -crf 23 -c:a aac -movflags +faststart -y "${outputPath}"`,
  );
}

/* ── step 7: thumbnail ───────────────────────────────────────────── */
async function makeThumbnail(
  inputPath:  string,
  thumbPath:  string,
  offset:     number,
  ffmpegPath: string,
): Promise<void> {
  await execAsync(
    `"${ffmpegPath}" -i "${inputPath}" -ss ${offset} -vframes 1 -q:v 2 -y "${thumbPath}"`,
  );
}

/* ── main pipeline ───────────────────────────────────────────────── */
export async function runClipPipeline(jobId: string): Promise<void> {
  const { getJob } = await import("./clip-store");
  const job = getJob(jobId);
  if (!job) return;

  const { ffmpeg, ytdlp } = await checkTools();
  const canDownload = !!ytdlp || /\.(mp4|mov|webm)(\?.*)?$/i.test(job.video_url);
  const canCut      = !!ffmpeg && canDownload;

  updateJob(jobId, { mode: canCut ? "full" : "analysis_only", progress: 2 });

  const videoPath  = path.join(TEMP_DIR, `${jobId}.mp4`);
  const audioPath  = path.join(TEMP_DIR, `${jobId}.wav`);

  try {
    /* ── 1. download ── */
    if (canDownload) {
      updateJob(jobId, { status: "downloading", progress: 5 });
      await downloadVideo(job.video_url, videoPath, ytdlp);
      updateJob(jobId, { video_path: videoPath, progress: 25 });
    }

    /* ── 2. get audio for transcription ── */
    let transcriptSegments: TranscriptSegment[];
    updateJob(jobId, { status: "transcribing", progress: 30 });

    if (canCut && ffmpeg) {
      await extractAudio(videoPath, audioPath, ffmpeg);
      transcriptSegments = await transcribeAudio(audioPath, job.language);
    } else if (canDownload) {
      // No ffmpeg but has video → try sending video directly to Whisper
      transcriptSegments = await transcribeAudio(videoPath, job.language);
    } else {
      throw new Error("Cannot transcribe: no local video access. Install yt-dlp + ffmpeg.");
    }

    updateJob(jobId, { transcript: transcriptSegments, progress: 55 });

    /* ── 3. analyse ── */
    updateJob(jobId, { status: "analyzing", progress: 60 });
    const moments = await analyzeViralMoments(transcriptSegments, job.clip_length, job.language);
    updateJob(jobId, { progress: 75 });

    /* ── 4. cut clips (if ffmpeg available) ── */
    updateJob(jobId, { status: "cutting", progress: 78 });
    const clips: OwnClip[] = [];

    for (let i = 0; i < moments.length; i++) {
      const m        = moments[i];
      const clipId   = `${jobId}_${i}`;
      const duration = Math.round(m.end_time - m.start_time);
      const fileName = `clip_${clipId}.mp4`;
      const thumbName= `thumb_${clipId}.jpg`;
      const clipPath = path.join(CLIPS_PUBLIC, fileName);
      const thumbPath= path.join(CLIPS_PUBLIC, thumbName);

      let file_path    = "";
      let download_url = "";
      let thumbnail_url= "";

      if (canCut && ffmpeg) {
        try {
          await cutClip(videoPath, clipPath, m.start_time, duration, job.aspect_ratio, ffmpeg);
          file_path    = clipPath;
          download_url = `/generated/clips/${fileName}`;
          try {
            await makeThumbnail(clipPath, thumbPath, 1, ffmpeg);
            thumbnail_url = `/generated/clips/${thumbName}`;
          } catch { /* thumbnail optional */ }
        } catch (err: any) {
          console.error(`[clip-engine] Failed to cut clip ${i}: ${err.message}`);
        }
      }

      clips.push({
        id:             clipId,
        title:          m.title,
        start_time:     m.start_time,
        end_time:       m.end_time,
        duration,
        virality_score: m.virality_score,
        hook:           m.hook,
        transcript:     m.transcript,
        file_path,
        download_url,
        thumbnail_url,
      });

      updateJob(jobId, { progress: 78 + Math.round(((i + 1) / moments.length) * 20) });
    }

    updateJob(jobId, { status: "completed", progress: 100, clips });
  } catch (err: any) {
    updateJob(jobId, { status: "failed", error: err.message });
  } finally {
    // Cleanup temp files
    [videoPath, audioPath].forEach(f => { try { fs.rmSync(f, { force: true }); } catch {} });
  }
}
