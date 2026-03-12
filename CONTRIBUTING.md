# Contributing to stale-branches

Thank you for taking the time to contribute. This document covers everything you need to get started.

---

## Table of Contents

- [Setup](#setup)
- [Running tests](#running-tests)
- [Running the linter](#running-the-linter)
- [How to add a feature](#how-to-add-a-feature)
- [Commit message format](#commit-message-format)
- [Pull request process](#pull-request-process)

---

## Setup

Node.js 20 or higher is required.

```bash
git clone https://github.com/xevrion/stale-branches.git
cd stale-branches
npm install
```

Build the project:

```bash
npm run build
```

You can run the CLI locally without installing it globally:

```bash
node dist/index.js
```

---

## Running tests

```bash
npm test
```

Tests are written with [Vitest](https://vitest.dev/) and live in the `tests/` directory. Every exported function must have a corresponding test.

The test matrix runs on Node 20 and 22 in CI.

---

## Running the linter

```bash
npm run lint
```

The project uses ESLint v10 with `@typescript-eslint` in flat config format (`eslint.config.js`). Lint runs on `src/**/*.ts` only.

Fix lint errors before opening a PR. Warnings are acceptable but errors will block CI.

---

## How to add a feature

The codebase is split into focused modules. Before touching any file, read it fully. The responsibilities are:

| File | Responsibility |
|---|---|
| `src/types.ts` | `BranchInfo` and `Config` type definitions — no logic |
| `src/git.ts` | All git operations via `spawnSync` — `listBranches`, `getMergeStatus`, `getLastCommit`, `getAgeDays`, `deleteBranch`, `deleteRemoteBranch`, `hasRemote` |
| `src/format.ts` | Pure formatting utilities — `formatAge(days)`, `truncate(str, n)`, `renderTable(branches)` |
| `src/prompt.ts` | Interactive UI — `buildChoices(branches)`, `promptCheckbox(choices)` using `@inquirer/checkbox` |
| `src/index.ts` | CLI entry point — parses flags, orchestrates the git → prompt → delete flow |

Rules to follow:

- All source code goes in `src/` only.
- Use named exports only — no default exports.
- Keep files under 400 lines; extract utilities when a file grows large.
- All git operations must go through `src/git.ts` and must sanitize branch names via `sanitizeBranch()`.
- Never mutate existing objects — return new copies.
- Handle errors explicitly at every level; never swallow errors silently.
- Write tests first (TDD): red → green → refactor.
- Every exported function must have a test before the PR is merged.

---

## Commit message format

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

<optional body — explain the why, not the what>
```

Valid types:

| Type | When to use |
|---|---|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `refactor` | Code change that is neither a feature nor a bug fix |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build process, dependency updates, config changes |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

Examples:

```
feat: add --sort flag to order branches by age or name

fix: handle branches with special chars in sanitizeBranch regex

test: add edge case coverage for getAgeDays when timestamp is zero

chore: update @inquirer/checkbox to v5
```

Keep the subject line under 72 characters. Use the body to explain motivation when the change is non-obvious.

---

## Pull request process

1. Fork the repository and create a branch from `main`.
2. Name your branch descriptively: `feat/sort-flag`, `fix/regex-escape`, etc.
3. Make sure `npm test` and `npm run lint` both pass locally before pushing.
4. Open a pull request against `main`. Fill in the PR template completely.
5. At least one approval is required before merging.
6. Squash-merge is preferred for feature branches to keep `main` history clean.

If your PR adds a new CLI flag or changes user-facing behavior, update `CLAUDE.md` under "Current features" and "CLI flags".
