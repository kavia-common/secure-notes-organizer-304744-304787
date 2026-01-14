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

function makeApiError(message, { code, status, url, cause } = {}) {
  const err = new Error(message);
  err.name = "ApiError";
  if (code) err.code = code;
  if (typeof status === "number") err.status = status;
  if (url) err.url = url;
  if (cause) err.cause = cause;
  return err;
}

// PUBLIC_INTERFACE
export async function apiFetch(path, options = {}) {
  /**
   * Calls API with base URL if configured; otherwise throws a soft error to allow fallback.
   * Adds better diagnostics for network failures.
   * @param {string} path - API path starting with '/'
   * @param {RequestInit & { timeoutMs?: number }} options - fetch options
   */
  const base = getApiBaseUrl();
  if (!base) {
    throw makeApiError("API base URL is not configured; running in local-only mode.", { code: "NO_API_BASE" });
  }

  const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const timeoutMs = Math.max(0, Number(options.timeoutMs || 0) || 0);
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;

  let timeoutHandle = null;
  if (controller && timeoutMs) {
    timeoutHandle = window.setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller?.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw makeApiError(`Request failed (${res.status}) ${res.statusText}${text ? `: ${text}` : ""}`, {
        code: "HTTP_ERROR",
        status: res.status,
        url,
      });
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    return res.text();
  } catch (e) {
    // Distinguish offline/network errors from HTTP errors.
    if (e?.name === "AbortError") {
      throw makeApiError("Request timed out. Falling back to local mode.", { code: "TIMEOUT", url, cause: e });
    }
    if (e?.code || e?.name === "ApiError") throw e;
    throw makeApiError("Network error. Falling back to local mode.", { code: "NETWORK_ERROR", url, cause: e });
  } finally {
    if (timeoutHandle) window.clearTimeout(timeoutHandle);
  }
}
