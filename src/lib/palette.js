// Primitive Color Palette generator — OKLCH-based, perceptually uniform, sRGB-safe.
import { oklchToHex, hexToOklch } from './oklch.js';

// Base [L, C] per tonal step. Chroma peaks at 500-600 (fill range), tapers at extremes.
const STEPS = [
  [50, 0.971, 0.018],
  [100, 0.943, 0.038],
  [200, 0.895, 0.072],
  [300, 0.832, 0.115],
  [400, 0.752, 0.155],
  [500, 0.651, 0.188],
  [600, 0.545, 0.193],
  [700, 0.449, 0.175],
  [800, 0.362, 0.145],
  [900, 0.282, 0.108],
  [950, 0.213, 0.072],
];

/** Largest in-gamut chroma at (l, h), via binary search on round-trip fidelity. */
export function maxChromaAt(l, h) {
  let lo = 0, hi = 0.4, best = 0;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const back = hexToOklch(oklchToHex(l, mid, h));
    if (Math.abs(back.c - mid) < 0.004 && Math.abs(back.l - l) < 0.012) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

function makeHarmonyHue(h, chromaScale) {
  return STEPS.map(([step, l, c]) => {
    const scaledC = Math.min(c * chromaScale, maxChromaAt(l, h));
    return { step, l, hex: oklchToHex(l, scaledC, h) };
  });
}

/**
 * Returns 5 harmonious hue families for a brand primary hex:
 * primary + success(green)/danger(red)/warning(amber)/info(blue), all sharing
 * the primary's chromaScale so they read as perceptually harmonious.
 */
export function makeBrandHarmony(primaryHex) {
  const { l: baseL, c: baseC, h } = hexToOklch(primaryHex);

  let anchorIdx = 0, minDiff = Infinity;
  STEPS.forEach(([, l], i) => {
    const d = Math.abs(l - baseL);
    if (d < minDiff) { minDiff = d; anchorIdx = i; }
  });
  const anchorNominalC = STEPS[anchorIdx][2];
  const chromaScale = Math.max(0.32, baseC / anchorNominalC);

  const rawPrimary = makeHarmonyHue(h, chromaScale);
  const primary = rawPrimary.map((s, i) => (i === anchorIdx ? { ...s, hex: primaryHex } : s));

  return {
    chromaScale,
    primary,
    success: makeHarmonyHue(145, chromaScale),
    danger: makeHarmonyHue(22, chromaScale),
    warning: makeHarmonyHue(62, chromaScale),
    info: makeHarmonyHue(254, chromaScale),
  };
}

// Neutral scale — 13 steps, hue 286, near-achromatic.
export const neutral = {
  0: oklchToHex(1.000, 0.000, 0),
  50: oklchToHex(0.985, 0.002, 286),
  100: oklchToHex(0.961, 0.003, 286),
  200: oklchToHex(0.921, 0.004, 286),
  300: oklchToHex(0.870, 0.005, 286),
  400: oklchToHex(0.718, 0.008, 286),
  500: oklchToHex(0.556, 0.009, 286),
  600: oklchToHex(0.442, 0.008, 286),
  700: oklchToHex(0.350, 0.007, 286),
  800: oklchToHex(0.269, 0.005, 286),
  900: oklchToHex(0.205, 0.004, 286),
  950: oklchToHex(0.130, 0.003, 286),
  1000: oklchToHex(0.000, 0.000, 0),
};
