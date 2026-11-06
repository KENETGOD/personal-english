// Asserts WCAG 2.2 AA contrast for the design tokens declared in app/globals.css (both themes).
// Tokens are declared once as `light-dark(<light>, <dark>)` inside :root.
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);
const start = css.indexOf(":root {");
if (start < 0) throw new Error("Missing :root block in globals.css");
const root = css.slice(start, css.indexOf("\n}", start));

const themes = { light: {}, dark: {} };
const pair =
  /--([\w-]+):\s*light-dark\(\s*(oklch\([^)]*\))\s*,\s*(oklch\([^)]*\))\s*\)/g;
for (const m of root.matchAll(pair)) {
  themes.light[m[1]] = m[2];
  themes.dark[m[1]] = m[3];
}

const clip = (x) => Math.min(1, Math.max(0, x));

// oklch -> linear sRGB (Ottosson), gamut-clipped, returns WCAG relative luminance.
function luminance(value) {
  const m = value.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!m) throw new Error(`Unsupported color: ${value}`);
  const L = Number(m[1]);
  const h = (Number(m[3]) * Math.PI) / 180;
  const a = Number(m[2]) * Math.cos(h);
  const b = Number(m[2]) * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * s;
  return 0.2126 * clip(r) + 0.7152 * clip(g) + 0.0722 * clip(bl);
}

const ratio = (fg, bg) => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const modes = ["vocabulary", "reading", "writing", "speaking", "mix"];
// [foreground, background, minimum ratio, note]
const pairs = [
  ["foreground", "background", 4.5],
  ["card-foreground", "card", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["muted-foreground", "background", 4.5],
  ["muted-foreground", "card", 4.5],
  ["muted-foreground", "muted", 4.5],
  ["streak-foreground", "streak", 4.5],
  ["streak-shade", "background", 3, "streak icon on page"],
  ["primary-shade", "background", 4.5, "green text"],
  ["primary-shade", "card", 4.5, "green text"],
  ["primary-shade", "accent", 4.5, "selected chip"],
  ["accent-foreground", "accent", 4.5],
  ["destructive", "background", 4.5, "error text"],
  ["destructive-foreground", "destructive", 4.5],
  ["input", "background", 3, "input boundary"],
  ["input", "card", 3, "input boundary"],
  ["ring", "background", 3, "focus ring"],
  ["ring", "card", 3, "focus ring"],
  ...modes.map((m) => [`mode-${m}-foreground`, `mode-${m}`, 4.5]),
];

let failed = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log(`\n${name}`);
  for (const [fg, bg, min, note] of pairs) {
    if (!t[fg] || !t[bg]) throw new Error(`${name}: missing ${fg} or ${bg}`);
    const r = ratio(t[fg], t[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `${ok ? "ok  " : "FAIL"} ${r.toFixed(2).padStart(5)} (>=${min})  ${fg} on ${bg}${note ? ` [${note}]` : ""}`,
    );
  }
}
if (failed) {
  console.error(`\n${failed} contrast check(s) failed`);
  process.exit(1);
}
console.log("\nAll contrast checks passed");
