#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { execSync } from 'child_process';
import App from './App.js';

program
  .name('rove')
  .description('Interactive TUI file explorer')
  .option('-g, --git', 'Show git status decorations')
  .option('-d, --depth <n>', 'Max folder depth', '3')
  .option('--no-banner', 'Hide the ASCII art banner')
  .parse();

const opts = program.opts();
const props = {
  cwd: process.cwd(),
  gitMode: Boolean(opts['git']),
  maxDepth: parseInt(opts['depth'] as string, 10),
};

async function main() {
  let firstRun = true;

  while (true) {
    const rows = process.stdout.rows ?? 24;
    process.stdout.write('\n'.repeat(rows) + `\x1B[${rows}A`);

    let pendingCmd: string | null = null;

    const { waitUntilExit } = render(
      React.createElement(App, {
        ...props,
        showBanner: firstRun && Boolean(opts['banner']),
        onCommand: (cmd: string) => {
          pendingCmd = cmd;
        },
      })
    );

    await waitUntilExit();
    firstRun = false;

    if (pendingCmd) {
      // Ink has already restored the terminal — run the command in the normal shell
      try {
        execSync(pendingCmd, { stdio: 'inherit', shell: '/bin/sh' });
      } catch {
        // command exited non-zero; still re-render rove
      }
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
