import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

function normalizeTone(tone) {
  const t = String(tone || "info").toLowerCase();
  if (t === "success" || t === "error" || t === "warning" || t === "info") return t;
  return "info";
}

/**
 * Provider for lightweight toast notifications.
 * Includes an aria-live region for screen readers.
 */
// PUBLIC_INTERFACE
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // PUBLIC_INTERFACE
  const showToast = useCallback(
    ({ title, message, tone = "info", durationMs = 4200 } = {}) => {
      /** Show a toast notification. */
      const id = `t_${Date.now()}_${counterRef.current++}`;
      const item = {
        id,
        title: String(title || ""),
        message: String(message || ""),
        tone: normalizeTone(tone),
      };

      setToasts((prev) => [...prev, item]);

      const ms = Math.max(1200, Number(durationMs || 0) || 0);
      window.setTimeout(() => removeToast(id), ms);

      return id;
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* aria-live region: assertive for errors, polite for others */}
      <div
        className="toastViewport"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((t) => {
          const isError = t.tone === "error";
          const isWarning = t.tone === "warning";
          const isSuccess = t.tone === "success";

          const toneClass = isError
            ? "toastItemError"
            : isWarning
              ? "toastItemWarning"
              : isSuccess
                ? "toastItemSuccess"
                : "toastItemInfo";

          return (
            <div
              key={t.id}
              className={`toast toastItem ${toneClass}`}
              role={isError ? "alert" : "status"}
              aria-live={isError ? "assertive" : "polite"}
            >
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  {t.title ? (
                    <strong style={{ display: "block", marginBottom: 4, lineHeight: 1.2 }}>{t.title}</strong>
                  ) : null}
                  {t.message ? <div className="muted" style={{ lineHeight: 1.35 }}>{t.message}</div> : null}
                </div>

                <button
                  type="button"
                  className="btn btnGhost iconBtn"
                  onClick={() => removeToast(t.id)}
                  aria-label="Dismiss notification"
                  style={{ width: 36, height: 36, borderRadius: 12 }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useToast() {
  /** Hook to show toast notifications. */
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
