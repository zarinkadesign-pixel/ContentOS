// All API calls use relative paths — same Next.js app, no separate backend needed
async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json() as Promise<T>;
}

export const getDashboard  = ()          => req<any>("/api/dashboard");
export const getClients    = ()          => req<any[]>("/api/clients");
export const getClient     = (id: string)  => req<any>(`/api/clients/${id}`);
export const createClient  = (data: any)   => req<any>("/api/clients", { method: "POST", body: JSON.stringify(data) });
export const updateClient  = (id: string, data: any) =>
  req<any>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify({ data }) });
export const deleteClient  = (id: string)  => req<void>(`/api/clients/${id}`, { method: "DELETE" });

export const getLeads      = ()          => req<any[]>("/api/leads");
export const createLead    = (data: any)   => req<any>("/api/leads", { method: "POST", body: JSON.stringify(data) });
export const updateLead    = (id: string, data: any) =>
  req<any>(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const moveLead      = (id: string, stage: string) =>
  req<any>(`/api/leads/${id}/stage`, { method: "PUT", body: JSON.stringify({ stage }) });
export const deleteLead    = (id: string)  => req<void>(`/api/leads/${id}`, { method: "DELETE" });

export const getFinance       = ()           => req<any>("/api/finance");
export const addTransaction   = (data: any)  =>
  req<any>("/api/finance/transactions", { method: "POST", body: JSON.stringify(data) });
export const deleteTransaction = (id: string) =>
  req<void>(`/api/finance/transactions/${id}`, { method: "DELETE" });

export const getSettings    = ()           => req<any>("/api/settings");
export const updateSettings = (data: any)  =>
  req<any>("/api/settings", { method: "PUT", body: JSON.stringify(data) });

export const getAgents     = ()          => req<any[]>("/api/agents");
export const runAgent      = (type: string, clientId: string, extra = "") =>
  req<any>(`/api/agents/${type}`, { method: "POST", body: JSON.stringify({ client_id: clientId, extra }) });

// ── Workspace ─────────────────────────────────────────────────────────────────
export const getTasks       = ()                   => req<any[]>("/api/workspace/tasks");
export const createTask     = (data: any)          => req<any>("/api/workspace/tasks",       { method: "POST", body: JSON.stringify(data) });
export const updateTask     = (id: string, data: any) => req<any>(`/api/workspace/tasks/${id}`, { method: "PUT",  body: JSON.stringify(data) });
export const deleteTask     = (id: string)         => req<void>(`/api/workspace/tasks/${id}`,  { method: "DELETE" });
export const getTimeSessions = ()                  => req<any>("/api/workspace/time");
export const startTimer     = (category = "", note = "") =>
  req<any>("/api/workspace/time", { method: "POST", body: JSON.stringify({ action: "start", category, note }) });
export const stopTimer      = ()                   =>
  req<any>("/api/workspace/time", { method: "POST", body: JSON.stringify({ action: "stop" }) });
export const getWorkspaceStats = ()               => req<any>("/api/workspace/stats");

export const clipVideo     = (videoUrl: string, language = "ru") =>
  req<any>("/api/vizard/clip", { method: "POST", body: JSON.stringify({ video_url: videoUrl, language }) });
export const getProject    = (id: string)  => req<any>(`/api/vizard/project/${id}`);
export const getSocial     = (projectId: string) =>
  req<any>("/api/vizard/social", { method: "POST", body: JSON.stringify({ project_id: projectId }) });
export const publishVideo  = (projectId: string, caption: string, publishAt = "") =>
  req<any>("/api/vizard/publish", { method: "POST", body: JSON.stringify({ project_id: projectId, caption, publish_at: publishAt }) });
