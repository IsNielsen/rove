# Contributing to rove

Thanks for your interest in contributing. Contributions are welcome at any skill level — whether you're fixing a typo, reporting a bug, or adding a feature you wish existed.

---

## Opening issues

Before opening an issue, do a quick search to see if it's already been reported.

**Bug reports** should include:
- What you did, what you expected, what actually happened
- Your OS, Node version, and terminal emulator
- A minimal reproduction if possible

**Feature requests** should explain the use case, not just the implementation. What are you trying to do, and why doesn't the current behavior work for you?

**Questions** are welcome as issues too. There are no wrong questions here.

---

## Opening pull requests

For small changes (typos, obvious bugs, minor polish), go ahead and open a PR directly.

For anything larger — new features, interaction changes, architectural shifts — **open an issue first**. This keeps us aligned on direction before you invest significant time. It's not a gate; it's a conversation.

### Setup

```bash
git clone https://github.com/IsNielsen/rove.git
cd rove
npm install
npm run dev      # Run directly with tsx (no build step)
npm run build    # Compile to dist/
```

CLI flags: `-g` (git decorations), `-d <n>` (folder depth, default 3)

### Coding style

- Match the style of existing code in `src/App.tsx` and `src/utils/`
- TypeScript — no `any` without a comment explaining why
- React + [Ink](https://github.com/vadimdemedes/ink) for all UI; if you're new to Ink, skim their docs first
- Keep it simple. `rove` has one job. New features should fit that job
- No config files required for the tool to work — don't add mandatory configuration

### Tests

There is no test framework configured. If you add tests, that's welcome — document how to run them in your PR description.

### Commit messages

- Use the imperative mood: `Add keybinding for X`, not `Added` or `Adds`
- First line ≤ 72 characters; add a blank line before any body
- Reference issues where relevant: `Fixes #12` or `Closes #34`
- No need for a scope prefix unless the PR touches multiple unrelated areas

---

## Code review

All PRs are reviewed before merging. Here's what to expect:

- I'll review within a week in most cases. If it's been two weeks without any response, ping the issue or PR with a comment.
- Feedback is about the code, not about you. If something is unclear, ask.
- I may ask for changes. This is normal — it doesn't mean the PR is rejected.
- I merge PRs myself after approval. I don't give merge rights to contributors by default.

**What I look for before merging:**
- The change does what it says it does
- No regressions to existing behavior
- Code is readable and consistent with the rest of the codebase
- If it adds behavior, there's a description of the behavior (in the PR, or in README if user-facing)

---

## If a PR stalls

If a PR is waiting on you (requested changes, open questions), I'll leave it open for **60 days** before closing it. I'll leave a comment before closing.

If a PR is waiting on me, ping after two weeks — I may have missed it.

To revive a closed PR: re-open it if the branch is still valid, or open a new one with a reference to the old one. Closed doesn't mean rejected permanently.

---

## What to contribute

- Bug fixes
- Keybinding or interaction improvements
- Git integration improvements
- Accessibility improvements
- Configuration options (colorschemes, additional ignored directories, etc.)
- Better documentation or examples
- Tests (none exist yet — all contributions welcome)

---

## License

By contributing, you agree your contributions will be licensed under the [MIT License](./LICENSE).
