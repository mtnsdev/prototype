/** Enable light nature palette — mirrors globals.css tokens for reference. */
export const palette = {
  bg: {
    base: "#eceae4",
    elevated: "#f3f1eb",
    surface: "#f7f6f2",
    overlay: "#f7f6f2",
  },
  border: {
    subtle: "rgba(40, 48, 42, 0.09)",
    default: "rgba(40, 48, 42, 0.14)",
    focus: "rgba(58, 125, 86, 0.4)",
  },
  text: {
    primary: "#171512",
    secondary: "#403c36",
    tertiary: "#524c44",
    disabled: "#8a8378",
  },
  accent: {
    gold: "#c4923a",
    goldMuted: "rgba(196, 146, 58, 0.15)",
    goldSubtle: "rgba(58, 125, 86, 0.1)",
  },
  status: {
    indexed: "#5B8A6E",
    processing: "#B8976E",
    error: "#A66B6B",
    notIndexed: "#6B6560",
  },
} as const;
