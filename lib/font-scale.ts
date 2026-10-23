// Text size setting. The chosen percentage is saved in this browser and
// applied as the --font-scale CSS variable, which the font size tokens in
// theme/theme.ts multiply.

export const FONT_SCALE_KEY = "clinks-font-scale";
export const FONT_SCALE_DEFAULT = 100;
export const FONT_SCALE_MIN = 90;
export const FONT_SCALE_MAX = 150;
export const FONT_SCALE_STEP = 10;

export function readFontScale(): number {
  try {
    const value = Number(localStorage.getItem(FONT_SCALE_KEY));
    if (value >= FONT_SCALE_MIN && value <= FONT_SCALE_MAX) return value;
  } catch {
    // Storage can be blocked, so the default is used.
  }
  return FONT_SCALE_DEFAULT;
}

export function applyFontScale(percent: number) {
  document.documentElement.style.setProperty(
    "--font-scale",
    String(percent / 100),
  );
}

export function saveFontScale(percent: number) {
  try {
    localStorage.setItem(FONT_SCALE_KEY, String(percent));
  } catch {
    // The size still applies for this visit.
  }
}

// Runs in the page head before first paint, so a saved size does not flash
// the default size first.
export const fontScaleScript = `(function(){try{var n=Number(localStorage.getItem("${FONT_SCALE_KEY}"));if(n>=${FONT_SCALE_MIN}&&n<=${FONT_SCALE_MAX})document.documentElement.style.setProperty("--font-scale",String(n/100))}catch(e){}})();`;
