/**
 * One-shot codemod: map legacy hex / ad-hoc classes → design tokens (Tailwind @theme).
 * Run: node scripts/apply-design-tokens.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");

/** Longest / most specific first */
const REPLACEMENTS = [
  [/bg-\[#C9A96E\]\/15/gi, "bg-brand-cta/15"],
  [/bg-\[#C9A96E\]\/10/gi, "bg-brand-cta/10"],
  [/bg-\[#C9A96E\]\/20/gi, "bg-brand-cta/20"],
  [/border-\[#C9A96E\]\/20/gi, "border-brand-cta/20"],
  [/border-\[#C9A96E\]/gi, "border-brand-cta"],
  [/bg-\[#C9A96E\]/gi, "bg-brand-cta"],
  [/text-\[#C9A96E\]/gi, "text-brand-cta"],
  [/text-\[#0a0a0f\]/gi, "text-brand-cta-foreground"],
  [/bg-\[#D4B383\]/gi, "bg-brand-cta-hover"],
  [/hover:bg-\[#D4B383\]/gi, "hover:bg-brand-cta-hover"],
  [/bg-\[#AE8550\]/gi, "bg-brand-chat-user"],
  [/focus:ring-\[#AE8550\]/gi, "focus:ring-brand-chat-user"],
  [/ring-\[#AE8550\]/gi, "ring-brand-chat-user"],

  [/bg-\[#0C0C0C\]\/95/gi, "bg-surface-base/95"],
  [/bg-\[#0c0c0c\]\/95/gi, "bg-surface-base/95"],
  [/bg-\[#06060a\]\/65/gi, "bg-surface-base/65"],
  [/bg-\[#0c0c12\]\/95/gi, "bg-surface-overlay/95"],
  [/bg-\[#08080c\]\/92/gi, "bg-surface-sunken/92"],
  [/bg-\[#0a0a0f\]\/95/gi, "bg-surface-sunken/95"],
  [/bg-\[#0a0a0f\]\/80/gi, "bg-surface-sunken/80"],
  [/bg-\[#0a0a0f\]\/90/gi, "bg-surface-sunken/90"],

  [/bg-\[#0C0C0C\]/gi, "bg-surface-base"],
  [/bg-\[#0c0c0c\]/gi, "bg-surface-base"],
  [/bg-\[#06060a\]/gi, "bg-surface-base"],
  [/bg-\[#0a0a0b\]/gi, "bg-surface-base"],

  [/bg-\[#08080c\]/gi, "bg-surface-sunken"],
  [/bg-\[#0a0a0f\]/gi, "bg-surface-sunken"],
  [/bg-\[#0a0a10\]/gi, "bg-surface-sunken"],

  [/bg-\[#0c0c12\]/gi, "bg-surface-overlay"],
  [/bg-\[#0C0C12\]/gi, "bg-surface-overlay"],

  [/bg-\[#141414\]/gi, "bg-surface-elevated"],
  [/bg-\[#0e0e14\]/gi, "bg-surface-elevated"],
  [/bg-\[#0e0e12\]/gi, "bg-surface-elevated"],
  [/bg-\[#0E0E14\]/gi, "bg-surface-elevated"],

  [/bg-\[#161616\]/gi, "bg-surface-card"],
  [/bg-\[#1a1a1a\]/gi, "bg-surface-card-hover"],
  [/bg-\[#1A1A1A\]/gi, "bg-surface-card-hover"],
  [/bg-\[#1e1e1e\]/gi, "bg-surface-card-hover"],
  [/bg-\[#1E1E1E\]/gi, "bg-surface-card-hover"],

  [/text-\[#F5F5F5\]/gi, "text-text-primary"],
  [/text-\[#F5F0EB\]/gi, "text-text-primary"],
  [/text-\[#f5f5f5\]/gi, "text-text-primary"],

  [/text-\[#9B9590\]/gi, "text-chrome-label"],
  [/text-\[#9b9590\]/gi, "text-chrome-label"],
  [/text-\[#6B6560\]/gi, "text-chrome-icon"],
  [/text-\[#6b6560\]/gi, "text-chrome-icon"],
  [/text-\[#4A4540\]/gi, "text-chrome-icon-muted"],
  [/text-\[#4a4540\]/gi, "text-chrome-icon-muted"],

  [/text-\[#C87A7A\]/gi, "text-[var(--color-error)]"],
  [/text-\[#D4A574\]/gi, "text-[var(--color-warning)]"],
  [/text-amber-400/g, "text-[var(--color-warning)]"],

  [/border-\[rgba\(255,255,255,0\.03\)\]/g, "border-border-subtle"],
  [/border-\[rgba\(255,255,255,0\.04\)\]/g, "border-border-subtle"],
  [/border-\[rgba\(255,255,255,0\.06\)\]/g, "border-border-subtle"],
  [/border-\[rgba\(255,255,255,0\.08\)\]/g, "border-border-subtle"],
  [/border-\[rgba\(255,255,255,0\.1\)\]/g, "border-border-default"],
  [/border-\[rgba\(255,255,255,0\.12\)\]/g, "border-border-default"],
  [/border-\[rgba\(255,255,255,0\.15\)\]/g, "border-border-strong"],
  [/border-\[rgba\(201,169,110,0\.35\)\]/g, "border-brand-cta/35"],
  [/border-\[rgba\(201,169,110,0\.2\)\]/g, "border-brand-cta/20"],

  [/border-white\/10/g, "border-border-default"],
  [/border-white\/\[0\.06\]/g, "border-border-subtle"],
  [/border-white\/\[0\.08\]/g, "border-border-subtle"],
  [/border-white\/\[0\.1\]/g, "border-border-default"],

  [/text-\[10px\]/g, "text-en-2xs"],
  [/text-\[11px\]/g, "text-en-xs"],
  [/text-\[12px\]/g, "text-en-sm"],
  [/text-\[13px\]/g, "text-en-compact"],
  [/text-\[14px\]/g, "text-en-md"],
  [/text-\[15px\]/g, "text-en-md"],
  [/text-\[16px\]/g, "text-en-lg"],
  [/text-\[18px\]/g, "text-en-lg"],
  [/text-\[20px\]/g, "text-en-xl"],
  [/text-\[24px\]/g, "text-en-2xl"],
  [/text-\[28px\]/g, "text-en-3xl"],
  [/text-\[32px\]/g, "text-en-3xl"],

  [/placeholder:text-\[#4A4540\]/gi, "placeholder:text-chrome-icon-muted"],
  [/placeholder:text-\[#4a4540\]/gi, "placeholder:text-chrome-icon-muted"],
  [/placeholder:text-\[rgba\(245,245,245,0\.4\)\]/g, "placeholder:text-fg-subtle"],
  [/placeholder:text-\[rgba\(245,245,245,0\.45\)\]/g, "placeholder:text-fg-subtle"],
  [/placeholder:text-\[rgba\(245,245,245,0\.5\)\]/g, "placeholder:text-fg-muted"],

  [/text-\[rgba\(245,245,245,0\.88\)\]/g, "text-fg/90"],
  [/text-\[rgba\(245,245,245,0\.8\)\]/g, "text-fg-muted"],
  [/text-\[rgba\(245,245,245,0\.75\)\]/g, "text-fg-muted"],
  [/text-\[rgba\(245,245,245,0\.7\)\]/g, "text-fg-muted"],
  [/text-\[rgba\(245,245,245,0\.64\)\]/g, "text-fg-muted"],
  [/text-\[rgba\(245,245,245,0\.6\)\]/g, "text-fg-muted"],
  [/text-\[rgba\(245,245,245,0\.55\)\]/g, "text-fg-subtle"],
  [/text-\[rgba\(245,245,245,0\.5\)\]/g, "text-fg-subtle"],
  [/text-\[rgba\(245,245,245,0\.45\)\]/g, "text-fg-subtle"],
  [/text-\[rgba\(245,245,245,0\.4\)\]/g, "text-fg-faint"],
  [/text-\[rgba\(245,245,245,0\.35\)\]/g, "text-fg-faint"],
  [/text-\[rgba\(245,245,245,0\.28\)\]/g, "text-fg-faint"],
  [/text-\[rgba\(245,245,245,0\.25\)\]/g, "text-fg-faint"],

  [/ring-\[rgba\(255,255,255,0\.2\)\]/g, "ring-border-default"],
  [/focus:ring-1 focus:ring-\[rgba\(201,169,110,0\.2\)\]/g, "focus:ring-1 focus:ring-brand-cta/20"],
  [/focus:ring-\[rgba\(201,169,110,0\.2\)\]/g, "focus:ring-brand-cta/20"],
  [/focus:border-\[rgba\(201,169,110,0\.35\)\]/g, "focus:border-brand-cta/35"],
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

let files = 0;
let changes = 0;
for (const file of walk(SRC)) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  for (const [re, to] of REPLACEMENTS) {
    s = s.replace(re, to);
  }
  if (s !== orig) {
    fs.writeFileSync(file, s);
    files++;
    changes++;
  }
}
console.log(`Updated ${files} files (apply-design-tokens)`);
