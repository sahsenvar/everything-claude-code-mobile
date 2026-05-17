# Feature B — Companion Bridge — Design Spec

**Date:** 2026-05-17 · **Branch:** `feature/roadmap-abcd` · Roadmap item B.

## Problem
ECC is a "full mobile dev package" but has no first-class interop with the official Atlassian/Figma/GitHub plugins. Detection groundwork shipped (`setup.js detectCompanions`); the orchestration bridges were deferred — now in scope.

## Goal
Three prompt-driven bridge **commands** that opportunistically use companion MCP tools when present and **degrade gracefully** (explain + stop, never fail) when absent:
- `/jira-feature-build <ISSUE-KEY>` — fetch the Jira issue via Atlassian MCP → feed its summary/description as the description into the existing `/feature-build` pipeline.
- `/github-pr-feature [<name>]` — after a feature build, open/update a GitHub PR for the current branch via GitHub MCP, linking the feature.
- `/figma-ui-impl <figma-url|fileKey nodeId>` — fetch design context via Figma MCP → hand it to the `ui-impl` agent as design reference.

## Non-Goals
- Bundling/vendoring the companion plugins (they are independent official plugins).
- Reimplementing companion MCP functionality.
- New agents (no `agents/*` → 27-agent test untouched).
- A shared JS bridge layer — these are prompt commands; logic stays in the command body.

## Decisions (locked)
- All 3 bridges this iteration (user choice). All soft-detect.
- Command names: `jira-feature-build`, `github-pr-feature`, `figma-ui-impl` (new domain prefixes + existing action/target suffixes, per recon).
- Soft-detect mechanism (prompt-level): the command instructs Claude to check whether the relevant companion MCP tools are available in the session; if yes, use them; if no, print a one-line "companion X not detected — install the official X plugin; skipping" and stop without error. (Mirrors the shipped `detectCompanions` philosophy; commands additionally may mention `/ecc-doctor` shows companion status.)
- Companion MCP tool references (documented in the command bodies as the tools to use *if available*): Atlassian `getAccessibleAtlassianResources` + `getJiraIssue` (cloudId, issueIdOrKey); GitHub `create_pull_request`/`pull_request_read`/`update_pull_request` (owner, repo, head, base, title, body); Figma `get_design_context` (+ `get_screenshot`) (fileKey, nodeId). External plugins — NOT added to this repo's `.mcp.json`.

## Architecture / Components
Three new `commands/*.md` files. Each: frontmatter `description` only; first body line the mandatory operating-discipline blockquote (lint-enforced by `tests/unit/setup.test.js`); a `## Soft-detect` note; `## Steps`; `## Invokes`.

1. `commands/jira-feature-build.md` — Steps: resolve Atlassian site (`getAccessibleAtlassianResources` → cloudId) → `getJiraIssue(cloudId, issueKey)` → compose a feature description from issue summary+description+acceptance criteria → invoke `/feature-build "<composed description>"`. Degrade if Atlassian absent.
2. `commands/github-pr-feature.md` — Steps: determine current branch + repo owner/name (git) → `pull_request_read` (does a PR exist for the branch?) → `create_pull_request` or `update_pull_request` with a body linking the feature/plan. Degrade if GitHub MCP absent.
3. `commands/figma-ui-impl.md` — Steps: parse a Figma URL (or accept fileKey+nodeId) → `get_design_context` (+optional `get_screenshot`) → pass the returned design context to the `ui-impl` agent as the design reference for implementation. Degrade if Figma absent.

## Constraints / Safety
- Each new command MUST contain the exact operating-discipline line (the `tests/unit/setup.test.js` convention lint asserts every `commands/*.md` includes `ecc-operating-discipline`) — else full suite fails.
- No exact command-count test exists → adding commands is safe; no `plugin.json`/manifest change.
- No agents added → `feature-builder.test.js` 27-agent assertion unaffected.
- Commands never fail the session on missing companion (graceful degrade is mandatory in the prose).
- No source/hook/.mcp.json changes; full suite stays green; docs updated (Feature B docs handled in each task).

## Testing
A new `tests/unit/bridge-commands.test.js` (node:test): for each of the 3 commands assert file exists, starts with `---` + `description:`, contains the operating-discipline line, references its companion (`getJiraIssue`/`create_pull_request`/`get_design_context` respectively) and contains soft-degrade wording (e.g. "not detected"/"skip"). Full `npm test` green.

## Files
| Action | Path | Responsibility |
|---|---|---|
| Create | `commands/jira-feature-build.md` | Jira issue → /feature-build bridge |
| Create | `commands/github-pr-feature.md` | Feature → GitHub PR bridge |
| Create | `commands/figma-ui-impl.md` | Figma design → ui-impl bridge |
| Create | `tests/unit/bridge-commands.test.js` | Contract tests for the 3 commands |
| Modify | `docs/COMMANDS.md` + `docs/tr/COMMANDS.md` | Document the 3 bridges (EN+TR) |
