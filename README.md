# stale-branches

Interactive CLI to list and delete stale git branches. Shows each branch's age, merge status, and last commit — then lets you delete them all in one session, local and remote.

```
npx stale-branches
```

## What it looks like

```
  Fetching branch info...

  Branch                          Age         Status       Last Commit
  ────────────────────────────────────────────────────────────────────────────────────
  feature/old-login               47 days     merged       fix auth redirect
  chore/update-deps               61 days     merged       bump lodash to 4.18
  experiment/dark-mode            23 days     unmerged     wip: toggle styles

  Space to select, A to select all, Enter to confirm
  ❯ ◉ feature/old-login
    ◉ chore/update-deps
    ◯ experiment/dark-mode

  ✓ Deleted feature/old-login (local + remote)
  ✓ Deleted chore/update-deps (local)
  ✗ experiment/dark-mode — skipped
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

# Delete remote branches without asking per-branch
stale-branches --remote
```

## Flags

| Flag | Description |
|------|-------------|
| `--merged` | Show only merged branches |
| `--dry-run` | Print what would be deleted, don't delete anything |
| `--days <n>` | Only show branches older than n days (default: 0) |
| `--remote` | Delete remote branches automatically without per-branch confirmation |

## Behaviour

- **Protected branches** — never shown or touched: `main`, `master`, `develop`, `dev`, `staging`, `production`, and your currently checked-out branch
- **Merged branches** — pre-selected by default (safe to delete)
- **Unmerged branches** — shown in red, not pre-selected, require an extra confirmation prompt
- **Remote deletion** — asked per branch unless `--remote` is passed
- **Branch names** — sanitized before passing to git to prevent command injection

## Requirements

- Node.js >= 18
- Git

## License

MIT
