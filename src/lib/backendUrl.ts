/** Default API origin; override with `VITE_BACKEND_URL`. */
const DEFAULT =
  "https://interview-regulator-backend-140431125163.europe-west1.run.app";

function apiBaseFromEnv(raw: string | undefined): string {
  if (!raw?.trim()) return DEFAULT;
  try {
    const withoutHash = raw.split("#")[0];
    const u = new URL(withoutHash);
    let path = u.pathname.replace(/\/$/, "");
    if (path.endsWith("/docs")) {
      path = path.slice(0, -"/docs".length) || "";
    }
    const base = `${u.origin}${path}`.replace(/\/$/, "");
    return base || u.origin;
  } catch {
    return DEFAULT;
  }
}

/** Use for REST calls (origin only; `/docs` is stripped if present). */
export const BACKEND_API_BASE = apiBaseFromEnv(import.meta.env.VITE_BACKEND_URL);

/** Swagger UI URL (same host as the API, path /docs#/). */
export const BACKEND_DOCS_URL = `${BACKEND_API_BASE}/docs#/`;
