# Feature G — a11y / i18n Audit Agents — Design Spec

**Date:** 2026-05-17 · **Branch:** `feature/roadmap-efg` · Roadmap item G (last of E→F→G).

## Problem
The repo has accessibility/i18n **pattern skills** (`skills/accessibility-patterns`, `skills/localization-patterns`) but no **agent** that audits a real codebase for violations and reports prioritized fixes. There's no automated a11y/i18n review path.

## Goal
Two focused reviewer agents + paired commands, single-responsibility (matching `android-reviewer`/`mobile-security-reviewer`):
- `accessibility-reviewer` + `/accessibility-review` — audits Compose/SwiftUI/KMP UI for a11y violations.
- `localization-reviewer` + `/localization-review` — audits for hardcoded strings, RTL, plurals, locale formatting.
Both cover **Android + iOS + KMP** (user choice).

## Non-Goals
- Re-teaching a11y/i18n patterns — that's the existing skills; the agents **reference** them and add the *audit/report* behavior, not duplicate guidance.
- Auto-fixing — these are reviewers (read-only audit + prioritized findings), like `mobile-security-reviewer`. (`tools` = read/scan only.)
- A combined agent (rejected; two single-responsibility agents per the repo's reviewer pattern).

## Decisions (locked)
- Two agents: `accessibility-reviewer`, `localization-reviewer` (recon-recommended; `*-reviewer` + `/*-review` mirrors `android-reviewer`↔`/android-review`).
- All platforms (Android Compose + iOS SwiftUI + KMP).
- `model: opus`, `tools: ["Read","Grep","Glob","Bash"]` (read-only auditor set, matches `android-reviewer`/`mobile-security-reviewer`).
- Each agent explicitly defers detailed remediation patterns to its sibling skill (`accessibility-patterns` / `localization-patterns`) — audit + severity-ranked findings only.

## Architecture / Components
1. `agents/accessibility-reviewer.md` — frontmatter → operating-discipline blockquote → body: role; ## When Invoked; ## Audit Checklist (Compose: missing `contentDescription` on Image/Icon, custom `Modifier.semantics`/role, heading semantics, ≥48dp touch targets, live regions; SwiftUI: `.accessibilityLabel`, Dynamic Type, ≥44pt, Reduce Motion; KMP: shared UI a11y parity) with ❌/✅ pairs; ## Severity table (🔴/🟡/🟢); ## Output Format; ## When to Use / not — and a line deferring remediation detail to the `accessibility-patterns` skill.
2. `agents/localization-reviewer.md` — same shape; checklist: no hardcoded user-facing strings (`stringResource`/`R.string` Android, `String(localized:)`/`NSLocalizedString` iOS, shared StringProvider/moko KMP), plurals (`R.plurals`/`.stringsdict`), RTL (`start/end` not `left/right`), locale-aware date/number/currency, positional format args; defers detail to `localization-patterns` skill.
3. `commands/accessibility-review.md`, `commands/localization-review.md` — frontmatter description; operating-discipline blockquote; usage (`/accessibility-review [path|branch]`); delegates to the respective agent; `## Invokes`.
4. **Count bumps:** adding 2 agents → `tests/unit/feature-builder.test.js` `30`→`31` (a11y agent task) then `31`→`32` (i18n agent task). Each co-located with its agent's task (only the number + it()-title + message; no NEW_AGENTS edit).
5. Docs: `docs/AGENTS.md`+`docs/tr/AGENTS.md` (2 agent entries), `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` (2 command rows).

## Constraints / Safety
- Each new agent + command MUST contain the exact operating-discipline line (global `setup.test.js` lint); agents need valid `name`+`description` frontmatter (`feature-builder.test.js` per-agent loop).
- Count bumps co-located with each agent add (suite never red): G-a11y agent 30→31; G-i18n agent 31→32.
- Read-only auditors (`tools` has no Write/Edit) — they report, not mutate; non-destructive by construction.
- Reference, don't duplicate, the existing `accessibility-patterns`/`localization-patterns` skills (avoid guidance drift).
- No hooks/.mcp.json/plugin/skill/source changes. Full `npm test` green after each task.

## Testing
`tests/unit/audit-agents.test.js` (node:test): each agent exists, valid frontmatter (`name`, `model: opus`, tools array, NO Write/Edit), discipline line, body covers Android+iOS+KMP audit scope (a11y: matches `/contentDescription/`,`/accessibilityLabel/`,`/48dp|44pt/`; i18n: `/stringResource|R\.string/`,`/NSLocalizedString|String\(localized/`,`/RTL|start.*end/`), and references its sibling skill; each command exists, valid, discipline line, invokes its agent. Plus `feature-builder.test.js` (32 agents) + `setup.test.js` lint green; full suite green.

## Files
| Action | Path | Responsibility |
|---|---|---|
| Create | `agents/accessibility-reviewer.md` | a11y audit (Compose/SwiftUI/KMP), read-only |
| Create | `agents/localization-reviewer.md` | i18n audit (strings/RTL/plurals/locale), read-only |
| Create | `commands/accessibility-review.md` | `/accessibility-review` → a11y agent |
| Create | `commands/localization-review.md` | `/localization-review` → i18n agent |
| Create | `tests/unit/audit-agents.test.js` | Contract tests (2 agents + 2 commands) |
| Modify | `tests/unit/feature-builder.test.js` | Bump agent count 30 → 31 → 32 |
| Modify | `docs/AGENTS.md`+`docs/tr/AGENTS.md`, `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` | Document 2 agents + 2 commands (EN+TR) |
