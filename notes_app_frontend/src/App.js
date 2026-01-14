import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import "./App.css";

import { NotesProvider } from "./state/NotesContext";
import { SettingsProvider } from "./state/SettingsContext";
import { ToastProvider } from "./components/ui/ToastProvider";
import { useFeatureFlags } from "./utils/featureFlags";
import { useLocalStorageState } from "./utils/useLocalStorageState";

import { AppShell } from "./components/layout/AppShell";
import { TopNav } from "./components/layout/TopNav";
import { Sidebar } from "./components/layout/Sidebar";

import { loadDemoDataIfEnabled } from "./utils/demoData";

const NotesListPage = React.lazy(() => import("./pages/NotesListPage").then((m) => ({ default: m.NotesListPage })));
const NoteEditorPage = React.lazy(() => import("./pages/NoteEditorPage").then((m) => ({ default: m.NoteEditorPage })));
const NoteDetailsPage = React.lazy(() => import("./pages/NoteDetailsPage").then((m) => ({ default: m.NoteDetailsPage })));
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })));

/**
 * Root application component.
 * Provides theming, global providers, and client-side routing.
 */
// PUBLIC_INTERFACE
function App() {
  const flags = useFeatureFlags();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useLocalStorageState("sno.theme", "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Apply theme to root element for CSS vars.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Close sidebar on route change (mobile UX).
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const themeLabel = theme === "light" ? "Light" : "Dark";

  const actions = useMemo(() => {
    return {
      onNewNote: () => navigate("/notes/new"),
      onGoHome: () => navigate("/notes"),
      onToggleSidebar: () => setSidebarOpen((v) => !v),
      onToggleTheme: () => setTheme((prev) => (prev === "light" ? "dark" : "light")),
    };
  }, [navigate, setTheme]);

  return (
    <ToastProvider>
      <SettingsProvider>
        <NotesProvider demoLoader={() => loadDemoDataIfEnabled(flags)}>
          <div className="App">
            <AppShell
              topNav={
                <TopNav
                  themeLabel={themeLabel}
                  onNewNote={actions.onNewNote}
                  onGoHome={actions.onGoHome}
                  onToggleSidebar={actions.onToggleSidebar}
                  onToggleTheme={actions.onToggleTheme}
                />
              }
              sidebar={<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
              sidebarOpen={sidebarOpen}
            >
              <Suspense
                fallback={
                  <div className="toast" role="status" aria-live="polite">
                    Loading…
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Navigate to="/notes" replace />} />
                  <Route path="/notes" element={<NotesListPage />} />
                  <Route path="/notes/new" element={<NoteEditorPage mode="create" />} />
                  <Route path="/notes/:noteId" element={<NoteDetailsPage />} />
                  <Route path="/notes/:noteId/edit" element={<NoteEditorPage mode="edit" />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </AppShell>
          </div>
        </NotesProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

export default App;
