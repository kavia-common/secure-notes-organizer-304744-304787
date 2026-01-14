import { useMemo } from "react";

/**
 * Parses comma/space-separated flags: "demoData,foo,bar"
 */
function parseFlags(raw) {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(/[,\s]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase())
  );
}

function parseBoolean(raw) {
  if (raw == null) return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

// PUBLIC_INTERFACE
export function useFeatureFlags() {
  /** Hook returning a stable feature flag object derived from env vars. */
  return useMemo(() => {
    const flags = parseFlags(process.env.REACT_APP_FEATURE_FLAGS);
    const experimentsEnabled = parseBoolean(process.env.REACT_APP_EXPERIMENTS_ENABLED);

    return {
      experimentsEnabled,
      has: (name) => flags.has(String(name || "").toLowerCase()),
      // common flags used by this app
      demoData: flags.has("demodata") || flags.has("demo_data") || flags.has("seed"),
    };
  }, []);
}
