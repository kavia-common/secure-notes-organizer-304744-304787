import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useNotes } from "../state/NotesContext";
import { createNoteDraft, normalizeTags, NOTE_COLORS, PRIORITIES, renderMarkdownToHtml } from "../utils/notes";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { TagChip } from "../components/ui/TagChip";
import { Textarea } from "../components/ui/Textarea";

/**
 * Editor page used for create or edit.
 */
// PUBLIC_INTERFACE
export function NoteEditorPage({ mode }) {
  const { noteId } = useParams();
  const nav = useNavigate();
  const { createNote, updateNote, getNoteById, allTags } = useNotes();

  const existing = mode === "edit" ? getNoteById(noteId) : null;

  const [draft, setDraft] = useState(() => {
    if (existing) return { ...existing, tags: existing.tags || [] };
    return createNoteDraft();
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Keep draft in sync when route changes (e.g., user navigates between notes quickly)
  useEffect(() => {
    if (mode === "edit") {
      if (!existing) return;
      setDraft({ ...existing, tags: existing.tags || [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, noteId]);

  const previewHtml = useMemo(() => renderMarkdownToHtml(draft.content || ""), [draft.content]);

  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const tagString = useMemo(() => (draft.tags || []).join(", "), [draft.tags]);

  const [tagInput, setTagInput] = useState("");
  const debouncedTagInput = useDebouncedValue(tagInput, 150);

  const selectedTags = useMemo(() => normalizeTags(draft.tags || []), [draft.tags]);

  const suggestedTags = useMemo(() => {
    const q = String(debouncedTagInput || "").trim().toLowerCase();
    const selected = new Set(selectedTags.map((t) => t.toLowerCase()));
    const candidates = (allTags || []).filter((t) => !selected.has(String(t).toLowerCase()));

    if (!q) return candidates.slice(0, 12);

    return candidates
      .filter((t) => String(t).toLowerCase().includes(q))
      .slice(0, 12);
  }, [allTags, debouncedTagInput, selectedTags]);

  const addTag = (raw) => {
    const next = normalizeTags([...(draft.tags || []), raw]);
    setField("tags", next);
  };

  const removeTag = (raw) => {
    const target = String(raw || "").trim().toLowerCase();
    const next = normalizeTags(draft.tags || []).filter((t) => String(t).toLowerCase() !== target);
    setField("tags", next);
  };

  const canSave = useMemo(() => {
    // allow empty content, but require at least a title or content
    const hasTitle = String(draft.title || "").trim().length > 0;
    const hasContent = String(draft.content || "").trim().length > 0;
    return hasTitle || hasContent;
  }, [draft.title, draft.content]);

  if (mode === "edit" && !existing) {
    return (
      <section className="panel">
        <div className="panelHeader">
          <h1 className="h1">Note not found</h1>
          <div className="muted" style={{ marginTop: 6 }}>
            You can create a new note instead.
          </div>
        </div>
        <div className="panelBody">
          <Button variant="primary" onClick={() => nav("/notes/new")}>
            Create a note
          </Button>
        </div>
      </section>
    );
  }

  const onSave = async () => {
    setError("");
    setSaving(true);
    try {
      const payload = {
        title: String(draft.title || "").trim(),
        content: String(draft.content || ""),
        tags: normalizeTags(draft.tags),
        color: draft.color,
        priority: draft.priority,
      };

      if (mode === "create") {
        const created = createNote(payload);
        nav(`/notes/${created.id}`);
      } else {
        updateNote(existing.id, payload);
        nav(`/notes/${existing.id}`);
      }
    } catch (e) {
      setError(e?.message || "Failed to save note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel" aria-label="Note editor">
      <div className="panelHeader">
        <div className="rowWrap" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 className="h1">{mode === "create" ? "New note" : "Edit note"}</h1>
            <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
              Markdown-friendly content supported (headings, **bold**, `code`, links).
            </div>
          </div>

          <div className="rowWrap">
            <Button variant="ghost" onClick={() => nav(-1)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={onSave} disabled={!canSave || saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>

        {error ? (
          <div
            className="toast"
            role="alert"
            aria-live="assertive"
            style={{ marginTop: 12, borderColor: "rgba(239, 68, 68, 0.35)" }}
          >
            <strong style={{ display: "block", marginBottom: 6 }}>Error</strong>
            <div className="muted">{error}</div>
          </div>
        ) : null}

        {!canSave ? (
          <div className="toast" role="status" aria-live="polite" style={{ marginTop: 12 }}>
            <strong style={{ display: "block", marginBottom: 6 }}>Nothing to save yet</strong>
            <div className="muted">Add a title or some content to enable saving.</div>
          </div>
        ) : null}
      </div>

      <div className="panelBody">
        <div className="rowWrap" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Input
              label="Title"
              value={draft.title}
              placeholder="Untitled note"
              onChange={(v) => setField("title", v)}
            />

            <div style={{ height: 10 }} />

            <Textarea
              label="Content"
              value={draft.content}
              placeholder="Write your note here…"
              onChange={(v) => setField("content", v)}
              rows={12}
            />

            <div style={{ height: 10 }} />

            <div className="panel" style={{ borderRadius: 18 }}>
              <div className="panelHeader">
                <div className="h2">Tags</div>
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  Add existing tags fast, or type new ones.
                </div>
              </div>
              <div className="panelBody">
                {(selectedTags || []).length ? (
                  <>
                    <div className="label">Selected</div>
                    <div className="rowWrap">
                      {(selectedTags || []).map((t) => (
                        <TagChip key={t} tag={t} selected onClick={() => removeTag(t)} />
                      ))}
                    </div>
                    <div className="divider" />
                  </>
                ) : (
                  <div className="muted" style={{ fontSize: 13 }}>
                    No tags yet.
                    <div style={{ marginTop: 6 }}>
                      Try <span className="kbd">work</span>, <span className="kbd">personal</span>,{" "}
                      <span className="kbd">ideas</span>.
                    </div>
                    <div className="divider" />
                  </div>
                )}

                <Input
                  label="Add tag"
                  value={tagInput}
                  placeholder="Type to search existing tags…"
                  onChange={(v) => setTagInput(v)}
                  rightSlot={
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const trimmed = String(tagInput || "").trim();
                        if (!trimmed) return;
                        addTag(trimmed);
                        setTagInput("");
                      }}
                      ariaLabel="Add tag"
                    >
                      Add
                    </Button>
                  }
                />

                {suggestedTags.length ? (
                  <div style={{ marginTop: 10 }}>
                    <div className="label">Suggestions</div>
                    <div className="rowWrap">
                      {suggestedTags.map((t) => (
                        <TagChip
                          key={t}
                          tag={t}
                          selected={false}
                          onClick={() => {
                            addTag(t);
                            setTagInput("");
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="divider" />

                <Input
                  label="Tags (comma-separated)"
                  value={tagString}
                  placeholder="work, personal, ideas"
                  onChange={(v) => setField("tags", normalizeTags(v))}
                />
              </div>
            </div>
          </div>

          <div style={{ width: 320, minWidth: 260 }}>
            <div className="panel" style={{ borderRadius: 18 }}>
              <div className="panelHeader">
                <div className="h2">Properties</div>
              </div>
              <div className="panelBody">
                <Select
                  label="Priority"
                  value={draft.priority}
                  onChange={(v) => setField("priority", v)}
                  options={PRIORITIES.map((p) => ({ value: p.id, label: p.label }))}
                />

                <div style={{ height: 10 }} />

                <Select
                  label="Color"
                  value={draft.color}
                  onChange={(v) => setField("color", v)}
                  options={NOTE_COLORS.map((c) => ({ value: c.id, label: c.label }))}
                />

                <div style={{ height: 12 }} />
                <div className="label">Preview</div>
                <div
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: 12,
                    background: "var(--surface)",
                    lineHeight: 1.5,
                    maxHeight: 240,
                    overflow: "auto",
                  }}
                  aria-label="Markdown preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
          Note: For security, avoid storing passwords or sensitive secrets directly in notes.
        </div>
      </div>
    </section>
  );
}
