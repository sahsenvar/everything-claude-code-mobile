---
description: Open or update a GitHub pull request for the current feature branch via the GitHub companion MCP (if installed). Links the feature/plan in the PR body. Degrades gracefully if GitHub MCP is absent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Feature → GitHub PR

Open/refresh a PR for the feature you just built. Usage: `/github-pr-feature [feature-name]`

## Soft-detect

Needs the official **GitHub** companion plugin (independent of ECC; not bundled). If its MCP tools are unavailable, print:
`GitHub companion not detected — install the official GitHub plugin (see /ecc-doctor); skipping PR step.`
…then stop without error. Never fail the session.

## Steps

1. If GitHub MCP tools are unavailable → soft-degrade message above, stop.
2. Determine `owner`/`repo` from `git remote get-url origin` and the current branch from `git rev-parse --abbrev-ref HEAD`. Do not push or change git state here.
3. Check for an existing PR for the branch via `pull_request_read` (list/get for `head = owner:branch`).
4. If none: `create_pull_request` with `{ owner, repo, head: branch, base: "main", title, body }` where the body links the feature name/plan and summarises the change. If one exists: `update_pull_request` to refresh the body.
5. Report the PR URL/number and whether it was created or updated.

## Invokes

- GitHub companion MCP (`pull_request_read`, `create_pull_request`, `update_pull_request`) — external, optional
