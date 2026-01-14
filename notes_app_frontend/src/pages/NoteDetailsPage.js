import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotes } from "../state/NotesContext";
import { NOTE_COLORS, renderMarkdownToHtml } from "../utils/notes";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";

// PUBLIC_INTERFACE
export function NoteDetailsPage() {
  const { noteId } = useParams();
  const nav = useNavigate();
  const { getNoteById, deleteNote, togglePinned } = useNotes();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const note = getNoteById(noteId);

  const color = useMemo(() => {
    const c = NOTE_COLORS.find((x) => x.id === note?.color);
    return c?.swatch || "rgba(37, 99, 235, 0.10)";
  }, [note?.color]);

  const html = useMemo(() => renderMarkdownToHtml(note?.content || ""), [note?.content]);

  if (!note) {
    return (
      <section className="panel">
        <div className="panelHeader">
          <h1 className="h1">Note not found</h1>
          <div className="muted" style={{ marginTop: 6 }}>
            This note may have been deleted.
          </div>
        </div>
        <div className="panelBody">
          <Button variant="primary" onClick={() => nav("/notes")}>
            Back to notes
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="panel"
      aria-label="Note details"
      style={{
        background: `linear-gradient(180deg, ${color}, transparent 70%), var(--surface)`,
      }}
    >
      <div className="panelHeader">
        <div className="rowWrap" style={{ justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <h1 className="h1" style={{ marginBottom: 6 }}>
              {note.title || "Untitled"}
            </h1>
            <div className="muted" style={{ fontSize: 13 }}>
              Updated {new Date(note.updatedAt || note.createdAt).toLocaleString()}
            </div>
            <div className="rowWrap" style={{ marginTop: 10 }}>
              <span className="chip chipAmber">{note.priority}</span>
              {(note.tags || []).map((t) => (
                <span key={t} className="chip">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="rowWrap">
            <Button variant="ghost" onClick={() => nav("/notes")}>
              Back
            </Button>
            <Button
              variant="ghost"
              onClick={() => togglePinned(note.id)}
              ariaLabel={note.pinned ? "Unpin note" : "Pin note"}
            >
              {note.pinned ? "★ Pinned" : "☆ Pin"}
            </Button>
            <Button variant="primary" onClick={() => nav(`/notes/${note.id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="panelBody">
        <div
          aria-label="Note content"
          style={{ lineHeight: 1.55 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <Modal
        open={confirmOpen}
        title="Delete note?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                deleteNote(note.id);
                setConfirmOpen(false);
                nav("/notes");
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <div className="muted">
          This will permanently remove <strong>{note.title || "Untitled"}</strong>.
        </div>
      </Modal>
    </section>
  );
}
