export const NOTE_COLORS = [
  { id: "blue", label: "Blue", swatch: "rgba(37, 99, 235, 0.12)" },
  { id: "amber", label: "Amber", swatch: "rgba(245, 158, 11, 0.14)" },
  { id: "mint", label: "Mint", swatch: "rgba(16, 185, 129, 0.12)" },
  { id: "rose", label: "Rose", swatch: "rgba(244, 63, 94, 0.12)" },
  { id: "slate", label: "Slate", swatch: "rgba(100, 116, 139, 0.12)" },
];

export const PRIORITIES = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
];

// PUBLIC_INTERFACE
export function createNoteDraft() {
  /** Create a new note draft with defaults. */
  const now = Date.now();
  return {
    id: `n_${now}_${Math.random().toString(16).slice(2)}`,
    title: "",
    content: "",
    tags: [],
    color: "blue",
    priority: "normal",
    createdAt: now,
    updatedAt: now,
    pinned: false,
  };
}

// PUBLIC_INTERFACE
export function normalizeTags(tagsLike) {
  /** Normalize tags from array or comma-separated string. */
  if (Array.isArray(tagsLike)) {
    return [...new Set(tagsLike.map((t) => String(t).trim()).filter(Boolean))];
  }
  if (typeof tagsLike === "string") {
    return [...new Set(tagsLike.split(",").map((t) => t.trim()).filter(Boolean))];
  }
  return [];
}

// PUBLIC_INTERFACE
export function noteSnippet(content) {
  /** Create a short snippet for list view. */
  const s = String(content || "").replace(/\s+/g, " ").trim();
  return s.length > 140 ? `${s.slice(0, 140)}…` : s;
}

// PUBLIC_INTERFACE
export function sortNotes(notes, sortKey) {
  /** Sort notes by key with deterministic tie-breakers (stable across filters/search). */
  const list = [...notes];

  const byUpdated = (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0);
  const byCreated = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
  const byTitle = (a, b) =>
    String(a.title || "").localeCompare(String(b.title || ""), undefined, { sensitivity: "base" });

  // Stable tie-breaker: id (or createdAt) ensures deterministic ordering even when sort keys tie.
  const byId = (a, b) => String(a.id || "").localeCompare(String(b.id || ""));

  list.sort((a, b) => {
    // pinned first
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;

    let primary = 0;
    if (sortKey === "created") primary = byCreated(a, b);
    else if (sortKey === "title") primary = byTitle(a, b);
    else primary = byUpdated(a, b);

    if (primary !== 0) return primary;

    // Secondary tie-breakers for stability across filters:
    // - For title sort, fall back to updated date; otherwise fall back to title.
    const secondary = sortKey === "title" ? byUpdated(a, b) : byTitle(a, b);
    if (secondary !== 0) return secondary;

    return byId(a, b);
  });

  return list;
}

// PUBLIC_INTERFACE
export function filterNotes(notes, { query, tag, priority }) {
  /** Filter notes by free text, tag, and/or priority. */
  const q = String(query || "").trim().toLowerCase();
  const t = String(tag || "").trim();
  const p = String(priority || "").trim();

  return notes.filter((n) => {
    if (p && n.priority !== p) return false;
    if (t && !(n.tags || []).includes(t)) return false;
    if (!q) return true;

    const hay = `${n.title || ""}\n${n.content || ""}\n${(n.tags || []).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });
}

/**
 * Very small markdown-friendly renderer:
 * - Escapes HTML
 * - Converts lines starting with "#", "##", "###"
 * - Converts **bold** and `code`
 * - Converts links [text](url)
 */
function escapeHtml(s) {
  // Important: this is our primary XSS defense; everything starts escaped.
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeHttpUrl(url) {
  // Only allow http/https links. Disallow javascript:, data:, etc.
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function inlineMarkdown(s) {
  let out = escapeHtml(s);

  // Basic formatting after escaping is safe because we only inject known tags.
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/`(.+?)`/g, "<code>$1</code>");

  // Convert links but only if URL is safe.
  // Note: because content is escaped, $2 will not contain quotes or '<' etc. Still, we validate protocol.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text, url) => {
    if (!isSafeHttpUrl(url)) return `${text} (${url})`;
    const safeText = String(text || "");
    const safeUrl = String(url || "");
    return `<a href="${safeUrl}" target="_blank" rel="noreferrer noopener">${safeText}</a>`;
  });

  return out;
}

// PUBLIC_INTERFACE
export function renderMarkdownToHtml(markdown) {
  /** Convert a small subset of markdown to safe HTML (escaped) for display. */
  const lines = String(markdown || "").split("\n");
  const html = lines
    .map((line) => {
      const l = line.trimEnd();
      if (!l) return "<br/>";
      if (l.startsWith("### ")) return `<h3>${inlineMarkdown(l.slice(4))}</h3>`;
      if (l.startsWith("## ")) return `<h2>${inlineMarkdown(l.slice(3))}</h2>`;
      if (l.startsWith("# ")) return `<h1>${inlineMarkdown(l.slice(2))}</h1>`;
      return `<p>${inlineMarkdown(l)}</p>`;
    })
    .join("");
  return html;
}
