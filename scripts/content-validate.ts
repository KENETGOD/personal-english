import { loadContent } from "./content-lib.ts";

const { rows, errors } = loadContent();
if (errors.length > 0) {
  console.error(`Content is invalid (${errors.length} problem(s)):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`Content OK: ${rows.length} items.`);
