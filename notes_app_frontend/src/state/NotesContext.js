import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createNoteDraft, normalizeTags } from "../utils/notes";
import { useLocalStorageState } from "../utils/useLocalStorageState";
import { apiFetch, getApiBaseUrl } from "../services/apiClient";
import { useToast } from "../components/ui/ToastProvider";

const NotesContext = createContext(null);

function deriveAllTags(notes) {
  const s = new Set();
  for (const n of notes) for (const t of n.tags || []) s.add(t);
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

function toUserFacingApiError(err) {
  const code = err?.code || "";
  if (code === "NO_API_BASE") return null; // not an error; it's local mode
  if (code === "TIMEOUT") return "API timeout. Using local notes for now.";
  if (code === "NETWORK_ERROR") return "API unreachable. Using local notes for now.";
  if (code === "HTTP_ERROR") return "API request failed. Using local notes for now.";
  return "API error. Using local notes for now.";
}

/**
 * Best-effort detection of API mode:
 * - If REACT_APP_API_BASE or REACT_APP_BACKEND_URL is present, we default to API mode
 * - Otherwise default to local mode
 *
 * NOTE: We keep localStorage persistence intact always, and gracefully fall back to local
 * on API failures.
 */
function computeInitialApiMode() {
  const base = getApiBaseUrl();
  return !!base;
}

/**
 * Minimal remote adapter.
 * If your backend implements different paths, update only these functions.
 */
async function remoteListNotes() {
  return apiFetch("/notes", { method: "GET", timeoutMs: 6500 });
}
async function remoteCreateNote(payload) {
  return apiFetch("/notes", { method: "POST", body: JSON.stringify(payload), timeoutMs: 6500 });
}
async function remoteUpdateNote(id, payload) {
  return apiFetch(`/notes/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(payload), timeoutMs: 6500 });
}
async function remoteDeleteNote(id) {
  return apiFetch(`/notes/${encodeURIComponent(id)}`, { method: "DELETE", timeoutMs: 6500 });
}
async function remoteClearAllNotes() {
  // Optional backend endpoint. If missing, we'll fall back to local clear only.
  return apiFetch("/notes", { method: "DELETE", timeoutMs: 6500 });
}

/**
 * Provides note storage and actions.
 * Uses localStorage persistence; can optionally seed demo notes if enabled.
 * When API mode is enabled (via REACT_APP_API_BASE/REACT_APP_BACKEND_URL), attempts
 * to read/write to backend first, and falls back to local storage on failures.
 */
// PUBLIC_INTERFACE
export function NotesProvider({ children, demoLoader }) {
  const toast = useToast();
  const [notes, setNotes] = useLocalStorageState("sno.notes", []);
  const [hydrated, setHydrated] = useState(false);

  // API mode is auto-enabled only if env base URL is present.
  // Users can still work offline because all mutations also update localStorage.
  const [apiModeEnabled] = useState(() => computeInitialApiMode());
  const apiFailureCountRef = useRef(0);
  const lastToastAtRef = useRef(0);

  const storageMode = apiModeEnabled ? "api" : "local";

  const maybeToastApiFailure = useCallback(
    (err, { title = "API mode", dedupeWindowMs = 7000 } = {}) => {
      if (!apiModeEnabled) return;
      const msg = toUserFacingApiError(err);
      if (!msg) return;

      const now = Date.now();
      if (now - lastToastAtRef.current < dedupeWindowMs) return;
      lastToastAtRef.current = now;

      toast.showToast({
        title,
        message: msg,
        tone: "warning",
        durationMs: 4800,
      });
    },
    [apiModeEnabled, toast]
  );

  const syncFromApiIfPossible = useCallback(async () => {
    if (!apiModeEnabled) return false;
    try {
      const res = await remoteListNotes();
      // Accept either {notes:[...]} or [...] as response shapes.
      const list = Array.isArray(res) ? res : Array.isArray(res?.notes) ? res.notes : null;
      if (!Array.isArray(list)) throw new Error("Unexpected /notes response shape.");
      setNotes(list);
      apiFailureCountRef.current = 0;
      return true;
    } catch (e) {
      apiFailureCountRef.current += 1;
      maybeToastApiFailure(e, { title: "API sync" });
      return false;
    }
  }, [apiModeEnabled, setNotes, maybeToastApiFailure]);

  // One-time demo load / API hydration.
  React.useEffect(() => {
    if (hydrated) return;

    // Mark hydrated immediately to avoid double-running.
    setHydrated(true);

    // If API mode is enabled, attempt to hydrate from API first.
    // If it fails, we keep local notes and continue.
    (async () => {
      const didApiHydrate = await syncFromApiIfPossible();
      if (didApiHydrate) return;

      // Local demo load: only when no notes exist.
      if (Array.isArray(notes) && notes.length > 0) return;

      try {
        const demoNotes = demoLoader?.();
        if (Array.isArray(demoNotes) && demoNotes.length > 0) {
          setNotes(demoNotes);
        }
      } catch {
        // ignore demo load failures
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const createNote = useCallback(
    (partial) => {
      const now = Date.now();
      const draft = createNoteDraft();
      const note = {
        ...draft,
        ...partial,
        tags: normalizeTags(partial?.tags ?? []),
        createdAt: now,
        updatedAt: now,
      };

      // Always write through to local first to preserve existing behavior and
      // guarantee offline/preview compatibility.
      setNotes((prev) => [note, ...(Array.isArray(prev) ? prev : [])]);

      // Best-effort remote write.
      if (apiModeEnabled) {
        (async () => {
          try {
            const res = await remoteCreateNote(note);
            apiFailureCountRef.current = 0;

            // If backend returns a canonical note (e.g., server-generated id), reconcile locally.
            const created = res?.note || res;
            if (created && typeof created === "object") {
              const remoteId = created.id;
              if (remoteId && remoteId !== note.id) {
                setNotes((prev) => {
                  const list = Array.isArray(prev) ? prev : [];
                  return list.map((n) => (n.id === note.id ? { ...n, ...created } : n));
                });
              } else {
                // Still merge any server fields (e.g., updatedAt normalization).
                setNotes((prev) => {
                  const list = Array.isArray(prev) ? prev : [];
                  return list.map((n) => (n.id === note.id ? { ...n, ...created } : n));
                });
              }
            }
          } catch (e) {
            apiFailureCountRef.current += 1;
            maybeToastApiFailure(e, { title: "API save" });
            // graceful fallback: local already persisted
          }
        })();
      }

      return note;
    },
    [apiModeEnabled, setNotes, maybeToastApiFailure]
  );

  const updateNote = useCallback(
    (id, patch) => {
      const now = Date.now();

      // Update locally first.
      setNotes((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((n) => {
          if (n.id !== id) return n;
          return {
            ...n,
            ...patch,
            tags: patch?.tags != null ? normalizeTags(patch.tags) : n.tags || [],
            updatedAt: now,
          };
        });
      });

      if (apiModeEnabled) {
        (async () => {
          try {
            const payload = {
              ...patch,
              tags: patch?.tags != null ? normalizeTags(patch.tags) : undefined,
              updatedAt: now,
            };
            const res = await remoteUpdateNote(id, payload);
            apiFailureCountRef.current = 0;

            // Merge any returned note fields
            const updated = res?.note || res;
            if (updated && typeof updated === "object") {
              setNotes((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                return list.map((n) => (n.id === id ? { ...n, ...updated } : n));
              });
            }
          } catch (e) {
            apiFailureCountRef.current += 1;
            maybeToastApiFailure(e, { title: "API update" });
            // graceful fallback: local already updated
          }
        })();
      }
    },
    [apiModeEnabled, setNotes, maybeToastApiFailure]
  );

  const deleteNote = useCallback(
    (id) => {
      // Local first
      setNotes((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== id) : []));

      if (apiModeEnabled) {
        (async () => {
          try {
            await remoteDeleteNote(id);
            apiFailureCountRef.current = 0;
          } catch (e) {
            apiFailureCountRef.current += 1;
            maybeToastApiFailure(e, { title: "API delete" });
            // graceful fallback: local already deleted
          }
        })();
      }
    },
    [apiModeEnabled, setNotes, maybeToastApiFailure]
  );

  const togglePinned = useCallback(
    (id) => {
      // Local first; mirror to API via update
      setNotes((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n));
      });

      if (apiModeEnabled) {
        // Find latest value (best effort)
        const list = Array.isArray(notes) ? notes : [];
        const current = list.find((n) => n.id === id);
        const nextPinned = !current?.pinned;

        (async () => {
          try {
            await remoteUpdateNote(id, { pinned: nextPinned, updatedAt: Date.now() });
            apiFailureCountRef.current = 0;
          } catch (e) {
            apiFailureCountRef.current += 1;
            maybeToastApiFailure(e, { title: "API update" });
          }
        })();
      }
    },
    [apiModeEnabled, notes, setNotes, maybeToastApiFailure]
  );

  const clearAllNotes = useCallback(() => {
    setNotes([]);

    if (apiModeEnabled) {
      (async () => {
        try {
          await remoteClearAllNotes();
          apiFailureCountRef.current = 0;
        } catch (e) {
          apiFailureCountRef.current += 1;
          maybeToastApiFailure(e, { title: "API clear" });
          // graceful fallback: local already cleared
        }
      })();
    }
  }, [apiModeEnabled, setNotes, maybeToastApiFailure]);

  const getNoteById = useCallback(
    (id) => {
      const list = Array.isArray(notes) ? notes : [];
      return list.find((n) => n.id === id) || null;
    },
    [notes]
  );

  const allTags = useMemo(() => deriveAllTags(Array.isArray(notes) ? notes : []), [notes]);

  const value = useMemo(() => {
    return {
      notes: Array.isArray(notes) ? notes : [],
      allTags,
      hydrated,
      storageMode,
      apiModeEnabled,
      createNote,
      updateNote,
      deleteNote,
      togglePinned,
      clearAllNotes,
      getNoteById,
    };
  }, [notes, allTags, hydrated, storageMode, apiModeEnabled, createNote, updateNote, deleteNote, togglePinned, clearAllNotes, getNoteById]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

// PUBLIC_INTERFACE
export function useNotes() {
  /** Hook to access notes store. */
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
