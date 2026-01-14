import React from "react";

/**
 * Labeled textarea component.
 */
// PUBLIC_INTERFACE
export function Textarea({ label, value, onChange, placeholder, name, id, rows }) {
  const areaId = id || name || `textarea_${label || "field"}`;
  return (
    <div style={{ width: "100%" }}>
      {label ? (
        <label className="label" htmlFor={areaId}>
          {label}
        </label>
      ) : null}
      <textarea
        id={areaId}
        name={name}
        className="textarea"
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
