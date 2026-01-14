import { useMemo } from "react";

/**
 * Parses comma/space-separated flags: "demoData,foo,bar"
 */
function parseFlags(raw) {
  if (!raw) return new Set();
  return new Set(
    String(raw)
      .split(/[,\s]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.toLowerCase())
  );
}

// PUBLIC_INTERFACE
export function parseBooleanEnv(raw) {
  /** Parse truthy env-like values: 1/true/on/yes/y (case-insensitive). */
  if (raw == null) return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "y" || v === "on";
}

// PUBLIC_INTERFACE
export function parseFeatureFlagsEnv(raw) {
  /** Parse a comma/space-separated list of flags into a Set. */
  return parseFlags(raw);
}

// PUBLIC_INTERFACE
export function useFeatureFlags() {
  /** Hook returning a stable feature flag object derived from env vars. */
  return useMemo(() => {
    const flags = parseFeatureFlagsEnv(process.env.REACT_APP_FEATURE_FLAGS);
    const experimentsEnabled = parseBooleanEnv(process.env.REACT_APP_EXPERIMENTS_ENABLED);

    return {
      experimentsEnabled,
      has: (name) => flags.has(String(name || "").toLowerCase()),
      // common flags used by this app
      demoData: flags.has("demodata") || flags.has("demo_data") || flags.has("seed"),
    };
  }, []);
}
