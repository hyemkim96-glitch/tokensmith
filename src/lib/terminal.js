// Terminal color rendering — ANSI 24-bit truecolor swatches + pass/fail report table.

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Prints a solid color block ("  ") using a truecolor background escape code. */
export function swatch(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `\x1b[48;2;${r};${g};${b}m  \x1b[0m`;
}

export function bold(s) {
  return `\x1b[1m${s}\x1b[0m`;
}

export function dim(s) {
  return `\x1b[2m${s}\x1b[0m`;
}

export function green(s) {
  return `\x1b[32m${s}\x1b[0m`;
}

export function red(s) {
  return `\x1b[31m${s}\x1b[0m`;
}

export function printPaletteRow(name, family) {
  const cells = family.map((s) => swatch(s.hex)).join('');
  console.log(`${cells}  ${name}`);
}

export function printReport(report) {
  console.log('');
  console.log(bold('WCAG AA contrast check (4.5:1 minimum)'));
  for (const row of report) {
    const mark = row.pass ? green('PASS') : red('FAIL');
    console.log(`  ${swatch(row.fg)}${swatch(row.bg)}  ${mark}  ${row.ratio.toFixed(2)}:1  ${dim(row.label)}`);
  }
  console.log('');
}
