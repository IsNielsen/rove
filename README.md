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
npm install -g rove
```

Or build from source:

```bash
git clone https://github.com/your-username/rove.git
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

### Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move cursor up and down |
| `→` | Expand a directory |
| `←` | Collapse a directory |
| `q` | Quit |

### Running Commands

Start typing any character and you enter **command mode**. The bottom bar shows your command assembling in real time:

```
vim  [filename]  ▌   [Tab] toggle file  [↵] run  [Esc] cancel
```

| Key | Action |
|-----|--------|
| Any character | Start/continue typing your command (prefix) |
| `Tab` | Toggle the selected filename on/off; move to suffix |
| `Tab` (again) | Type after the filename (suffix), or toggle it back off |
| `Enter` | Run the assembled command |
| `Esc` | Cancel and return to navigation |

The command is assembled as: `prefix [filename] suffix`

### Examples

| What you type | What runs |
|---------------|-----------|
| `vim` → Tab → Enter | `vim /path/to/file` |
| `git add` → Tab → Enter | `git add /path/to/file` |
| `cat` → Tab → ` \| grep foo` → Enter | `cat /path/to/file \| grep foo` |
| `rm` → Enter (no Tab) | `rm` — runs without a filename if Tab wasn't pressed |

After a command runs, `rove` comes back. You can navigate to another file and run another command, or press `q` to exit.

---

## Git Integration

Run with `-g` to see git status colors in the file tree:

| Color | Meaning |
|-------|---------|
| Yellow | Modified (tracked, with changes) |
| Green | Untracked (new file) |
| Dimmed | Ignored (matches `.gitignore`) |

Works in any git repository. In non-git directories, the flag is silently ignored.

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
