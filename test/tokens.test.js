import { describe, it, expect } from 'vitest';
import { buildTokens } from '../src/lib/tokens.js';

describe('buildTokens', () => {
  it('produces a report where every pair passes WCAG AA', () => {
    for (const hex of ['#3D6DFF', '#F59E0B', '#12B886', '#ffe600', '#ff0000']) {
      const { report } = buildTokens(hex);
      for (const row of report) {
        expect(row.pass, `${row.label} should pass for primary ${hex} (got ${row.ratio}:1)`).toBe(true);
      }
    }
  });

  it('keeps the exact primary hex for --color-fill-normal', () => {
    const { tokens } = buildTokens('#3D6DFF');
    expect(tokens.semantic['--color-fill-normal']).toBe('#3D6DFF');
  });
});
