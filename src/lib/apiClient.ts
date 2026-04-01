import { BACKEND_API_BASE } from "@/lib/backendUrl";

async function formatError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as {
      detail?: unknown;
      error?: unknown;
      details?: unknown;
      status_code?: unknown;
    };

    const d = j.detail ?? j.error;
    if (Array.isArray(d)) {
      return d
        .map((item: { msg?: string }) => item?.msg)
        .filter(Boolean)
        .join("; ");
    }
    if (typeof d === "string") return d;

    // Validation-style shape: { error: "Validation failed", details: [...] }
    if (Array.isArray(j.details)) {
      const msgs = (j.details as Array<{ msg?: unknown; message?: unknown }>)
        .map((it) => (typeof it?.msg === "string" ? it.msg : typeof it?.message === "string" ? it.message : null))
        .filter((x): x is string => Boolean(x));
      if (msgs.length > 0) return msgs.join("; ");
      if (typeof j.error === "string") return j.error;
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

function joinUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_API_BASE}${p}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(joinUrl(path));
  if (!res.ok) {
    throw new Error(await formatError(res));
  }
  return res.json() as Promise<T>;
}

/** Returns `null` on 404; throws on other errors. */
export async function apiGetOptional<T>(path: string): Promise<T | null> {
  const res = await fetch(joinUrl(path));
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await formatError(res));
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(joinUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(await formatError(res));
  }
  return res.json() as Promise<T>;
}
