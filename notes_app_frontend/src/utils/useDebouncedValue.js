import { useEffect, useState } from "react";

/**
 * Simple debounced value hook.
 * Used to prevent frequent filtering or URL updates while the user is typing.
 */
// PUBLIC_INTERFACE
export function useDebouncedValue(value, delayMs = 250) {
  /** Returns `value` after it stays unchanged for `delayMs` milliseconds. */
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), Math.max(0, delayMs));
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
