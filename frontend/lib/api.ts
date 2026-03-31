const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "API error");
  }
  return res.json() as Promise<T>;
}

// Dashboard
export const getDashboard = () => req<any>("/api/dashboard");

// Clients
export const getClients  = ()         => req<any[]>("/api/clients");
export const getClient   = (id: string) => req<any>(`/api/clients/${id}`);
export const createClient = (data: any) => req<any>("/api/clients", { method: "POST", body: JSON.stringify(data) });
export const updateClient = (id: string, data: any) =>
  req<any>(`/api/clients/${id}`, { method: "PUT", body: JSON.stringify({ data }) });
export const deleteClient = (id: string) =>
  req<void>(`/api/clients/${id}`, { method: "DELETE" });

// Leads
export const getLeads    = ()          => req<any[]>("/api/leads");
export const createLead  = (data: any) => req<any>("/api/leads", { method: "POST", body: JSON.stringify(data) });
export const moveLead    = (id: string, stage: string) =>
  req<any>(`/api/leads/${id}/stage`, { method: "PUT", body: JSON.stringify({ stage }) });
export const deleteLead  = (id: string) =>
  req<void>(`/api/leads/${id}`, { method: "DELETE" });

// Finance
export const getFinance        = ()          => req<any>("/api/finance");
export const addTransaction    = (data: any) =>
  req<any>("/api/finance/transactions", { method: "POST", body: JSON.stringify(data) });

// Agents
export const getAgents  = () => req<any[]>("/api/agents");
export const runAgent   = (agentType: string, clientId: string, extra = "") =>
  req<any>(`/api/agents/${agentType}`, { method: "POST", body: JSON.stringify({ client_id: clientId, extra }) });

// Vizard
export const clipVideo    = (videoUrl: string, language = "ru") =>
  req<any>("/api/vizard/clip", { method: "POST", body: JSON.stringify({ video_url: videoUrl, language }) });
export const getProject   = (projectId: string) => req<any>(`/api/vizard/project/${projectId}`);
export const getSocial    = (projectId: string) =>
  req<any>("/api/vizard/social", { method: "POST", body: JSON.stringify({ project_id: projectId }) });
export const publishVideo = (projectId: string, caption: string, publishAt = "") =>
  req<any>("/api/vizard/publish", { method: "POST", body: JSON.stringify({ project_id: projectId, caption, publish_at: publishAt }) });
