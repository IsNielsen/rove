This file provides guidance to your preferred AI coding tool (claude code) when working with code in this repository.

## Commands

- **Dev run:** `npm run dev -- [options]` (uses `tsx` to run TypeScript directly)
- **Build:** `npm run build` (compiles to `dist/`)
- **Run built binary:** `node dist/index.js [options]`

CLI options: `-g/--git` (git status decorations), `-d/--depth <n>` (folder depth, default 3)

No test framework is configured.

## Architecture

LSG is an interactive TUI file explorer built with React + [Ink](https://github.com/vadimdemedes/ink) (React-to-terminal renderer).

**`src/index.ts`** — CLI entry point. Parses args with Commander, then runs a loop: render the Ink app, wait for exit signal, execute any assembled shell command via `execSync`, repeat. The loop exists because after executing a command the user may want to run another.

**`src/App.tsx`** — Single React component managing all interactive state:
- File tree nodes (flat array with depth metadata, expanded/collapsed inline)
- Two input modes: `prefix` (command before filename) and `suffix` (command after filename)
- Cursor position and scroll offset for terminal-height-aware rendering
- Git status map for color decorations (yellow=modified, green=untracked, dimmed=ignored)

**`src/utils/files.ts`** — `FileNode` type and tree manipulation helpers. `readChildren()` excludes `.git`, `node_modules`, `.next`, `dist`. The tree is stored as a flat array; expanding a dir calls `insertAfter()` to splice children in-place.

**`src/utils/git.ts`** — Parses `git status --porcelain --ignored` to return a `Map<path, status>`. Returns empty map in non-git directories.

## Key interaction model

The user navigates the file tree, then types characters to build a shell command (e.g. `vim`), uses Tab to insert the selected filename, and presses Enter. The assembled command (`prefix + file + suffix`) is passed back to `index.ts` for execution after Ink unmounts.
