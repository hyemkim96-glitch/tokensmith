# tokensmith

Generate OKLCH design tokens from one brand color, with WCAG AA contrast baked in.

```
npx tokensmith init #3D6DFF
```

That's it — you get a full primary/success/danger/warning/info palette, a WCAG AA
contrast report for every text/fill pair (auto-corrected if anything would fail),
and a `brand-tokens.json` + `brand-tokens.css` written to disk.

## Why

Manually picking colors that are both on-brand *and* accessible is slow and easy
to get wrong. tokensmith uses [OKLCH](https://bottosson.github.io/posts/oklab/)
(a perceptually-uniform color space) to generate a full tonal scale from a single
brand color, and automatically nudges lightness (never hue) on any text/background
pair that would fail WCAG AA (4.5:1).

## Commands

### `tokensmith init <hex> [--name <name>] [--out <dir>]`

Generates a token set from a brand primary hex color. Prints terminal color
swatches and a pass/fail contrast report, and writes `<name>-tokens.json` and
`<name>-tokens.css`.

### `tokensmith check <tokens.json>`

Re-validates the *current* values in a tokensmith-generated `tokens.json`
against WCAG AA. Exits with code `1` if anything fails — designed to run in CI
so a hand-edited color that breaks contrast fails the build instead of shipping.

```yaml
# .github/workflows/tokens.yml
- run: npx tokensmith check brand-tokens.json
```

## How it works

- `src/lib/oklch.js` — sRGB hex <-> OKLCH conversion, WCAG contrast ratio, and
  `ensureContrastOklch` (binary-searches lightness only, so a fixed color keeps
  its original hue).
- `src/lib/palette.js` — generates a harmonious primary + success/danger/warning/info
  hue family from one brand color, using the same tonal-step table for every hue
  so scales stay perceptually consistent.
- `src/lib/tokens.js` — turns the palette into a usable semantic token set
  (`--color-text-normal`, `--color-fill-normal`, etc.), guaranteeing every
  text/fill pair passes WCAG AA before it's written out.

## License

MIT
