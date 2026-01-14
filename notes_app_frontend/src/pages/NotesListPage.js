import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotes } from "../state/NotesContext";
import { filterNotes, NOTE_COLORS, sortNotes } from "../utils/notes";
import { useDebouncedValue } from "../utils/useDebouncedValue";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { TagChip } from "../components/ui/TagChip";
import { NoteCard } from "../components/notes/NoteCard";
import { useSettings } from "../state/SettingsContext";

// PUBLIC_INTERFACE
export function NotesListPage() {
  const nav = useNavigate();
  const { notes, hydrated, togglePinned } = useNotes();
  const settings = useSettings();
  const [params, setParams] = useSearchParams();

  const tag = params.get("tag") || "";
  const color = params.get("c") || "";

  // Keep local input state for immediate typing responsiveness; sync URL via debounce.
  const [queryInput, setQueryInput] = useState(params.get("q") || "");
  const debouncedQuery = useDebouncedValue(queryInput, 250);

  const [priority, setPriority] = useState(params.get("p") || "");
  const [sortKey, setSortKey] = useState(params.get("sort") || "updated");

  // Keyboard shortcut: "P" toggles pinned for the currently "selected" note.
  // We track selection via click/focus on cards.
  const selectedNoteIdRef = useRef("");

  // Ensure local state stays in sync when user navigates back/forward or sidebar changes params.
  useEffect(() => {
    setQueryInput(params.get("q") || "");
    setPriority(params.get("p") || "");
    setSortKey(params.get("sort") || "updated");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (!val) next.delete(key);
    else next.set(key, val);
    setParams(next);
  };

  // Debounced URL updates for q only.
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    setParam("q", trimmed ? debouncedQuery : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't hijack typing in fields.
      const target = e.target;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingTarget = tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable;
      if (isTypingTarget) return;

      // Pin/unpin: "p"
      if (e.key?.toLowerCase() === "p") {
        const id = selectedNoteIdRef.current;
        if (!id) return;
        e.preventDefault();
        togglePinned(id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePinned]);

  const filtered = useMemo(() => {
    // Color filter is a small extension: filterNotes doesn't include color, so we apply it here to preserve existing architecture.
    const list = filterNotes(notes, { query: debouncedQuery, tag, priority });
    const colorFiltered = color ? list.filter((n) => String(n.color || "") === String(color)) : list;
    return sortNotes(colorFiltered, sortKey);
  }, [notes, debouncedQuery, tag, priority, sortKey, color]);

  const tagsForQuick = useMemo(() => {
    const s = new Set();
    for (const n of notes) for (const t of n.tags || []) s.add(t);
    return Array.from(s).slice(0, 10);
  }, [notes]);

  return (
    <section className="panel" aria-label="Notes list">
      <div className="panelHeader">
        <div className="rowWrap" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 className="h1">Your notes</h1>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              Search, filter, and sort your personal notes.
            </div>
          </div>
          <Button variant="primary" onClick={() => nav("/notes/new")}>
            Create
          </Button>
        </div>

        <div className="divider" />

        <div className="rowWrap">
          <div style={{ flex: 1, minWidth: 260 }}>
            <Input
              label="Search"
              value={queryInput}
              placeholder="Search title, content, tags…"
              onChange={(v) => {
                setQueryInput(v);
              }}
              rightSlot={
                <Button
                  variant="ghost"
                  onClick={() => {
                    setQueryInput("");
                    setParam("q", "");
                  }}
                  ariaLabel="Clear search"
                >
                  Clear
                </Button>
              }
            />
          </div>

          <div style={{ width: 180 }}>
            <Select
              label="Priority"
              value={priority}
              onChange={(v) => {
                setPriority(v);
                setParam("p", v);
              }}
              options={[
                { value: "", label: "Any" },
                { value: "low", label: "Low" },
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
              ]}
            />
          </div>

          <div style={{ width: 180 }}>
            <Select
              label="Color"
              value={color}
              onChange={(v) => setParam("c", v)}
              options={[
                { value: "", label: "Any" },
                ...NOTE_COLORS.map((c) => ({ value: c.id, label: c.label })),
              ]}
            />
          </div>

          <div style={{ width: 200 }}>
            <Select
              label="Sort"
              value={sortKey}
              onChange={(v) => {
                setSortKey(v);
                setParam("sort", v);
              }}
              options={[
                { value: "updated", label: "Recently updated" },
                { value: "created", label: "Recently created" },
                { value: "title", label: "Title (A–Z)" },
              ]}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }} className="rowWrap" aria-label="Keyboard shortcuts">
          <span className="chip" title="Pin/unpin selected note with keyboard">
            Pin <span className="kbd">P</span>
          </span>
          {color ? (
            <Button variant="ghost" onClick={() => setParam("c", "")} ariaLabel="Clear color filter">
              Clear color
            </Button>
          ) : null}
        </div>

        {tagsForQuick.length ? (
          <div style={{ marginTop: 10 }}>
            <div className="label">Quick tags</div>
            <div className="rowWrap">
              {tagsForQuick.map((t) => (
                <TagChip
                  key={t}
                  tag={t}
                  selected={t === tag}
                  onClick={() => setParam("tag", t === tag ? "" : t)}
                />
              ))}
              {tag ? (
                <Button variant="ghost" onClick={() => setParam("tag", "")} ariaLabel="Clear tag filter">
                  Clear tag
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="panelBody">
        {!hydrated ? (
          <div className="toast" role="status" aria-live="polite">
            Loading your notes…
          </div>
        ) : notes.length === 0 ? (
          <div className="toast" role="status" aria-live="polite">
            <div className="h2">No notes yet</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Create your first note to get started.
            </div>
            <div style={{ marginTop: 12 }}>
              <Button variant="primary" onClick={() => nav("/notes/new")}>
                Create a note
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="toast" role="status" aria-live="polite">
            <div className="h2">No matches</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Try changing your search or filters.
            </div>
          </div>
        ) : (
          <div className="gridCards" role="list" aria-label="Notes results">
            {filtered.map((n) => (
              <div
                key={n.id}
                role="listitem"
                onFocusCapture={() => {
                  selectedNoteIdRef.current = n.id;
                }}
                onMouseDownCapture={() => {
                  selectedNoteIdRef.current = n.id;
                }}
              >
                <NoteCard
                  note={n}
                  compact={settings.compactDensity}
                  onOpen={() => nav(`/notes/${n.id}`)}
                  onTogglePinned={() => togglePinned(n.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
