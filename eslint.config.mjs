import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["src/**/*.{tsx,jsx}"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\b(text|bg|border|ring|from|to|via|placeholder|caret|stroke|fill|divide)-(gray|slate)-/]',
          message:
            "Prefer design tokens (e.g. text-muted-foreground, border-border, bg-background) over Tailwind gray/slate scales.",
        },
      ],
    },
  },
]);

export default eslintConfig;
