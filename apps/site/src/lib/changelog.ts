// Build-time parser for the Keep-a-Changelog formatted packages/ui/CHANGELOG.md.
// Output items are pre-rendered safe HTML (inline code / strong / links only).

export type ReleaseSectionKind =
  | "added"
  | "changed"
  | "deprecated"
  | "removed"
  | "fixed"
  | "security"
  | "other";

export interface ReleaseSection {
  kind: ReleaseSectionKind;
  label: string;
  items: string[];
}

export interface Release {
  version: string;
  date: string | null;
  sections: ReleaseSection[];
}

const KNOWN_KINDS = ["added", "changed", "deprecated", "removed", "fixed", "security"] as const;

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const isSafeHref = (href: string) =>
  /^https?:\/\//.test(href) || href.startsWith("/") || href.startsWith("#");

const renderInline = (value: string) => {
  let html = escapeHtml(value.trim());
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, text, href) =>
    isSafeHref(href) ? `<a href="${href}">${text}</a>` : match,
  );
  return html;
};

const sectionKind = (label: string): ReleaseSectionKind => {
  const kind = label.trim().toLowerCase();
  return (KNOWN_KINDS as readonly string[]).includes(kind)
    ? (kind as ReleaseSectionKind)
    : "other";
};

export function parseChangelog(markdown: string): Release[] {
  const releases: Release[] = [];
  let release: Release | null = null;
  let section: ReleaseSection | null = null;

  for (const line of markdown.split("\n")) {
    // "## 0.2.0 - 2026-06-11" or "## [0.2.0] - 2026-06-11" or "## Unreleased"
    const releaseMatch = line.match(
      /^##\s+\[?([^\]]+?)\]?(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?\s*$/,
    );
    if (releaseMatch) {
      release = { version: releaseMatch[1], date: releaseMatch[2] ?? null, sections: [] };
      section = null;
      releases.push(release);
      continue;
    }

    const sectionMatch = line.match(/^###\s+(.+?)\s*$/);
    if (sectionMatch && release) {
      section = { kind: sectionKind(sectionMatch[1]), label: sectionMatch[1].trim(), items: [] };
      release.sections.push(section);
      continue;
    }

    const itemMatch = line.match(/^[-*]\s+(.+)$/);
    if (itemMatch && release) {
      if (!section) {
        section = { kind: "other", label: "Notes", items: [] };
        release.sections.push(section);
      }
      section.items.push(renderInline(itemMatch[1]));
      continue;
    }

    // indented continuation of the previous list item
    if (section && section.items.length > 0 && /^\s{2,}\S/.test(line)) {
      section.items[section.items.length - 1] += ` ${renderInline(line)}`;
    }
  }

  return releases;
}
