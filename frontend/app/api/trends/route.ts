import { NextRequest, NextResponse } from "next/server";

const YT_KEY = process.env.YOUTUBE_API_KEY ?? "";
const YT_BASE = "https://www.googleapis.com/youtube/v3";

export interface TrendVideo {
  id: string;
  platform: "youtube" | "tiktok";
  title: string;
  channel: string;
  thumbnail: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  duration: string; // ISO 8601 e.g. PT4M13S
  durationSec: number;
  publishedAt: string;
  er: number; // engagement rate %
  tags: string[];
  category: string;
}

function parseISO8601(d: string): number {
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0");
}

function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function searchYouTube(
  query: string,
  maxResults = 24,
  order: "relevance" | "viewCount" | "date" = "relevance",
  publishedAfter?: string
): Promise<TrendVideo[]> {
  if (!YT_KEY) return getMockTrends(query);

  // 1. Search for video IDs
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    maxResults: String(maxResults),
    order,
    key: YT_KEY,
    ...(publishedAfter ? { publishedAfter } : {}),
  });

  const searchRes = await fetch(`${YT_BASE}/search?${searchParams}`);
  if (!searchRes.ok) return getMockTrends(query);
  const searchData = await searchRes.json();

  const items: any[] = searchData.items ?? [];
  if (items.length === 0) return [];

  const ids = items.map((i: any) => i.id.videoId).join(",");

  // 2. Fetch statistics + content details in one call (costs ~3 quota units)
  const statsParams = new URLSearchParams({
    part: "statistics,contentDetails,snippet",
    id: ids,
    key: YT_KEY,
  });

  const statsRes = await fetch(`${YT_BASE}/videos?${statsParams}`);
  if (!statsRes.ok) return getMockTrends(query);
  const statsData = await statsRes.json();

  return (statsData.items ?? []).map((v: any): TrendVideo => {
    const views    = parseInt(v.statistics?.viewCount    ?? "0");
    const likes    = parseInt(v.statistics?.likeCount    ?? "0");
    const comments = parseInt(v.statistics?.commentCount ?? "0");
    const er       = views > 0 ? +((((likes + comments) / views) * 100).toFixed(2)) : 0;
    const durRaw   = v.contentDetails?.duration ?? "PT0S";
    const durSec   = parseISO8601(durRaw);

    return {
      id:          v.id,
      platform:    "youtube",
      title:       v.snippet?.title ?? "",
      channel:     v.snippet?.channelTitle ?? "",
      thumbnail:   v.snippet?.thumbnails?.high?.url ?? v.snippet?.thumbnails?.medium?.url ?? "",
      url:         `https://www.youtube.com/watch?v=${v.id}`,
      views,
      likes,
      comments,
      duration:    fmtDuration(durSec),
      durationSec: durSec,
      publishedAt: v.snippet?.publishedAt ?? "",
      er,
      tags:        (v.snippet?.tags ?? []).slice(0, 6),
      category:    v.snippet?.categoryId ?? "",
    };
  });
}

// ── Mock data for demo / missing API key ───────────────────────────────────────
function getMockTrends(query: string): TrendVideo[] {
  const topics = [
    { title: `Как я набрал 100K подписчиков за 30 дней — ${query}`, views: 2_340_000, likes: 87_000, comments: 4_200, dur: "8:14" },
    { title: `Секрет вирального контента в 2025 — ${query}`, views: 1_890_000, likes: 71_000, comments: 3_800, dur: "12:33" },
    { title: `5 ошибок новичков в ${query} — смотри до конца`, views: 980_000,   likes: 42_000, comments: 1_900, dur: "6:47" },
    { title: `${query}: полный гайд с нуля до профи`, views: 3_100_000, likes: 98_000, comments: 6_100, dur: "22:15" },
    { title: `Тренды ${query} — что взрывается прямо сейчас`, views: 560_000,   likes: 29_000, comments: 1_100, dur: "5:02" },
    { title: `Я попробовал стратегию ${query} — результат шокировал`, views: 1_230_000, likes: 55_000, comments: 2_800, dur: "10:19" },
    { title: `Честный обзор: работает ли ${query} в 2025`, views: 720_000,   likes: 31_000, comments: 1_600, dur: "7:44" },
    { title: `${query} для бизнеса: кейс +500% за 60 дней`, views: 445_000,   likes: 19_000, comments: 890,   dur: "9:28" },
    { title: `Топ-10 инструментов для ${query} — бесплатно`, views: 1_670_000, likes: 63_000, comments: 3_400, dur: "15:07" },
    { title: `${query} без бюджета — реальный опыт`, views: 334_000,   likes: 14_000, comments: 670,   dur: "4:55" },
    { title: `Алгоритм ${query}: как работает в 2025`, views: 880_000,   likes: 38_000, comments: 2_100, dur: "11:36" },
    { title: `${query} х10 за месяц — пошаговый план`, views: 2_010_000, likes: 76_000, comments: 4_900, dur: "18:22" },
  ];

  return topics.map((t, i) => {
    const er = +((((t.likes + t.comments) / t.views) * 100).toFixed(2));
    return {
      id:          `mock_${i}`,
      platform:    "youtube",
      title:       t.title,
      channel:     ["MrBeast RU", "Хватит работать", "Digital Маркетинг", "ViralLab"][i % 4],
      thumbnail:   `https://picsum.photos/seed/${query.replace(/\s/g,"_")}${i}/480/270`,
      url:         `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      views:       t.views,
      likes:       t.likes,
      comments:    t.comments,
      duration:    t.dur,
      durationSec: 0,
      publishedAt: new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
      er,
      tags:        [query, "тренды", "контент", "вирал"].slice(0, 3),
      category:    "22",
    };
  });
}

// ── Route handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const query     = searchParams.get("q")       ?? "viral marketing";
  const order     = (searchParams.get("order")  ?? "relevance") as "relevance" | "viewCount" | "date";
  const maxRes    = Math.min(Number(searchParams.get("max") ?? 24), 50);
  const after     = searchParams.get("after")   ?? undefined;   // ISO date string

  try {
    const videos = await searchYouTube(query, maxRes, order, after);
    // Sort by ER descending by default
    const sorted = [...videos].sort((a, b) => b.er - a.er);
    return NextResponse.json({ videos: sorted, total: sorted.length, hasKey: !!YT_KEY });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
