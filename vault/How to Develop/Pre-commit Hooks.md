---
title: Pre-commit Hooks
tags: [dev, git, quality, husky]
icon: git-commit-horizontal
---

# Pre-commit Hooks

Obsidian Site uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged) to run quality checks before every commit.

## What runs on commit

When you `git commit`, the following checks run automatically on **staged TypeScript/TSX files**:

1. **`tsc --noEmit`** — Full type-check of the project. Fails on any type error.
2. **`vitest run`** — Entire test suite. Fails if any test fails.

If either check fails, the commit is aborted and the error is displayed.

## CI environments

The hook is **skipped automatically in CI environments** (e.g. GitHub Actions, Vercel). It checks for the `CI` environment variable:

```sh
# .husky/pre-commit
[ -n "$CI" ] && exit 0
npx lint-staged
```

This prevents double-running tests during automated builds.

## Configuration

The lint-staged config lives in `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": "bash -c 'npx tsc --noEmit && npx vitest run'"
  }
}
```

The `bash -c '...'` wrapper prevents lint-staged from passing the staged file list as arguments to `tsc` and `vitest` (both operate on the whole project, not individual files).

## Installation

Husky is installed automatically during `npm install` via the `prepare` lifecycle hook:

```json
{
  "scripts": {
    "prepare": "husky"
  }
}
```

If you cloned the repo and the hook isn't running, re-run:

```bash
npm install
```

Or manually initialize Husky:

```bash
npx husky init
```

## Modifying the hooks

The pre-commit hook file is at `.husky/pre-commit`. Edit it to change what runs:

```sh
# .husky/pre-commit

# Skip in CI
[ -n "$CI" ] && exit 0

# Run lint-staged (tsc + vitest on staged .ts/.tsx files)
npx lint-staged

# Optionally add more checks:
# npx astro check   # Astro type checking
```

## Bypassing the hook

If you need to commit without running the checks (e.g. WIP commit):

```bash
git commit --no-verify -m "WIP: work in progress"
```

> [!warning] Use sparingly
> Bypassing the hook regularly defeats its purpose. Reserve `--no-verify` for temporary commits you intend to amend or squash before merging.

## Adding a pre-push hook

To also run checks before `git push`, create `.husky/pre-push`:

```bash
npx husky add .husky/pre-push '[ -n "$CI" ] && exit 0; npm test'
```
