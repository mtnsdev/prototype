/** Vogue × Palantir — luxury editorial + intelligence density (Tailwind-friendly hex/rgba). */
export const palette = {
  bg: {
    base: "#08080c",
    elevated: "#0c0c12",
    surface: "#101018",
    overlay: "#14141e",
  },
  border: {
    subtle: "rgba(255,255,255,0.03)",
    default: "rgba(255,255,255,0.06)",
    focus: "rgba(255,255,255,0.12)",
  },
  text: {
    primary: "#F5F0EB",
    secondary: "#9B9590",
    tertiary: "#6B6560",
    disabled: "#4A4540",
  },
  accent: {
    gold: "#C9A96E",
    goldMuted: "rgba(201,169,110,0.15)",
    goldSubtle: "rgba(201,169,110,0.08)",
  },
  status: {
    indexed: "#5B8A6E",
    processing: "#B8976E",
    error: "#A66B6B",
    notIndexed: "#6B6560",
  },
} as const;
