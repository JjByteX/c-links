// Font setting. The three choices are defined here once. The chosen one is
// saved in this browser and applied as the --font-sans and --font-serif CSS
// variables, which the theme and the stylesheets already use. The font
// variables (--font-source-serif and so on) are set in app/layout.tsx.

export const FONT_KEY = "clinks-font";
export const FONT_DEFAULT = "default";

export const fontOptions = [
  {
    value: "default",
    label: "Source Serif and Source Sans",
    sans: "var(--font-source-sans), sans-serif",
    serif: "var(--font-source-serif), serif",
  },
  {
    value: "inter",
    label: "Inter",
    sans: "var(--font-inter), sans-serif",
    serif: "var(--font-inter), sans-serif",
  },
  {
    value: "lora",
    label: "Lora",
    sans: "var(--font-lora), serif",
    serif: "var(--font-lora), serif",
  },
] as const;

export type FontValue = (typeof fontOptions)[number]["value"];

const isFontValue = (value: unknown): value is FontValue =>
  fontOptions.some((option) => option.value === value);

export function readFont(): FontValue {
  try {
    const value = localStorage.getItem(FONT_KEY);
    if (isFontValue(value)) return value;
  } catch {
    // Storage can be blocked, so the default is used.
  }
  return FONT_DEFAULT;
}

export function applyFont(value: FontValue) {
  const option = fontOptions.find((o) => o.value === value) ?? fontOptions[0];
  const style = document.documentElement.style;
  style.setProperty("--font-sans", option.sans);
  style.setProperty("--font-serif", option.serif);
}

export function saveFont(value: FontValue) {
  try {
    localStorage.setItem(FONT_KEY, value);
  } catch {
    // The font still applies for this visit.
  }
}

// Runs in the page head before first paint, so a saved font does not flash
// the default font first.
export const fontScript = `(function(){try{var o=${JSON.stringify(
  Object.fromEntries(fontOptions.map((o) => [o.value, [o.sans, o.serif]])),
)};var f=o[localStorage.getItem("${FONT_KEY}")];if(f){var s=document.documentElement.style;s.setProperty("--font-sans",f[0]);s.setProperty("--font-serif",f[1])}}catch(e){}})();`;
