// Design gate: checks the mechanical rules of docs/ux-ui-guidelines.md.
// No dependencies. Run with `npm run design`. Exits 1 when a rule is broken.
// Judgment rules (layout choice, labels, states, 60/30/10, references) stay
// with human review.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const SOURCE_DIRS = ['app', 'components'];
const problems = [];
const fail = (rule, file, line, detail) => problems.push({ rule, file, line, detail });

// ---------- helpers ----------
function walk(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (/\.(tsx?|css)$/.test(name)) out.push(full);
  }
  return out;
}

// Removes comments but keeps line numbers.
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => (/^\s*\/\//.test(line) ? '' : line))
    .join('\n');
}

const scan = (file, text, rule, regex, detail) => {
  text.split('\n').forEach((line, i) => {
    const match = line.match(regex);
    const message = match && detail(match, line);
    if (message) fail(rule, file, i + 1, message);
  });
};

// ---------- tokens ----------
const tokensPath = 'theme/tokens.ts';
const tokensText = readFileSync(join(root, tokensPath), 'utf8');

const block = (text, startMarker, endMarker) => {
  const start = text.indexOf(startMarker);
  const end = endMarker ? text.indexOf(endMarker, start) : text.length;
  return text.slice(start, end);
};
const pairs = (text) =>
  [...text.matchAll(/^\s*(\w+):\s*['"]([^'"]*)['"]/gm)].map(([, key, value]) => [key, value]);

const colorsText = block(tokensText, 'export const colorTokens', 'export const sizeTokens');
const light = pairs(block(colorsText, 'light: {', 'dark: {'));
const dark = pairs(block(colorsText, 'dark: {'));
const size = pairs(block(tokensText, 'export const sizeTokens'));

// Rule: light and dark define the same tokens (the brief requires both modes).
{
  const l = new Set(light.map(([k]) => k));
  const d = new Set(dark.map(([k]) => k));
  for (const k of l) if (!d.has(k)) fail('both-color-schemes', tokensPath, 0, `"${k}" has a light value but no dark value`);
  for (const k of d) if (!l.has(k)) fail('both-color-schemes', tokensPath, 0, `"${k}" has a dark value but no light value`);
}

// Rule: spacing, padding, radius and dimensions sit on the 8px grid (4px only for spaceTight).
for (const [key, value] of size) {
  if (!/^(space\d|spaceTight|padding\w+|radius\w+|headerHeight|controlHeight|contentMaxWidth|formMaxWidth)$/.test(key)) continue;
  for (const [, num] of value.matchAll(/(\d+(?:\.\d+)?)px/g)) {
    const n = Number(num);
    const ok = n % 8 === 0 || (key === 'spaceTight' && n === 4);
    if (!ok) fail('8px-grid', tokensPath, 0, `${key} = ${value}: ${n}px is not a multiple of 8`);
  }
}

// Rule: only two radius values (8px and 16px).
{
  const radii = new Set(size.filter(([k]) => k.startsWith('radius')).map(([, v]) => v));
  if (radii.size !== 2 || !radii.has('8px') || !radii.has('16px'))
    fail('two-radius-values', tokensPath, 0, `radius tokens must be exactly 8px and 16px, found: ${[...radii].join(', ')}`);
}

// Rule: at most 3 font sizes, and only weights 400 and 600.
{
  const sizes = size.filter(([k]) => k.startsWith('fontSize'));
  if (sizes.length > 3) fail('three-font-sizes', tokensPath, 0, `${sizes.length} font sizes defined (maximum 3 without approval)`);
  for (const [k, v] of size.filter(([k]) => k.startsWith('fontWeight')))
    if (!['400', '600'].includes(v)) fail('two-font-weights', tokensPath, 0, `${k} = ${v} (only 400 and 600 are allowed)`);
}

// CSS variables the tokens create (mirrors theme/theme.ts).
const kebab = (name) => name.replace(/[A-Z0-9]/g, (m) => `-${m.toLowerCase()}`);
const knownVars = new Set([
  ...size.map(([k]) => `--${kebab(k)}`),
  ...light.map(([k]) => `--color-${kebab(k)}`),
  '--font-sans',
  '--font-serif',
]);

// ---------- source files ----------
const files = SOURCE_DIRS.filter((d) => { try { return statSync(join(root, d)).isDirectory(); } catch { return false; } })
  .flatMap((d) => walk(join(root, d)));

const MANTINE_PALETTES = 'dark|gray|red|pink|grape|violet|indigo|blue|cyan|teal|green|lime|yellow|orange';

for (const abs of files) {
  const file = relative(root, abs).split(sep).join('/');
  const raw = readFileSync(abs, 'utf8');
  const text = stripComments(raw);
  const isCss = file.endsWith('.css');
  const isTsx = !isCss;
  // Media query lines are exempt from unit checks (breakpoints are not spacing).
  const noMedia = text.split('\n').map((l) => (/^\s*@media/.test(l) ? '' : l)).join('\n');

  scan(file, text, 'no-raw-colors', /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/, (m) => `raw color "${m[0]}": use a color token`);
  scan(file, noMedia, 'no-raw-px', /\b\d*\.?\d+px\b/, (m) => `raw value "${m[0]}": use a spacing, size or padding token`);
  scan(file, noMedia, 'no-raw-rem-em', /\b\d*\.?\d+r?em\b/, (m) => `raw value "${m[0]}": use a token`);
  scan(file, text, 'no-gradients', /(?:linear|radial|conic)-gradient\(/, () => 'gradients are not allowed on any surface');
  scan(file, text, 'no-glow-shadows', /box-shadow|text-shadow|drop-shadow|\bboxShadow\b/, () => 'shadows belong to the one floating-shadow token (Mantine shadow prop)');
  scan(file, text, 'no-side-borders', /border-(?:left|right|inline-start|inline-end)\s*:|\bborder(?:Left|Right|InlineStart|InlineEnd)\b/, () => 'single-side colored borders are not allowed (top and bottom dividers are fine)');
  scan(file, text, 'no-emoji', /\p{Extended_Pictographic}/u, (m) => `emoji "${m[0]}" in the UI`);
  scan(file, text, 'no-exclamation', /\w!['"`]|(?<=>)[^<>{}=]*\w!(?=[\s:.]*[<{]|\s*$)|^\s*[A-Za-z][^<>{}=;()]*\w!(?=[\s:.]*[{<]|\s*$)/, () => 'copy has an exclamation mark');

  if (isCss) {
    scan(file, text, 'font-weights', /font-weight\s*:\s*([^;}]+)/, (m) =>
      /^(var\(--font-weight-(regular|semibold)\)|400|600)$/.test(m[1].trim()) ? null : `font weight "${m[1].trim()}": use the 400 or 600 token`);
    scan(file, text, 'radius-tokens', /border-radius\s*:\s*([^;}]+)/, (m) =>
      /^(var\(--radius-(default|large)\)|0)$/.test(m[1].trim()) ? null : `border radius "${m[1].trim()}": use a radius token`);
  }

  if (isTsx) {
    scan(file, text, 'font-weights', /\bfw=\{?["']?(?!400\b|600\b|regular\b|medium\b)\w+/, (m) => `font weight "${m[0]}": only 400 and 600 are allowed`);
    scan(file, text, 'no-inline-svg', /<svg\b|<path\b/, () => 'do not hardcode icons: use Tabler Icons');
    scan(file, text, 'icon-library', /from\s+['"](?:lucide-react|react-icons[^'"]*|@heroicons[^'"]*|@fortawesome[^'"]*|@phosphor-icons[^'"]*)['"]/, () => 'icons come from Tabler Icons only');
    scan(file, text, 'no-mantine-palette', new RegExp(`\\b(?:color|c|bg)=["'](?:${MANTINE_PALETTES})(?:\\.\\d)?["']`), (m) => `Mantine palette color ${m[0]}: use a project color token`);
    scan(file, text, 'radius-tokens', /\bradius=\{/, () => 'radius must use a size name (sm, md, lg), not a number');
  }

  // Every CSS variable referenced must exist as a token (catches typos).
  text.split('\n').forEach((line, i) => {
    for (const [, name] of line.matchAll(/var\((--[\w-]+)/g)) {
      if (name.startsWith('--mantine-') || knownVars.has(name)) continue;
      fail('unknown-token', file, i + 1, `${name} is not defined by theme/tokens.ts`);
    }
  });

  // Every page sets its own tab title ("Page | App").
  if (/(^|\/)page\.tsx$/.test(file) && !/\b(?:metadata|generateMetadata)\b/.test(text))
    fail('tab-title', file, 0, 'page does not set a title (export metadata)');
}

// ---------- report ----------
if (problems.length === 0) {
  console.log(`Design gate passed: ${files.length} files checked.`);
  process.exit(0);
}
for (const p of problems) {
  const where = p.line ? `${p.file}:${p.line}` : p.file;
  console.error(`${where}  [${p.rule}]  ${p.detail}`);
}
console.error(`\nDesign gate failed: ${problems.length} problem(s). Rules: docs/ux-ui-guidelines.md`);
process.exit(1);
