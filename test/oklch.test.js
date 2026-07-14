import { describe, it, expect } from 'vitest';
import { hexToOklch, oklchToHex, contrastRatio, ensureContrastOklch } from '../src/lib/oklch.js';

describe('hexToOklch / oklchToHex round-trip', () => {
  it('round-trips common colors within tolerance', () => {
    for (const hex of ['#3D6DFF', '#ffffff', '#000000', '#ff0000', '#12b886']) {
      const { l, c, h } = hexToOklch(hex);
      const back = oklchToHex(l, c, h);
      const [r1, g1, b1] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((x) => parseInt(x, 16));
      const [r2, g2, b2] = [back.slice(1, 3), back.slice(3, 5), back.slice(5, 7)].map((x) => parseInt(x, 16));
      expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(2);
      expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(2);
      expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(2);
    }
  });
});

describe('contrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });
  it('is symmetric', () => {
    expect(contrastRatio('#3D6DFF', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#3D6DFF'), 5);
  });
  it('same color is 1:1', () => {
    expect(contrastRatio('#3D6DFF', '#3D6DFF')).toBeCloseTo(1, 5);
  });
});

describe('ensureContrastOklch', () => {
  it('leaves already-passing pairs unchanged', () => {
    expect(ensureContrastOklch('#000000', '#ffffff', 4.5)).toBe('#000000');
  });
  it('fixes a failing pair to meet the minimum ratio', () => {
    const fixed = ensureContrastOklch('#eeeeee', '#ffffff', 4.5);
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5 - 0.05);
  });
  it('preserves hue when fixing against a pale background', () => {
    const before = hexToOklch('#3D6DFF');
    const fixed = ensureContrastOklch('#3D6DFF', '#eaf0ff', 7); // pale bg forces darkening
    const after = hexToOklch(fixed);
    expect(Math.abs(after.h - before.h)).toBeLessThan(1);
  });
});
