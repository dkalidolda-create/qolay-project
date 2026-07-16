import type {
  Summary,
  Reading,
  Report,
  ReportCategory,
  ReportStatus,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function fetchSummary(): Promise<Summary> {
  return request<Summary>("/api/summary");
}

export function fetchReadings(
  params: Record<string, string | number | undefined> = {},
): Promise<Reading[]> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  });
  const str = qs.toString();
  return request<Reading[]>(`/api/readings${str ? `?${str}` : ""}`);
}

export function fetchReports(status?: ReportStatus): Promise<Report[]> {
  const qs = status ? `?status=${status}` : "";
  return request<Report[]>(`/api/reports${qs}`);
}

export function createReport(payload: {
  category: ReportCategory;
  comment?: string;
}): Promise<Report> {
  return request<Report>("/api/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateReport(
  id: number,
  payload: Partial<{
    category: ReportCategory;
    comment: string;
    status: ReportStatus;
  }>,
): Promise<Report> {
  return request<Report>(`/api/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteReport(id: number): Promise<void> {
  return request<void>(`/api/reports/${id}`, { method: "DELETE" });
}
