// Loads and validates content/**/*.json (docs/04 sections 1-2). Run through node's native TS support.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  contentSchemas,
  toRow,
  type ContentRow,
  type ContentType,
} from "../content/schemas/index.ts";

// Directory/file -> content type (docs/04 section 2).
const FILE_TYPES: [RegExp, ContentType][] = [
  [/^vocabulary\/[^/]+\.json$/, "vocab"],
  [/^reading\/[^/]+\.json$/, "reading"],
  [/^writing\/[^/]+\.json$/, "writing_prompt"],
  [/^speaking\/scenarios\.json$/, "scenario"],
  [/^speaking\/shadowing-sets\.json$/, "shadowing"],
  [/^speaking\/minimal-pairs\.json$/, "minimal_pairs"],
  [/^speaking\/free-talk-topics\.json$/, "free_talk"],
  [/^grammar\/[^/]+\.json$/, "grammar_lesson"],
];

export function typeForFile(relPath: string): ContentType | undefined {
  return FILE_TYPES.find(([re]) => re.test(relPath))?.[1];
}

function listJson(root: string, dir = ""): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) return e.name === "schemas" ? [] : listJson(root, rel);
    return e.name.endsWith(".json") ? [rel] : [];
  });
}

export function loadContent(root = join(process.cwd(), "content")) {
  const rows: ContentRow[] = [];
  const errors: string[] = [];
  const seen = new Map<string, string>();

  for (const rel of listJson(root).sort()) {
    const type = typeForFile(rel);
    if (!type) {
      errors.push(`${rel}: file is not in a known content location`);
      continue;
    }
    let items: unknown;
    try {
      items = JSON.parse(readFileSync(join(root, rel), "utf8"));
    } catch (e) {
      errors.push(`${rel}: invalid JSON (${(e as Error).message})`);
      continue;
    }
    if (!Array.isArray(items)) {
      errors.push(`${rel}: expected a JSON array of items`);
      continue;
    }
    items.forEach((item, i) => {
      const parsed = contentSchemas[type].safeParse(item);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          errors.push(`${rel}[${i}].${issue.path.join(".")}: ${issue.message}`);
        }
        return;
      }
      const row = toRow(type, parsed.data as Record<string, unknown>);
      const first = seen.get(row.slug);
      if (first)
        errors.push(
          `${rel}[${i}]: slug "${row.slug}" already used in ${first}`,
        );
      else seen.set(row.slug, `${rel}[${i}]`);
      rows.push(row);
    });
  }
  return { rows, errors };
}
