// Idempotent seed of content_items into the LOCAL Supabase stack only (docs/04 section 1, RF-CNT-02).
// Insert when the slug is new, update when the file version is higher, skip when equal.
// The service role key comes from `supabase status` of the local stack, never from .env files.
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { loadContent } from "./content-lib.ts";

const { rows, errors } = loadContent();
if (errors.length > 0) {
  console.error(
    `Content is invalid (${errors.length} problem(s)); nothing was seeded:`,
  );
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const status = Object.fromEntries(
  execSync("npx supabase status -o env", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  })
    .split(/\r?\n/)
    .flatMap((line) => {
      const m = line.match(/^([A-Z_]+)="?(.*?)"?$/);
      return m ? [[m[1], m[2]]] : [];
    }),
);
const url: string | undefined = status.API_URL;
const key: string | undefined = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
if (!url || !key) {
  console.error("Local Supabase is not running (npx supabase start).");
  process.exit(1);
}
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
  console.error(`Refusing to seed a non-local target: ${url}`);
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { data: existing, error: readError } = await db
  .from("content_items")
  .select("slug, version");
if (readError) throw readError;
const current = new Map(existing.map((r) => [r.slug, r.version]));

let inserted = 0;
let updated = 0;
let skipped = 0;
for (const row of rows) {
  const version = current.get(row.slug);
  if (version === undefined) {
    const { error } = await db.from("content_items").insert(row);
    if (error) throw error;
    inserted++;
  } else if (row.version > version) {
    const { error } = await db
      .from("content_items")
      .update(row)
      .eq("slug", row.slug);
    if (error) throw error;
    updated++;
  } else if (row.version < version) {
    console.error(
      `${row.slug}: file version ${row.version} is older than the database (${version}).`,
    );
    process.exit(1);
  } else {
    skipped++;
  }
}
console.log(
  `Seed done on ${url}: ${inserted} inserted, ${updated} updated, ${skipped} unchanged.`,
);
