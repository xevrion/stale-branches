# stale-branches

Interactive CLI to list and delete stale git branches. Shows each branch's age, merge status, and last commit — then lets you delete them all in one session, local and remote.

```
npx stale-branches
```

## What it looks like

```
  Fetching branch info...

Branch                          Age         Status       Last Commit
───────────────────────────────────────────────────────────────────────────────────────────────────
spotify-fix                     2 months    merged       fix: fixed the position of the status text
test/handDrawnAnimations        8 days      merged       feat: add handwritten hint annotations on…
test/postHandwritingData        7 days      merged       fix: improve mobile menu backdrop opacity…
github-calendar                 2 months    unmerged     feat: added github calendar but worst sty…

? Select branches to delete (Space to toggle, A to select all, Enter to confirm, Q to quit):
❯◉ spotify-fix                     2 months    merged      fix: fixed the position of the status t…
 ◉ test/handDrawnAnimations        8 days      merged      feat: add handwritten hint annotations …
 ◉ test/postHandwritingData        7 days      merged      fix: improve mobile menu backdrop opaci…
 ◯ github-calendar                 2 months    unmerged    feat: added github calendar but worst s…

↑↓ navigate • space select • a all • i invert • q/ctrl+c exit • ⏎ submit

? Also delete remote counterparts for: test/handDrawnAnimations, test/postHandwritingData? Yes

  ✓ Deleted test/handDrawnAnimations (local + remote)
  ✓ Deleted test/postHandwritingData (local + remote)
```

## Install

```bash
# Run without installing
npx stale-branches

# Or install globally
npm install -g stale-branches
```

## Usage

```bash
# Interactive mode — shows all non-protected branches
stale-branches

# Only show merged branches
stale-branches --merged

# Only show branches older than 30 days
stale-branches --days 30

# Preview what would be deleted without actually deleting
stale-branches --dry-run

# Delete remote branches without asking
stale-branches --remote
```

## Flags

| Flag | Description |
|------|-------------|
| `--merged` | Show only merged branches |
| `--dry-run` | Print what would be deleted, don't delete anything |
| `--days <n>` | Only show branches older than n days (default: 0) |
| `--remote` | Delete remote branches automatically without confirmation |

## Behaviour

- **Protected branches** — never shown or touched: `main`, `master`, `develop`, `dev`, `staging`, `production`, and your currently checked-out branch
- **Merged branches** — pre-selected by default (safe to delete)
- **Unmerged branches** — shown in red, not pre-selected, require an extra confirmation prompt
- **Remote deletion** — asked once for all selected branches that have remotes, unless `--remote` is passed
- **Branch names** — sanitized before passing to git to prevent command injection

## Requirements

- Node.js >= 20
- Git

## License

MIT
