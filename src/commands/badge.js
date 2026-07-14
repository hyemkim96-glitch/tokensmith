import fs from 'node:fs';
import { contrastRatio } from '../lib/oklch.js';
import { bold, green, red } from '../lib/terminal.js';

const PAIR_KEYS = [
  ['--color-text-normal', '--color-bg-normal'],
  ['--color-text-alternative', '--color-bg-normal'],
  ['--color-text-on-fill', '--color-fill-normal'],
  ['--color-text-brand', '--color-bg-normal'],
];

const SHIELDS_BASE = 'https://img.shields.io/badge';

/**
 * Prints a shields.io markdown badge snippet reflecting the tokens file's
 * current WCAG AA pass/fail state — meant to be pasted into a project README.
 * This is the project's viral loop: every repo that displays the badge
 * exposes tokensmith to everyone who views that README.
 */
export function badgeCommand(tokensJsonPath) {
  if (!fs.existsSync(tokensJsonPath)) {
    console.error(`File not found: ${tokensJsonPath}`);
    process.exitCode = 1;
    return;
  }

  const data = JSON.parse(fs.readFileSync(tokensJsonPath, 'utf-8'));
  const semantic = data?.semantic || {};
  const allPass = PAIR_KEYS
    .filter(([fg, bg]) => semantic[fg] && semantic[bg])
    .every(([fg, bg]) => contrastRatio(semantic[fg], semantic[bg]) >= 4.5);

  const label = 'WCAG_AA';
  const status = allPass ? 'Verified' : 'Failing';
  const color = allPass ? 'brightgreen' : 'red';
  const badgeUrl = `${SHIELDS_BASE}/${label}-${status}-${color}`;
  const markdown = `[![WCAG AA](${badgeUrl})](https://github.com/hyemkim96-glitch/tokensmith)`;

  console.log('');
  console.log(bold('Paste this into your README:'));
  console.log('');
  console.log(markdown);
  console.log('');
  console.log(allPass ? green('Current status: Verified') : red('Current status: Failing — run `tokensmith check` for details'));
  console.log('');
}
