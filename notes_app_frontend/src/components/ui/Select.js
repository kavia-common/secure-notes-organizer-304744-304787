import React from "react";

/**
 * Labeled select component.
 */
// PUBLIC_INTERFACE
export function Select({ label, value, onChange, options, name, id }) {
  const selectId = id || name || `select_${label || "field"}`;
  return (
    <div style={{ width: "100%" }}>
      {label ? (
        <label className="label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        name={name}
        className="select"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
