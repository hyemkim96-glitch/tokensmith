#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { checkCommand } from './commands/check.js';

const program = new Command();

program
  .name('tokensmith')
  .description('Generate OKLCH design tokens from one brand color, with WCAG AA baked in.')
  .version('0.1.0');

program
  .command('init <hex>')
  .description('generate a full token set from a brand primary hex color (e.g. #3D6DFF)')
  .option('-n, --name <name>', 'output file prefix', 'brand')
  .option('-o, --out <dir>', 'output directory', '.')
  .action(initCommand);

program
  .command('check <tokensJson>')
  .description('re-validate a tokensmith-generated tokens.json against WCAG AA (CI-friendly, exits 1 on failure)')
  .action(checkCommand);

program.parse();
