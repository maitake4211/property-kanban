// ============================================================
// Pure utility functions (no Obsidian API dependency)
// ============================================================

/**
 * Parse YAML frontmatter from file content into a key-value record.
 * Strips surrounding quotes from values.
 */
export function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Strip YAML quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Update a single frontmatter field in file content string.
 * Returns the updated content, or null if no frontmatter block found.
 */
export function updateFrontmatterContent(
  content: string,
  field: string,
  value: string
): string | null {
  const match = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!match) return null;

  const lines = match[2].split("\n");
  let found = false;
  const quotedValue = quoteIfNeeded(value);

  for (let i = 0; i < lines.length; i++) {
    const colonIdx = lines[i].indexOf(":");
    if (colonIdx === -1) continue;
    const lineKey = lines[i].slice(0, colonIdx).trim();
    if (lineKey === field) {
      lines[i] = `${field}: ${quotedValue}`;
      found = true;
      break;
    }
  }

  if (!found) {
    lines.push(`${field}: ${quotedValue}`);
  }

  return match[1] + lines.join("\n") + match[3] + content.slice(match[0].length);
}

/**
 * Quote a YAML value if it contains special characters.
 * Wikilinks (`[[...]]`) must be quoted, otherwise YAML parses `[[X]]`
 * as a nested flow sequence rather than a string.
 */
export function quoteIfNeeded(value: string): string {
  if (
    value.includes(":") ||
    value.includes('"') ||
    value.includes("[") ||
    value.includes("]")
  ) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

/**
 * Extract the target note name from a wikilink value.
 * Handles `[[Name]]`, `[[path/Name]]`, `[[Name|alias]]`, `[[Name#heading]]`.
 * Returns the link path (before any alias/heading), or null if not a wikilink.
 */
export function parseWikiLink(value: string): string | null {
  if (!value) return null;
  const match = value.trim().match(/^\[\[(.+?)\]\]$/);
  if (!match) return null;
  let inner = match[1];
  const pipe = inner.indexOf("|");
  if (pipe !== -1) inner = inner.slice(0, pipe);
  const hash = inner.indexOf("#");
  if (hash !== -1) inner = inner.slice(0, hash);
  inner = inner.trim();
  return inner.length > 0 ? inner : null;
}

/**
 * Format a link target as a wikilink string (without YAML quoting).
 */
export function formatWikiLink(target: string): string {
  return `[[${target}]]`;
}

/**
 * Set a block-style YAML list field in frontmatter, replacing any existing
 * value (scalar or block) for that field. When `items` is empty the field is
 * removed entirely. Returns the updated content, or null if no frontmatter
 * block is found.
 */
export function setListField(
  content: string,
  field: string,
  items: string[]
): string | null {
  const match = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!match) return null;

  const lines = match[2].split("\n");
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(":");
    const key = colonIdx === -1 ? "" : line.slice(0, colonIdx).trim();
    const isTopLevel = !/^\s/.test(line) && !line.startsWith("-");
    if (key === field && isTopLevel) {
      // Skip this line and any following indented block/list lines.
      let j = i + 1;
      while (j < lines.length && /^\s+\S/.test(lines[j])) j++;
      i = j - 1;
      continue;
    }
    out.push(line);
  }

  if (items.length > 0) {
    out.push(`${field}:`);
    for (const item of items) {
      out.push(`  - ${quoteIfNeeded(item)}`);
    }
  }

  return match[1] + out.join("\n") + match[3] + content.slice(match[0].length);
}

/**
 * Remove a single frontmatter field (scalar or block). Returns the updated
 * content, or null if no frontmatter block is found.
 */
export function removeFrontmatterField(
  content: string,
  field: string
): string | null {
  return setListField(content, field, []);
}

/**
 * Build a frontmatter string from the given properties.
 */
export function buildFrontmatter(props: {
  statusField: string;
  status: string;
  categoryField?: string;
  category?: string;
  projectField?: string;
  project?: string;
  createdField: string;
  createdDate: string;
  deadlineField: string;
  deadline?: string;
}): string {
  const lines: string[] = ["---"];
  lines.push(`${props.statusField}: ${quoteIfNeeded(props.status)}`);

  if (props.categoryField && props.category) {
    lines.push(`${props.categoryField}: ${props.category}`);
  }
  if (props.projectField && props.project) {
    lines.push(`${props.projectField}: ${props.project}`);
  }

  lines.push(`${props.createdField}: ${props.createdDate}`);
  lines.push(`${props.deadlineField}: ${props.deadline ?? ""}`);
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

/**
 * Collect all unique frontmatter field names from a file map.
 */
export function collectAllFields(
  fileMap: Map<string, Record<string, string>>
): string[] {
  const fields = new Set<string>();
  for (const fm of fileMap.values()) {
    for (const key of Object.keys(fm)) {
      if (key) fields.add(key);
    }
  }
  return [...fields].sort();
}

/**
 * Resolve column list for a field from file data, respecting saved order.
 * - Filters out "Invalid date" values
 * - If savedOrder is provided, uses that order and appends new values
 * - Otherwise returns sorted unique values
 */
export function resolveAllColumns(
  fileMap: Map<string, Record<string, string>>,
  field: string,
  savedOrder?: string[]
): string[] {
  const valuesFromFiles = new Set<string>();
  for (const fm of fileMap.values()) {
    const v = fm[field];
    if (v && v !== "Invalid date") {
      valuesFromFiles.add(v);
    }
  }

  if (savedOrder && savedOrder.length > 0) {
    const result = savedOrder.filter((c) => valuesFromFiles.has(c));
    for (const v of valuesFromFiles) {
      if (!result.includes(v)) {
        result.push(v);
      }
    }
    return result;
  }

  return [...valuesFromFiles].sort();
}

/**
 * Check if a column is collapsed for a given field.
 */
export function isColumnHidden(
  hiddenColumns: Record<string, string[]>,
  field: string,
  col: string
): boolean {
  return (hiddenColumns[field] ?? []).includes(col);
}

/**
 * Assign cards to a column based on their status frontmatter field.
 */
export function getCardsForColumn(
  fileMap: Map<string, Record<string, string>>,
  colName: string,
  statusField: string,
  firstColumn: string
): { path: string; name: string; fm: Record<string, string> }[] {
  const cards: { path: string; name: string; fm: Record<string, string> }[] = [];
  for (const [path, fm] of fileMap) {
    const status = fm[statusField] as string | undefined;
    if (status === colName || (!status && colName === firstColumn)) {
      const segments = path.split("/");
      const name = segments[segments.length - 1].replace(/\.md$/, "");
      cards.push({ path, name, fm });
    }
  }
  return cards;
}
