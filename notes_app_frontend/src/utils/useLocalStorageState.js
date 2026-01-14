import { useCallback, useEffect, useState } from "react";

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function useLocalStorageState(key, initialValue) {
  /** Persisted state hook backed by localStorage; falls back to in-memory if unavailable. */
  const [value, setValue] = useState(() => {
    try {
      const existing = window.localStorage.getItem(key);
      if (existing == null) return initialValue;
      return safeJsonParse(existing, initialValue);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore (private mode / quota / SSR)
    }
  }, [key, value]);

  const update = useCallback((next) => {
    setValue((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);

  return [value, update];
}
