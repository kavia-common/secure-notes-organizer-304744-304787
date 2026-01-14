import React, { memo, useMemo } from "react";
import { noteSnippet } from "../../utils/notes";
import { Button } from "../ui/Button";
import { NOTE_COLORS } from "../../utils/notes";

function getColorSwatch(colorId) {
  const c = NOTE_COLORS.find((x) => x.id === colorId);
  return c?.swatch || "rgba(37, 99, 235, 0.10)";
}

/**
 * Memoized card for a single note item.
 * Keeps list rendering fast by avoiding re-renders unless props change.
 */
function NoteCardImpl({ note, onOpen, onTogglePinned, compact }) {
  const bg = useMemo(() => {
    const swatch = getColorSwatch(note.color);
    return `linear-gradient(180deg, ${swatch}, transparent 75%), var(--surface)`;
  }, [note.color]);

  const densityClass = compact ? "cardCompact" : "";

  return (
    <button
      type="button"
      className={`card noteCard ${densityClass}`.trim()}
      onClick={onOpen}
      style={{ textAlign: "left", width: "100%", background: bg }}
      aria-label={`Open note ${note.title || "Untitled"}`}
    >
      <div className="cardBody">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h3 className="cardTitle">{note.title || "Untitled"}</h3>
          <Button
            type="button"
            variant="ghost"
            className="iconBtn"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinned?.();
            }}
            ariaLabel={`${note.pinned ? "Unpin" : "Pin"} note: ${note.title || "Untitled"}`}
          >
            {note.pinned ? "★" : "☆"}
          </Button>
        </div>

        <div className="cardMeta">
          {note.priority ? (
            <span className="chip chipAmber" style={{ marginRight: 8 }}>
              {note.priority}
            </span>
          ) : null}

          {/* Color label */}
          <span className="chip" title="Note color label">
            {String(note.color || "blue")}
          </span>

          <span className="muted" style={{ marginLeft: 8 }}>
            Updated {new Date(note.updatedAt || note.createdAt).toLocaleString()}
          </span>
        </div>

        <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.35 }}>
          {noteSnippet(note.content)}
        </div>

        {(note.tags || []).length ? (
          <div className="rowWrap" style={{ marginTop: 10 }}>
            {(note.tags || []).slice(0, 4).map((t) => (
              <span key={t} className="chip">
                #{t}
              </span>
            ))}
            {(note.tags || []).length > 4 ? <span className="chip">+{(note.tags || []).length - 4}</span> : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function propsAreEqual(prev, next) {
  // If we keep the note object referentially stable across unrelated updates, this is enough.
  // Our state updates create new objects only for the changed note.
  return prev.note === next.note && prev.compact === next.compact;
}

// PUBLIC_INTERFACE
export const NoteCard = memo(NoteCardImpl, propsAreEqual);
