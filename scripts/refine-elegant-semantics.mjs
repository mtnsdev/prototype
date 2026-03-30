/**
 * Map verbose token utilities → shadcn-style names (background, foreground, card, muted-…).
 * Run from repo root: node scripts/refine-elegant-semantics.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

const REPLACEMENTS = [
  [/text-text-primary/g, "text-foreground"],
  [/text-fg-subtle/g, "text-muted-foreground/75"],
  [/text-fg-muted/g, "text-muted-foreground"],
  [/text-fg-faint/g, "text-muted-foreground/55"],
  [/text-fg\/90/g, "text-foreground/90"],
  [/text-fg\b/g, "text-foreground"],
  [/text-chrome-icon-muted/g, "text-muted-foreground/65"],
  [/text-chrome-icon/g, "text-muted-foreground"],
  [/text-chrome-label/g, "text-muted-foreground"],

  [/bg-surface-base/g, "bg-background"],
  [/bg-surface-card-hover/g, "bg-accent"],
  [/bg-surface-card/g, "bg-card"],
  [/bg-surface-elevated/g, "bg-muted"],
  [/bg-surface-overlay/g, "bg-popover"],
  [/bg-surface-sunken/g, "bg-inset"],

  [/border-border-subtle/g, "border-border"],
  [/border-border-default/g, "border-input"],

  [/text-en-2xs/g, "text-2xs"],
  [/text-en-xs/g, "text-xs"],
  [/text-en-sm/g, "text-sm"],
  [/text-en-compact/g, "text-compact"],
  [/text-en-md/g, "text-base"],
  [/text-en-lg/g, "text-lg"],
  [/text-en-xl/g, "text-xl"],
  [/text-en-2xl/g, "text-2xl"],
  [/text-en-3xl/g, "text-3xl"],

  [/text-surface-base/g, "text-background"],
];

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts|css)$/.test(name) && !p.includes(".test.")) acc.push(p);
  }
  return acc;
}

let n = 0;
for (const file of walk(SRC)) {
  let s = fs.readFileSync(file, "utf8");
  const o = s;
  for (const [re, to] of REPLACEMENTS) s = s.replace(re, to);
  if (s !== o) {
    fs.writeFileSync(file, s);
    n++;
  }
}
console.log(`refine-elegant-semantics: updated ${n} files`);
