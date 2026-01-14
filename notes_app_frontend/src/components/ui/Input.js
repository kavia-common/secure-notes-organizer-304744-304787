import React from "react";

/**
 * Labeled input component.
 */
// PUBLIC_INTERFACE
export function Input({ label, value, onChange, placeholder, type = "text", rightSlot, name, id }) {
  const inputId = id || name || `input_${label || "field"}`;
  return (
    <div style={{ width: "100%" }}>
      {label ? (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className="row" style={{ gap: 8 }}>
        <input
          id={inputId}
          name={name}
          className="input"
          value={value}
          type={type}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {rightSlot ? rightSlot : null}
      </div>
    </div>
  );
}
