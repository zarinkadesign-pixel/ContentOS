const BASE = "https://elb-api.vizard.ai/hvizard-server-front/open-api/v1";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.VIZARD_KEY ?? ""}`,
  };
}

export async function createProject(videoUrl: string, language = "ru") {
  if (!process.env.VIZARD_KEY) return { error: "VIZARD_KEY не задан" };
  try {
    const res = await fetch(`${BASE}/project/create`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        videoUrl,
        language,
        autoClip: true,
        clipDuration: [30, 60, 90],
        virality: true,
      }),
    });
    return res.json();
  } catch (e: any) { return { error: e.message }; }
}

export async function pollProject(projectId: string) {
  if (!process.env.VIZARD_KEY) return { error: "VIZARD_KEY не задан" };
  try {
    const res = await fetch(`${BASE}/project/${projectId}`, { headers: headers() });
    return res.json();
  } catch (e: any) { return { error: e.message }; }
}

export async function getAiSocial(projectId: string) {
  if (!process.env.VIZARD_KEY) return { error: "VIZARD_KEY не задан" };
  try {
    const res = await fetch(`${BASE}/project/${projectId}/social`, { headers: headers() });
    return res.json();
  } catch (e: any) { return { error: e.message }; }
}

export async function publishVideoClip(projectId: string, caption: string, publishAt: string) {
  if (!process.env.VIZARD_KEY) return { error: "VIZARD_KEY не задан" };
  try {
    const res = await fetch(`${BASE}/project/${projectId}/publish`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ caption, publishAt: publishAt || undefined }),
    });
    return res.json();
  } catch (e: any) { return { error: e.message }; }
}
