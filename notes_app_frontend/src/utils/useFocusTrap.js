import { useEffect, useRef } from "react";

function getFocusableElements(container) {
  if (!container) return [];
  // Common focusable selectors (kept small & dependency-free)
  const selectors = [
    'a[href]',
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  const nodes = Array.from(container.querySelectorAll(selectors));
  // Filter out hidden/disabled via layout
  return nodes.filter((el) => {
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  });
}

/**
 * Simple focus trap that:
 * - Stores/restores previously focused element
 * - Focuses first focusable or the container itself on open
 * - Traps Tab/Shift+Tab within the container
 * - Optionally closes on Escape
 */
// PUBLIC_INTERFACE
export function useFocusTrap(open, { containerRef, initialFocusRef, onEscape, allowOutsideClick = true } = {}) {
  /** Hook to trap keyboard focus within a container when open=true. */
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement;

    const container = containerRef?.current;
    if (!container) return;

    // Ensure container can be focused if it has no focusable children.
    if (!container.hasAttribute("tabindex")) {
      container.setAttribute("tabindex", "-1");
    }

    // Initial focus
    const focusTarget = initialFocusRef?.current || getFocusableElements(container)[0] || container;
    // Defer to next tick to avoid React timing issues.
    setTimeout(() => focusTarget?.focus?.(), 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || active === container) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    const onFocusIn = (e) => {
      // If focus escapes, bring it back.
      if (!container.contains(e.target)) {
        const focusable = getFocusableElements(container);
        (focusable[0] || container).focus();
      }
    };

    const onMouseDown = (e) => {
      if (allowOutsideClick) return;
      // If click occurs outside the container, keep focus within.
      if (!container.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        const focusable = getFocusableElements(container);
        (focusable[0] || container).focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("mousedown", onMouseDown, true);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("mousedown", onMouseDown, true);

      // Restore focus to element that was focused before opening.
      const prev = lastFocusedRef.current;
      if (prev && typeof prev.focus === "function") {
        setTimeout(() => prev.focus(), 0);
      }
    };
  }, [open, containerRef, initialFocusRef, onEscape, allowOutsideClick]);
}

