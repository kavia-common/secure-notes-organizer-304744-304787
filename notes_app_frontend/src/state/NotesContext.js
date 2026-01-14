import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createNoteDraft, normalizeTags } from "../utils/notes";
import { useLocalStorageState } from "../utils/useLocalStorageState";

const NotesContext = createContext(null);

function deriveAllTags(notes) {
  const s = new Set();
  for (const n of notes) for (const t of n.tags || []) s.add(t);
  return Array.from(s).sort((a, b) => a.localeCompare(b));
}

/**
 * Provides note storage and actions.
 * Uses localStorage persistence; can optionally seed demo notes if enabled.
 */
// PUBLIC_INTERFACE
export function NotesProvider({ children, demoLoader }) {
  const [notes, setNotes] = useLocalStorageState("sno.notes", []);
  const [hydrated, setHydrated] = useState(false);

  // One-time demo load: only when no notes exist.
  React.useEffect(() => {
    if (hydrated) return;
    setHydrated(true);

    if (Array.isArray(notes) && notes.length > 0) return;

    try {
      const demoNotes = demoLoader?.();
      if (Array.isArray(demoNotes) && demoNotes.length > 0) {
        setNotes(demoNotes);
      }
    } catch {
      // ignore demo load failures
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const createNote = useCallback((partial) => {
    const now = Date.now();
    const draft = createNoteDraft();
    const note = {
      ...draft,
      ...partial,
      tags: normalizeTags(partial?.tags ?? []),
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [note, ...(Array.isArray(prev) ? prev : [])]);
    return note;
  }, [setNotes]);

  const updateNote = useCallback((id, patch) => {
    const now = Date.now();
    setNotes((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          ...patch,
          tags: patch?.tags != null ? normalizeTags(patch.tags) : (n.tags || []),
          updatedAt: now,
        };
      });
    });
  }, [setNotes]);

  const deleteNote = useCallback((id) => {
    setNotes((prev) => (Array.isArray(prev) ? prev.filter((n) => n.id !== id) : []));
  }, [setNotes]);

  const togglePinned = useCallback((id) => {
    setNotes((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n));
    });
  }, [setNotes]);

  const clearAllNotes = useCallback(() => {
    setNotes([]);
  }, [setNotes]);

  const getNoteById = useCallback((id) => {
    const list = Array.isArray(notes) ? notes : [];
    return list.find((n) => n.id === id) || null;
  }, [notes]);

  const allTags = useMemo(() => deriveAllTags(Array.isArray(notes) ? notes : []), [notes]);

  const value = useMemo(() => {
    return {
      notes: Array.isArray(notes) ? notes : [],
      allTags,
      hydrated,
      createNote,
      updateNote,
      deleteNote,
      togglePinned,
      clearAllNotes,
      getNoteById,
    };
  }, [notes, allTags, hydrated, createNote, updateNote, deleteNote, togglePinned, clearAllNotes, getNoteById]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

// PUBLIC_INTERFACE
export function useNotes() {
  /** Hook to access notes store. */
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
