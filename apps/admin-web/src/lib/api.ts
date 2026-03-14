const API_BASE = "/pipeline";

function getApiKey(): string {
  return localStorage.getItem("admin_api_key") ?? "";
}

export function setApiKey(key: string) {
  localStorage.setItem("admin_api_key", key);
}

export function getStoredApiKey(): string {
  return getApiKey();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// ── Pipeline control ─────────────────────────────────────

export const pollPipeline = () => request<{ ok: boolean }>("/poll", { method: "POST" });

export const getPipelineStatus = () =>
  request<{
    total: number;
    success: number;
    duplicates: number;
    skipped: number;
    errors: number;
    last_poll: string | null;
  }>("/status");

// ── Events ───────────────────────────────────────────────

export interface PipelineEvent {
  id: string;
  title: string;
  description: string;
  datetime: string;
  end_datetime: string | null;
  source_message_id: string;
  org_id: string | null;
  location_name: string | null;
  location_id: string | null;
  created_at: string;
}

export const getPipelineEvents = (limit = 50, offset = 0) =>
  request<PipelineEvent[]>(`/events?limit=${limit}&offset=${offset}`);

export const updatePipelineEvent = (id: string, fields: Record<string, unknown>) =>
  request(`/events/${id}`, { method: "PATCH", body: JSON.stringify(fields) });

export const deletePipelineEvent = (id: string) => request(`/events/${id}`, { method: "DELETE" });

// ── Duplicates ───────────────────────────────────────────

export interface DuplicateEntry {
  id: string;
  message_id: string;
  status: string;
  error_text: string | null;
  listserv_label: string | null;
  created_at: string;
}

export const getDuplicates = (limit = 50, offset = 0) =>
  request<DuplicateEntry[]>(`/duplicates?limit=${limit}&offset=${offset}`);

// ── Configs ──────────────────────────────────────────────

export interface ListservConfigItem {
  id: string;
  address: string;
  label: string;
  org_id: string | null;
  gmail_label: string | null;
  enabled: boolean;
  created_at: string;
}

export const getConfigs = () => request<ListservConfigItem[]>("/configs");

export const createConfig = (data: {
  address: string;
  label: string;
  gmail_label?: string;
  org_id?: string;
}) => request<ListservConfigItem>("/configs", { method: "POST", body: JSON.stringify(data) });

export const updateConfig = (id: string, fields: Record<string, unknown>) =>
  request(`/configs/${id}`, { method: "PATCH", body: JSON.stringify(fields) });

export const deleteConfig = (id: string) => request(`/configs/${id}`, { method: "DELETE" });
