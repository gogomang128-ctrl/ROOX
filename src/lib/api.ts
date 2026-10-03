export type J = any;

export async function api(
  url: string,
  method: string = "GET",
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: J }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "تعذر الاتصال بالخادم" } };
  }
}
