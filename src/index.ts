#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import App from './App.js';

program
  .name('rove')
  .description('Interactive TUI file explorer')
  .option('-g, --git', 'Show git status decorations')
  .option('-d, --depth <n>', 'Max folder depth', '3')
  .parse();

const opts = program.opts();
const props = {
  cwd: process.cwd(),
  gitMode: Boolean(opts['git']),
  maxDepth: parseInt(opts['depth'] as string, 10),
};

async function main() {
  while (true) {
    let pendingCmd: string | null = null;

    const { waitUntilExit } = render(
      React.createElement(App, {
        ...props,
        onCommand: (cmd: string) => {
          pendingCmd = cmd;
        },
      })
    );

    await waitUntilExit();

    if (pendingCmd) {
      // Ink has already restored the terminal — run the command in the normal shell
      const result = spawnSync(pendingCmd, { shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.status !== 0) {
        const stderr = result.stderr?.toString().trim().slice(0, 200) ?? '';
        console.log(chalk.red(`\n✗ Command failed (exit ${result.status})`));
        if (stderr) console.log(chalk.dim(stderr));
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
