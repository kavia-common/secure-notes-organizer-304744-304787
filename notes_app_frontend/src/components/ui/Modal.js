import React, { useId, useRef } from "react";
import { useFocusTrap } from "../../utils/useFocusTrap";

/**
 * Accessible modal dialog with overlay click-to-close, Escape, and focus trap.
 */
// PUBLIC_INTERFACE
export function Modal({ open, title, children, footer, onClose }) {
  const titleId = useId();
  const containerRef = useRef(null);
  const closeBtnRef = useRef(null);

  useFocusTrap(open, {
    containerRef,
    initialFocusRef: closeBtnRef,
    onEscape: () => onClose?.(),
    allowOutsideClick: true,
  });

  if (!open) return null;

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={containerRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? "Dialog" : undefined}
      >
        <div className="modalHeader" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span id={titleId}>{title}</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btnGhost iconBtn"
            onClick={() => onClose?.()}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className="modalBody">{children}</div>
        {footer ? <div className="modalFooter">{footer}</div> : null}
      </div>
    </div>
  );
}
