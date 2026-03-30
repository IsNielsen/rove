#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { program } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import App from './App.js';

program
  .name('rove')
  .description('Interactive TUI file explorer')
  .option('-g, --git', 'Show git status decorations')
  .option('-d, --depth <n>', 'Max folder depth', '3')
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
