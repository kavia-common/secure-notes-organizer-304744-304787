import React from "react";
import { Button } from "../ui/Button";
import { useNotes } from "../../state/NotesContext";

/**
 * Top navigation: brand, mobile menu, New Note, theme toggle.
 */
// PUBLIC_INTERFACE
export function TopNav({ onToggleSidebar, onGoHome, onNewNote, onToggleTheme, themeLabel }) {
  const { storageMode } = useNotes();

  const isApi = storageMode === "api";
  const modeLabel = isApi ? "API Mode" : "Local Mode";

  return (
    <div className="topNavInner">
      <Button variant="ghost" className="iconBtn" onClick={onToggleSidebar} ariaLabel="Open menu">
        ≡
      </Button>

      <button
        className="btn btnGhost"
        onClick={onGoHome}
        aria-label="Go to notes home"
        style={{ paddingLeft: 8, paddingRight: 10 }}
      >
        <span className="brand" aria-hidden="true">
          <span className="brandMark" />
          <span>
            <div className="brandTitle">Secure Notes</div>
            <div className="brandSub">Organizer</div>
          </span>
        </span>
        <span className="srOnly">Secure Notes Organizer</span>
      </button>

      <div className="navSpacer" />

      <div className="row">
        <span
          className={`chip ${isApi ? "chipAmber" : ""}`}
          title={isApi ? "Using configured backend API" : "Using browser localStorage"}
        >
          {modeLabel}
        </span>

        <span className="chip" title="Keyboard tip">
          Tip <span className="kbd">Ctrl</span> <span className="kbd">K</span>
        </span>

        <Button variant="primary" onClick={onNewNote}>
          New Note
        </Button>

        <Button variant="ghost" onClick={onToggleTheme} ariaLabel="Toggle theme">
          {themeLabel === "Light" ? "Dark" : "Light"} mode
        </Button>
      </div>
    </div>
  );
}
