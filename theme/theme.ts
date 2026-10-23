import { createTheme } from "@mantine/core";
import type { CSSVariablesResolver, MantineColorsTuple } from "@mantine/core";
import { colorTokens, sizeTokens } from "./tokens";

type Tokens = Record<string, string>;
type ColorTokens = (typeof colorTokens)["light"] | (typeof colorTokens)["dark"];

// fontSizeBody -> font-size-body, space1 -> space-1
const toKebab = (name: string) =>
  name.replace(/[A-Z0-9]/g, (m) => `-${m.toLowerCase()}`);

// Turns a token object into CSS variables, for example
// { fontSizeBody: '16px' } -> { '--font-size-body': '16px' }.
const toVariables = (tokens: Tokens, prefix = "") =>
  Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [
      `--${prefix ? `${prefix}-` : ""}${toKebab(name)}`,
      value,
    ]),
  );

// Points Mantine's own color variables at our tokens, so every Mantine
// component picks up the palette in both color schemes.
const toMantineVariables = (c: ColorTokens) => ({
  "--mantine-color-body": c.page,
  "--mantine-color-text": c.text,
  "--mantine-color-bright": c.text,
  "--mantine-color-dimmed": c.textMuted,
  "--mantine-color-placeholder": c.textMuted,
  "--mantine-color-anchor": c.accentText,
  "--mantine-color-default": c.surface,
  "--mantine-color-default-hover": c.hover,
  "--mantine-color-default-color": c.text,
  "--mantine-color-default-border": c.border,
  "--mantine-color-error": c.errorText,
  "--mantine-color-success": c.successText,
  "--mantine-color-disabled": c.disabledBackground,
  "--mantine-color-disabled-color": c.disabledText,
  "--mantine-color-disabled-border": c.border,
  "--mantine-primary-color-filled": c.accent,
  "--mantine-primary-color-filled-hover": c.accentHover,
  "--mantine-primary-color-light": c.accentTint,
  "--mantine-primary-color-light-color": c.accentText,
  "--mantine-primary-color-contrast": c.onAccent,
});

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: toVariables(sizeTokens),
  light: {
    ...toVariables(colorTokens.light, "color"),
    ...toMantineVariables(colorTokens.light),
  },
  dark: {
    ...toVariables(colorTokens.dark, "color"),
    ...toMantineVariables(colorTokens.dark),
  },
});

// Radix Indigo steps 2 to 11, so index 7 is step 9 (the solid accent) and
// index 8 is step 10 (its hover value).
const brand: MantineColorsTuple = [
  "#f7f9ff",
  "#edf2fe",
  "#e1e9ff",
  "#d2deff",
  "#c1d0ff",
  "#abbdf9",
  "#8da4ef",
  "#3e63dd",
  "#3358d4",
  "#3a5bc7",
];

export const theme = createTheme({
  // Controls take their height and horizontal padding from tokens
  // (paddingControl, paddingControlCompact), not from Mantine's size scale.
  components: {
    // Compact buttons (list rows) take their horizontal padding from
    // paddingControlCompact, all others from paddingControl.
    Button: {
      styles: (_theme: unknown, props: { size?: unknown }) => ({
        root: {
          "--button-height": "var(--control-height)",
          "--button-padding-x": String(props.size ?? "").startsWith("compact")
            ? "var(--padding-control-compact)"
            : "var(--space-2)",
        },
      }),
    },
    TextInput: {
      styles: { wrapper: { "--input-height": "var(--control-height)" } },
    },
    Select: {
      styles: { wrapper: { "--input-height": "var(--control-height)" } },
    },
    PasswordInput: {
      styles: { wrapper: { "--input-height": "var(--control-height)" } },
    },
  },

  primaryColor: "brand",
  primaryShade: 7,
  colors: { brand },

  fontFamily: "var(--font-sans), sans-serif",
  headings: {
    fontFamily: "var(--font-serif), serif",
    fontWeight: "var(--font-weight-semibold)",
    sizes: {
      h1: {
        fontSize: "var(--font-size-heading)",
        lineHeight: "var(--line-height-heading)",
      },
      h2: {
        fontSize: "var(--font-size-body)",
        lineHeight: "var(--line-height-body)",
      },
      h3: {
        fontSize: "var(--font-size-body)",
        lineHeight: "var(--line-height-body)",
      },
      h4: {
        fontSize: "var(--font-size-body)",
        lineHeight: "var(--line-height-body)",
      },
      h5: {
        fontSize: "var(--font-size-small)",
        lineHeight: "var(--line-height-body)",
      },
      h6: {
        fontSize: "var(--font-size-small)",
        lineHeight: "var(--line-height-body)",
      },
    },
  },
  fontSizes: {
    xs: "var(--font-size-small)",
    sm: "var(--font-size-small)",
    md: "var(--font-size-body)",
    lg: "var(--font-size-body)",
    xl: "var(--font-size-heading)",
  },
  lineHeights: {
    xs: "var(--line-height-body)",
    sm: "var(--line-height-body)",
    md: "var(--line-height-body)",
    lg: "var(--line-height-body)",
    xl: "var(--line-height-heading)",
  },
  fontWeights: {
    regular: "var(--font-weight-regular)",
    medium: "var(--font-weight-semibold)",
    bold: "var(--font-weight-semibold)",
  },

  radius: {
    xs: "var(--radius-default)",
    sm: "var(--radius-default)",
    md: "var(--radius-default)",
    lg: "var(--radius-large)",
    xl: "var(--radius-large)",
  },
  defaultRadius: "md",

  spacing: {
    xs: "var(--space-1)",
    sm: "var(--space-2)",
    md: "var(--space-3)",
    lg: "var(--space-4)",
    xl: "var(--space-6)",
  },

  // One shadow token, used only by elements that float above the page.
  shadows: {
    xs: "none",
    sm: "none",
    md: "var(--color-shadow-floating)",
    lg: "var(--color-shadow-floating)",
    xl: "var(--color-shadow-floating)",
  },
});
