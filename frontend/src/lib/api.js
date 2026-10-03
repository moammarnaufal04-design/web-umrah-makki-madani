import axios from "axios";
import { supabase } from "@/lib/supabase";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const publicApi = axios.create({ baseURL: `${API}/public` });
export const adminApi = axios.create({ baseURL: `${API}/admin` });

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

adminApi.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function apiError(err, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  const data = err?.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => `${e.field ? e.field + ": " : ""}${e.message}`).join("; ");
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) return data.detail.map((d) => d.msg).join("; ");
  return err?.message || fallback;
}

export async function downloadExport(entity, params = {}) {
  const token = await getToken();
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""))).toString();
  const res = await fetch(`${API}/admin/export/${entity}?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Export gagal");
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = match ? match[1] : `${entity}.${params.format || "csv"}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export async function uploadMedia(file, folder = "general", altText = "") {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  form.append("alt_text", altText);
  const { data } = await adminApi.post("/media/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
  return data;
}
