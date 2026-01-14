import React from "react";

/**
 * Tag chip component.
 */
// PUBLIC_INTERFACE
export function TagChip({ tag, selected, onClick }) {
  return (
    <button
      className={`chip ${selected ? "chipAmber" : ""}`}
      onClick={onClick}
      aria-pressed={!!selected}
      title={`Tag: ${tag}`}
    >
      #{tag}
    </button>
  );
}
