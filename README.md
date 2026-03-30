```
                 ____   ___  _   _ _____
                |  _ \ / _ \| | | | ____|
                | |_) | | | | | | |  _|
                |  _ <| |_| \ \_/ / |___
                |_| \_\\___/ \___/|_____|
                   EXPLORE THE CONTEXT
```

**A terminal file explorer for everyone.**

---

## Why

The terminal is the most powerful environment a developer has. But navigating files in it has always felt like a compromise — you either open a whole IDE just to see your project structure, or you're running `ls` and `cd` blindly, one directory at a time.

`rove` exists because you shouldn't need a GUI to navigate like one. You should be able to see your project, move through it with your keyboard, and run shell commands on files — without ever leaving the terminal.

It's built for everyone: the vim user who lives in tmux, and the person who just started using Claude Code and wants to explore their project without opening VS Code on the side. No config files. No plugins to install. Just run it.

---

## Demo

_TODO: Add a GIF or screenshot here._

---

## Install

```bash
npm install -g rove-tui
```

Or build from source:

```bash
git clone https://github.com/IsNielsen/rove.git
cd rove
npm install
npm run build
npm link
```

---

## Usage

```bash
rove              # Open the file explorer in the current directory
rove -g           # Enable git status decorations
rove -d 5         # Show up to 5 levels of folder depth (default: 3)
rove -g -d 2      # Combine options
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-g, --git` | Show git status colors (modified, untracked, ignored) | off |
| `-d, --depth <n>` | Maximum folder depth to display | `3` |

---

## How It Works

`rove` is a command launcher, not a file manager. The idea: navigate to a file, type a command, run it.

After a command runs, `rove` comes back with a history panel showing previous output. Navigate to another file and run another command, or press `q` to exit.

### Navigation

| Key | Action |
|-----|--------|
| `↑` / `k` | Move cursor up |
| `↓` / `j` | Move cursor down |
| `→` / `l` | Expand a directory |
| `←` / `h` | Collapse a directory |
| `gg` | Jump to top |
| `G` | Jump to bottom |
| `-` | Go to parent directory |
| `/` | Filter files by name |
| `?` | Show keybindings help |
| `q` | Quit |

### Running Commands

Press `:` to open the command bar, or press `Tab` to open it with the selected file pre-inserted.

```
> vim src/index.ts█   [Tab] insert file  [↵] run  [Esc] cancel
```

| Key | Action |
|-----|--------|
| `:` | Open command bar (empty) |
| `Tab` (nav mode) | Open command bar with selected file inserted |
| `Tab` (cmd mode) | Insert selected filename at cursor position |
| `↑` / `↓` | Recall previous commands from history |
| `Ctrl+A` / `Ctrl+E` | Move cursor to start / end of line |
| `Ctrl+W` | Delete word before cursor |
| `Ctrl+U` | Clear the command bar |
| `Enter` | Run the command |
| `Esc` | Cancel and return to navigation |

### Filtering

Press `/` to enter filter mode. The tree narrows as you type, showing only matching files and their parent directories.

| Key | Action |
|-----|--------|
| `Enter` | Confirm filter, return to navigation |
| `Esc` | Clear filter and return to navigation |

### Examples

| What you type | What runs |
|---------------|-----------|
| `:` → `vim ` → Tab → Enter | `vim src/index.ts` |
| Tab → `git add` → Enter | `git add src/index.ts` |
| `:` → `cat ` → Tab → ` \| grep foo` → Enter | `cat src/index.ts \| grep foo` |
| `/` → `App` → Enter → Tab → `vim` → Enter | `vim src/App.tsx` |

### New to terminal editors?

If you're used to VSCode or Google Docs, here are good starting points:

| Editor | Install | Best for |
|--------|---------|----------|
| `nano <file>` | pre-installed on most systems | Simplest terminal editor; hints shown at the bottom of the screen |
| `micro <file>` | `brew install micro` / `snap install micro` | Feels most like a normal editor — familiar shortcuts like Ctrl+S, Ctrl+Z |

With `rove`, you can navigate to any file, press `Tab`, type `nano` (or `micro`), and hit Enter.

---

## Git Integration

Run with `-g` to see git status colors in the file tree:

| Color | Meaning |
|-------|---------|
| Yellow | Modified (tracked, with changes) |
| Green | Untracked (new file) |
| Dimmed | Ignored (matches `.gitignore`) |

Press `r` to manually refresh git status. It also auto-refreshes every 30 seconds.

Works in any git repository. In non-git directories, the flag is silently ignored.

---

## History Panel

After running commands, a history panel appears at the bottom of the screen showing previous command output. Scroll through it while navigating the file tree:

| Key | Action |
|-----|--------|
| `[` or `Shift+↑` | Scroll history up |
| `]` or `Shift+↓` | Scroll history down |

---

## Why Not ranger / nnn / fzf?

**ranger / nnn:** Great tools, but they're full file managers — lots of config, lots of concepts to learn. `rove` has one job: help you pick a file and run a command on it.

**fzf:** Fuzzy search is powerful, but it's text-only. Sometimes you want to see the tree — where a file lives relative to everything else — not just match its name.

**A GUI IDE:** If you're already in the terminal, you shouldn't have to leave it just to navigate your project.

---

## Contributing

Contributions are welcome at any skill level — whether you're fixing a typo, reporting a bug, or adding a feature you wish existed.

### Getting started

```bash
git clone https://github.com/your-username/rove.git
cd rove
npm install
npm run dev      # Run directly with tsx (no build step needed)
npm run build    # Compile to dist/
```

### What to contribute

- Bug fixes
- New keybindings or interaction improvements
- Accessibility improvements
- Configuration options (colorschemes, ignored directories, etc.)
- Better documentation or examples
- Tests (none exist yet — all contributions welcome)

### Guidelines

- Keep it simple. Match the style of existing code in `src/App.tsx`.
- `rove` is TypeScript + React + [Ink](https://github.com/vadimdemedes/ink). If you're new to Ink, it's React but for the terminal — give their docs a quick read.
- Open an issue before starting a large change so we can align on direction.
- PRs of any size are welcome.

---

## License

MIT — see [LICENSE](./LICENSE).
