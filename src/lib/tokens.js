// Semantic token generator — brand primary hex -> a usable light-mode token set.
import { makeBrandHarmony, neutral } from './palette.js';
import { ensureContrastOklch, contrastRatio } from './oklch.js';

function step(family, n) {
  return family.find((s) => s.step === n).hex;
}

/**
 * Build a semantic token set from a brand primary hex.
 * Every text-on-fill / text-on-bg pair is WCAG AA (4.5:1) guaranteed —
 * ensureContrastOklch nudges lightness only, so hue never shifts.
 */
export function buildTokens(primaryHex) {
  const harmony = makeBrandHarmony(primaryHex);

  const bgNormal = neutral[0];
  const bgElevated = neutral[0];
  const bgAlt = neutral[50];

  const textNormal = ensureContrastOklch(neutral[950], bgNormal, 4.5);
  const textAlternative = ensureContrastOklch(neutral[600], bgNormal, 4.5);
  const textOnFill = ensureContrastOklch('#ffffff', primaryHex, 4.5);
  const textBrand = ensureContrastOklch(primaryHex, bgNormal, 4.5);

  const fillNormal = primaryHex;
  const fillStrong = step(harmony.primary, 800);
  const borderNormal = neutral[200];
  const borderBrand = ensureContrastOklch(primaryHex, bgNormal, 3);

  const tokens = {
    palette: {
      primary: harmony.primary,
      success: harmony.success,
      danger: harmony.danger,
      warning: harmony.warning,
      info: harmony.info,
      neutral,
    },
    semantic: {
      '--color-bg-normal': bgNormal,
      '--color-bg-elevated': bgElevated,
      '--color-bg-alt': bgAlt,
      '--color-fill-normal': fillNormal,
      '--color-fill-strong': fillStrong,
      '--color-text-normal': textNormal,
      '--color-text-alternative': textAlternative,
      '--color-text-on-fill': textOnFill,
      '--color-text-brand': textBrand,
      '--color-border-normal': borderNormal,
      '--color-border-brand': borderBrand,
      '--color-fill-success': step(harmony.success, 600),
      '--color-fill-danger': step(harmony.danger, 600),
      '--color-fill-warning': step(harmony.warning, 600),
      '--color-fill-info': step(harmony.info, 600),
    },
  };

  // Pairs that MUST pass WCAG AA — used by both `init`'s report and `check`.
  const pairs = [
    ['--color-text-normal / --color-bg-normal', textNormal, bgNormal],
    ['--color-text-alternative / --color-bg-normal', textAlternative, bgNormal],
    ['--color-text-on-fill / --color-fill-normal', textOnFill, fillNormal],
    ['--color-text-brand / --color-bg-normal', textBrand, bgNormal],
  ];

  const report = pairs.map(([label, fg, bg]) => ({
    label,
    fg,
    bg,
    ratio: Number(contrastRatio(fg, bg).toFixed(2)),
    pass: contrastRatio(fg, bg) >= 4.5,
  }));

  return { tokens, report };
}

export function tokensToCSS(tokens) {
  const lines = Object.entries(tokens.semantic).map(([k, v]) => `  ${k}: ${v};`);
  return `:root {\n${lines.join('\n')}\n}\n`;
}
