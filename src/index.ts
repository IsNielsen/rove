#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import chalk from 'chalk';
import App from './App.js';

program
  .name('rove')
  .description('Interactive TUI file explorer')
  .option('-g, --git', 'Show git status decorations')
  .option('-d, --depth <n>', 'Max folder depth', '3')
  .option('--no-banner', 'Hide the ASCII art banner')
  .parse();

const opts = program.opts();

const configPath = path.join(os.homedir(), '.rove', 'config.json');
let hasSeenWelcome = false;
try {
  const raw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(raw) as Record<string, unknown>;
  hasSeenWelcome = config['hasSeenWelcome'] === true;
} catch {
  // config doesn't exist yet — show welcome
}

const props = {
  cwd: process.cwd(),
  gitMode: Boolean(opts['git']),
  maxDepth: parseInt(opts['depth'] as string, 10),
  showWelcome: !hasSeenWelcome,
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
