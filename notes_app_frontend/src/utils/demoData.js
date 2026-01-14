import { createNoteDraft, normalizeTags } from "./notes";

/**
 * Demo data generator used for previews only when enabled by feature flag.
 */
function makeDemoNotes() {
  const n1 = createNoteDraft();
  n1.title = "Welcome to Secure Notes Organizer";
  n1.content =
    "# Quick Start\n" +
    "Use **New Note** to create a note. Add tags like `work`, `personal`, `ideas`.\n\n" +
    "Tips:\n" +
    "- Use search to filter quickly\n" +
    "- Pin important notes\n" +
    "- Sort by updated/created/title";
  n1.tags = normalizeTags(["welcome", "tips"]);
  n1.priority = "normal";
  n1.color = "blue";

  const n2 = createNoteDraft();
  n2.title = "Project: Ocean Professional UI";
  n2.content =
    "## Theme\n" +
    "Primary: **#2563EB** (blue)\n" +
    "Accent: **#F59E0B** (amber)\n\n" +
    "This app uses subtle shadows, rounded corners, and smooth transitions.";
  n2.tags = normalizeTags(["design", "ui"]);
  n2.priority = "low";
  n2.color = "amber";

  const n3 = createNoteDraft();
  n3.title = "Checklist";
  n3.content =
    "- [ ] Draft plan\n" +
    "- [ ] Write notes\n" +
    "- [ ] Review\n\n" +
    "Remember: store secrets outside notes, and use a password manager.";
  n3.tags = normalizeTags(["personal", "todo"]);
  n3.priority = "high";
  n3.color = "mint";
  n3.pinned = true;

  return [n1, n2, n3].map((n, idx) => {
    const base = Date.now() - (idx + 1) * 1000 * 60 * 60;
    return { ...n, createdAt: base, updatedAt: base };
  });
}

// PUBLIC_INTERFACE
export function loadDemoDataIfEnabled(flags) {
  /** Returns demo notes if enabled via flags; otherwise returns null. */
  if (!flags?.demoData) return null;
  return makeDemoNotes();
}
