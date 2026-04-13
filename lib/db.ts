// T010: Insforge 直连客户端（PostgREST-compatible REST API）
// SDK 有 Node.js v25 兼容性问题，改用轻量级 fetch 封装

const BASE_URL = process.env.INSFORGE_URL;
const API_KEY = process.env.INSFORGE_KEY;

if (!BASE_URL) throw new Error("Missing env: INSFORGE_URL");
if (!API_KEY) throw new Error("Missing env: INSFORGE_KEY");

const HEADERS = {
  apikey: API_KEY,
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

/**
 * 构建带筛选条件的 URL 参数
 */
export function buildQuery(params: Record<string, string>): string {
  const q = new URLSearchParams(params);
  return q.toString() ? `?${q}` : "";
}

/**
 * GET /api/database/records/{table}
 * 支持 PostgREST 风格的查询参数（select, order, limit, offset, eq, ilike 等）
 */
export async function dbQuery<T>(
  table: string,
  params: Record<string, string> = {},
  countHeader = false
): Promise<{ data: T[]; count: number | null }> {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/database/records/${table}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = { ...HEADERS };
  if (countHeader) headers["Prefer"] = "count=exact";

  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dbQuery failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as T[];
  const countRaw = res.headers.get("content-range");
  // content-range: 0-11/2542
  const count = countRaw ? parseInt(countRaw.split("/")[1]) : null;
  return { data, count };
}

/**
 * POST /api/database/rpc/{fn}
 */
export async function dbRpc<T>(
  fn: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/database/rpc/${fn}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`dbRpc ${fn} failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
