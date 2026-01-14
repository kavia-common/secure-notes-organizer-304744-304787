/**
 * Lightweight API client wrapper.
 * If no backend URL is configured, the app continues to work using local storage.
 */

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Reads configured backend URL from env without hardcoding endpoints. */
  const raw = (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export async function apiFetch(path, options = {}) {
  /**
   * Calls API with base URL if configured; otherwise throws a soft error to allow fallback.
   * @param {string} path - API path starting with '/'
   * @param {RequestInit} options - fetch options
   */
  const base = getApiBaseUrl();
  if (!base) {
    const err = new Error("API base URL is not configured; running in local-only mode.");
    err.code = "NO_API_BASE";
    throw err;
  }

  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`Request failed (${res.status}) ${res.statusText}${text ? `: ${text}` : ""}`);
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}
