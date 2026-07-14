import fs from 'node:fs';
import path from 'node:path';
import { buildTokens, tokensToCSS } from '../lib/tokens.js';
import { printPaletteRow, printReport, bold, dim } from '../lib/terminal.js';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function initCommand(hex, opts) {
  if (!HEX_RE.test(hex)) {
    console.error(`"${hex}" is not a valid hex color (expected format: #3D6DFF)`);
    process.exitCode = 1;
    return;
  }

  const { tokens, report } = buildTokens(hex);
  const name = opts.name || 'brand';

  console.log('');
  console.log(bold(`tokensmith init ${hex}`));
  console.log(dim('OKLCH-based, WCAG-AA-guaranteed design tokens\n'));

  printPaletteRow('primary', tokens.palette.primary);
  printPaletteRow('success', tokens.palette.success);
  printPaletteRow('danger ', tokens.palette.danger);
  printPaletteRow('warning', tokens.palette.warning);
  printPaletteRow('info   ', tokens.palette.info);

  printReport(report);

  const failCount = report.filter((r) => !r.pass).length;
  if (failCount === 0) {
    console.log(dim('All text/fill pairs passed WCAG AA automatically — no manual fixes needed.\n'));
  }

  const outDir = opts.out || '.';
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `${name}-tokens.json`);
  const cssPath = path.join(outDir, `${name}-tokens.css`);
  fs.writeFileSync(jsonPath, JSON.stringify({ primary: hex, ...tokens }, null, 2));
  fs.writeFileSync(cssPath, tokensToCSS(tokens));

  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${cssPath}`);
  console.log('');
  console.log(dim(`Next: tokensmith check ${jsonPath}  (wire this into CI)`));
  console.log('');
}
