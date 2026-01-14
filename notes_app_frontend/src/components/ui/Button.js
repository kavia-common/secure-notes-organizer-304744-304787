import React from "react";

/**
 * Reusable button component, styled by App.css.
 */
// PUBLIC_INTERFACE
export function Button({ children, onClick, variant = "default", className = "", ariaLabel, type = "button", disabled }) {
  const variantClass =
    variant === "primary" ? "btnPrimary" :
    variant === "ghost" ? "btnGhost" :
    variant === "danger" ? "btnDanger" :
    "";

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
