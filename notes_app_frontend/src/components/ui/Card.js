import React from "react";

/**
 * Card container.
 */
// PUBLIC_INTERFACE
export function Card({ children, style, onClick, ariaLabel }) {
  const clickable = typeof onClick === "function";
  const Component = clickable ? "button" : "div";

  return (
    <Component
      type={clickable ? "button" : undefined}
      className="card"
      onClick={onClick}
      style={{
        textAlign: "left",
        width: "100%",
        ...(style || {}),
        cursor: clickable ? "pointer" : "default",
      }}
      aria-label={ariaLabel}
    >
      <div className="cardBody">{children}</div>
    </Component>
  );
}
