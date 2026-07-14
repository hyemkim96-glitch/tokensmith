import fs from 'node:fs';
import { contrastRatio } from '../lib/oklch.js';
import { printReport, red, green, bold } from '../lib/terminal.js';

const PAIR_KEYS = [
  ['--color-text-normal', '--color-bg-normal'],
  ['--color-text-alternative', '--color-bg-normal'],
  ['--color-text-on-fill', '--color-fill-normal'],
  ['--color-text-brand', '--color-bg-normal'],
];

/**
 * Checks the WCAG contrast of the token values AS THEY CURRENTLY STAND in the
 * file — not a freshly regenerated theoretical version. This is what makes it
 * useful in CI: if someone hand-edits a color after `init`, this is what
 * actually catches the regression (regenerating from `primary` would always
 * pass by construction and hide the edit).
 */
export function checkCommand(tokensJsonPath) {
  if (!fs.existsSync(tokensJsonPath)) {
    console.error(`File not found: ${tokensJsonPath}`);
    process.exitCode = 1;
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(tokensJsonPath, 'utf-8'));
  } catch {
    console.error(`Could not parse ${tokensJsonPath} as JSON`);
    process.exitCode = 1;
    return;
  }

  const semantic = data?.semantic || {};
  const report = PAIR_KEYS
    .filter(([fgKey, bgKey]) => semantic[fgKey] && semantic[bgKey])
    .map(([fgKey, bgKey]) => {
      const fg = semantic[fgKey];
      const bg = semantic[bgKey];
      const ratio = contrastRatio(fg, bg);
      return { label: `${fgKey} / ${bgKey}`, fg, bg, ratio: Number(ratio.toFixed(2)), pass: ratio >= 4.5 };
    });

  if (report.length === 0) {
    console.error(`${tokensJsonPath} has no recognizable semantic tokens (was it made by tokensmith init?)`);
    process.exitCode = 1;
    return;
  }

  printReport(report);

  const failCount = report.filter((r) => !r.pass).length;
  if (failCount > 0) {
    console.log(red(bold(`${failCount} pair(s) failed WCAG AA.`)));
    process.exitCode = 1;
  } else {
    console.log(green(bold('All pairs pass WCAG AA.')));
  }
}
