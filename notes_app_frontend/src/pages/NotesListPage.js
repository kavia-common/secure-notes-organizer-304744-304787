import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotes } from "../state/NotesContext";
import { filterNotes, NOTE_COLORS, noteSnippet, sortNotes } from "../utils/notes";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card } from "../components/ui/Card";
import { TagChip } from "../components/ui/TagChip";

// PUBLIC_INTERFACE
export function NotesListPage() {
  const nav = useNavigate();
  const { notes, hydrated, togglePinned } = useNotes();
  const [params, setParams] = useSearchParams();

  const [query, setQuery] = useState(params.get("q") || "");
  const tag = params.get("tag") || "";
  const [priority, setPriority] = useState(params.get("p") || "");
  const [sortKey, setSortKey] = useState(params.get("sort") || "updated");

  const filtered = useMemo(() => {
    const list = filterNotes(notes, { query, tag, priority });
    return sortNotes(list, sortKey);
  }, [notes, query, tag, priority, sortKey]);

  const tagsForQuick = useMemo(() => {
    const s = new Set();
    for (const n of notes) for (const t of n.tags || []) s.add(t);
    return Array.from(s).slice(0, 10);
  }, [notes]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    if (!val) next.delete(key);
    else next.set(key, val);
    setParams(next);
  };

  const colorMap = useMemo(() => {
    const m = new Map(NOTE_COLORS.map((c) => [c.id, c.swatch]));
    return m;
  }, []);

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
              value={query}
              placeholder="Search title, content, tags…"
              onChange={(v) => {
                setQuery(v);
                setParam("q", v.trim() ? v : "");
              }}
              rightSlot={
                <Button variant="ghost" onClick={() => { setQuery(""); setParam("q", ""); }}>
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
                <Button variant="ghost" onClick={() => setParam("tag", "")}>
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
              <Card
                key={n.id}
                ariaLabel={`Open note ${n.title || "Untitled"}`}
                onClick={() => nav(`/notes/${n.id}`)}
                style={{
                  background: `linear-gradient(180deg, ${colorMap.get(n.color) || "rgba(37, 99, 235, 0.10)"}, transparent 75%), var(--surface)`,
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <h3 className="cardTitle">{n.title || "Untitled"}</h3>
                  <Button
                    variant="ghost"
                    className="iconBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePinned(n.id);
                    }}
                    ariaLabel={n.pinned ? "Unpin note" : "Pin note"}
                  >
                    {n.pinned ? "★" : "☆"}
                  </Button>
                </div>

                <div className="cardMeta">
                  {n.priority ? <span className="chip chipAmber" style={{ marginRight: 8 }}>{n.priority}</span> : null}
                  <span className="muted">
                    Updated {new Date(n.updatedAt || n.createdAt).toLocaleString()}
                  </span>
                </div>

                <div style={{ marginTop: 10, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.35 }}>
                  {noteSnippet(n.content)}
                </div>

                {(n.tags || []).length ? (
                  <div className="rowWrap" style={{ marginTop: 10 }}>
                    {(n.tags || []).slice(0, 4).map((t) => (
                      <span key={t} className="chip">
                        #{t}
                      </span>
                    ))}
                    {(n.tags || []).length > 4 ? <span className="chip">+{(n.tags || []).length - 4}</span> : null}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
