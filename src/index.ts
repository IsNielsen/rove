#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import App, { HistoryEntry } from './App.js';

program
  .name('rove')
  .description('Interactive TUI file explorer')
  .option('-g, --git', 'Show git status decorations')
  .option('-d, --depth <n>', 'Max folder depth', '3')
  .option('--no-banner', 'Hide the ASCII art banner')
  .parse();

const opts = program.opts();

let currentCwd = process.cwd();

const props = {
  gitMode: Boolean(opts['git']),
  maxDepth: parseInt(opts['depth'] as string, 10),
};

async function main() {
  let firstRun = true;
  const history: HistoryEntry[] = [];

  while (true) {
    const rows = process.stdout.rows ?? 24;
    process.stdout.write('\n'.repeat(rows) + `\x1B[${rows}A`);

    let pendingCmd: string | null = null;

    const { waitUntilExit } = render(
      React.createElement(App, {
        ...props,
        cwd: currentCwd,
        showBanner: firstRun && Boolean(opts['banner']),
        history,
        onCommand: (cmd: string) => {
          pendingCmd = cmd;
        },
        onCwdChange: (newCwd: string) => {
          currentCwd = newCwd;
        },
      })
    );

    await waitUntilExit();
    firstRun = false;

    if (pendingCmd) {
      // Ink has already restored the terminal — run the command in the normal shell
      const result = spawnSync(pendingCmd, { shell: true, stdio: 'inherit' });
      history.push({ cmd: pendingCmd, lines: [] });
      if (result.status !== 0) {
        console.log(chalk.red(`\n✗ Command failed (exit ${result.status})`));
      } else {
        console.log(chalk.green('\n✓ Done'));
      }
      console.log();
      // Loop continues → render() called again → back in rove
    } else {
      // User pressed q or Ctrl+C → exit
      break;
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
