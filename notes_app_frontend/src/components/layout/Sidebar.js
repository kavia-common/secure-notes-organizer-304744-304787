import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotes } from "../../state/NotesContext";
import { useFeatureFlags } from "../../utils/featureFlags";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

/**
 * Sidebar: tags list, pinned shortcut, and local-only info.
 */
// PUBLIC_INTERFACE
export function Sidebar({ open, onClose }) {
  const { allTags, clearAllNotes } = useNotes();
  const flags = useFeatureFlags();
  const nav = useNavigate();
  const loc = useLocation();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const currentTag = useMemo(() => {
    const params = new URLSearchParams(loc.search);
    return params.get("tag") || "";
  }, [loc.search]);

  const setTag = (tag) => {
    const params = new URLSearchParams(loc.search);
    if (tag) params.set("tag", tag);
    else params.delete("tag");
    nav(`/notes?${params.toString()}`);
  };

  return (
    <aside className="sidebar" aria-label="Sidebar menu" aria-hidden={!open && window.innerWidth < 960}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="h2">Filters</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            Organize by tag & priority
          </div>
        </div>
        <Button variant="ghost" className="iconBtn" onClick={onClose} ariaLabel="Close menu">
          ×
        </Button>
      </div>

      <div className="divider" />

      <div className="rowWrap" style={{ justifyContent: "space-between" }}>
        <Button variant="ghost" onClick={() => nav("/notes")}>
          All notes
        </Button>
        <Button variant="ghost" onClick={() => setTag("")} ariaLabel="Clear tag filter">
          Clear tag
        </Button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="label">Tags</div>
        {allTags.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>
            No tags yet. Add tags in the editor.
          </div>
        ) : (
          <div className="rowWrap">
            {allTags.map((t) => (
              <button
                key={t}
                className={`chip ${t === currentTag ? "chipAmber" : ""}`}
                onClick={() => setTag(t)}
                aria-pressed={t === currentTag}
                title={`Filter by ${t}`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="divider" />

      <div>
        <div className="label">About</div>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.4 }}>
          Notes are stored locally in your browser (localStorage). Configure{" "}
          <span className="kbd">REACT_APP_API_BASE</span> to connect to a backend later.
        </div>
        {flags.demoData ? (
          <div style={{ marginTop: 10 }} className="chip chipAmber">
            Demo data enabled
          </div>
        ) : (
          <div style={{ marginTop: 10 }} className="chip">
            Local-only mode
          </div>
        )}
      </div>

      <div className="divider" />

      <Button variant="danger" onClick={() => setConfirmOpen(true)}>
        Clear all notes
      </Button>

      <Modal
        open={confirmOpen}
        title="Clear all notes?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                clearAllNotes();
                setConfirmOpen(false);
                nav("/notes");
              }}
            >
              Clear
            </Button>
          </>
        }
      >
        <div className="muted" style={{ lineHeight: 1.45 }}>
          This removes all notes from this browser profile. This action cannot be undone.
        </div>
      </Modal>
    </aside>
  );
}
