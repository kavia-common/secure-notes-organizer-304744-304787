import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorageState } from "../utils/useLocalStorageState";

const SettingsContext = createContext(null);

const ACCENTS = [
  { id: "ocean", label: "Ocean (Blue)", primary: "#2563eb", secondary: "#f59e0b" },
  { id: "deep", label: "Deep Blue", primary: "#1d4ed8", secondary: "#f59e0b" },
  { id: "azure", label: "Azure", primary: "#0ea5e9", secondary: "#f59e0b" },
];

/**
 * Settings provider (feature-flag namespace).
 * - compactDensity: tighter list spacing
 * - accentId: theme accent selection
 */
// PUBLIC_INTERFACE
export function SettingsProvider({ children }) {
  const [compactDensity, setCompactDensity] = useLocalStorageState("sno.flags.compactDensity", false);
  const [accentId, setAccentId] = useLocalStorageState("sno.flags.accentId", "ocean");

  // Apply accent palette to CSS variables on root.
  useEffect(() => {
    const accent = ACCENTS.find((a) => a.id === accentId) || ACCENTS[0];
    document.documentElement.style.setProperty("--ocean-primary", accent.primary);
    document.documentElement.style.setProperty("--ocean-secondary", accent.secondary);
  }, [accentId]);

  const value = useMemo(() => {
    return {
      compactDensity: !!compactDensity,
      accentId,
      accents: ACCENTS,
      // PUBLIC_INTERFACE
      setCompactDensity,
      // PUBLIC_INTERFACE
      setAccentId,
    };
  }, [compactDensity, accentId, setCompactDensity, setAccentId]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// PUBLIC_INTERFACE
export function useSettings() {
  /** Hook to access persisted UI settings. */
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
