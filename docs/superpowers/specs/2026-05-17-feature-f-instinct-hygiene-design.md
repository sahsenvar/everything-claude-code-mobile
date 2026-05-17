# Feature F — Instinct Hygiene — Design Spec

**Date:** 2026-05-17 · **Branch:** `feature/roadmap-efg` · Roadmap item F (of E→F→G).

## Problem
The continuous-learning system accrues instincts (`~/.claude/instincts/mobile-instincts.json`) with confidence + decay, but **nothing curates them**: `decayUnusedInstincts()` exists yet no command calls it; `/instinct-status` only lists; there's no prune/health view. Stale/low-confidence instincts accumulate and quietly degrade reuse quality.

## Goal
1. `/instinct-review` — report instinct health + prunable candidates; **report-first**, prune only on explicit confirmation, always with a `.bak` backup (the user data is global → non-destructive by default, per the established repo philosophy).
2. Surface an `instincts` health summary in the shipped `doctorReport`/`/ecc-doctor`.

## Non-Goals
- Team registry / cross-machine sync (export/import already exist via `/instinct-export`/`/instinct-import`; out of scope).
- Auto-pruning without consent (rejected per the user's non-destructive principle).
- Re-implementing decay (`decayUnusedInstincts` exists; reuse it conceptually, don't fork it).
- A new agent (command + lib only → no `feature-builder.test.js` count change).

## Decisions (locked)
- Safety = **report-first + confirmed prune + `.bak` backup** (user choice; mirrors Setup&Health's non-destructive ethos).
- Command `/instinct-review` (consistent with the `/instinct-*` family).
- Health/prune logic lives as **pure functions** in `scripts/lib/instincts.js` (operate on the loaded data object → deterministic, unit-testable, no fs in the core).
- `doctorReport` gets an **injectable `instinctsFile`** param (like `pluginsFile` for companions) so existing `setup.test.js` doctorReport tests stay deterministic.

## Architecture / Components
1. **`scripts/lib/instincts.js`** — add two pure exports (keep all existing exports unchanged):
   - `instinctHealth(data)` → `{ total, confident, stale, lowConfidence, prunable }` where `confident` = confidence ≥ 0.7, `stale` = `lastUsed` older than 60 days, `lowConfidence` = confidence < 0.3, `prunable` = stale OR lowConfidence. Tolerates `data` null / `{instincts:[]}` / missing fields → zeros.
   - `selectPrunable(data, { maxConfidence = 0.3, staleDays = 60 } = {})` → array of the prunable instinct objects (those that are lowConfidence OR stale). Pure; no fs.
2. **`scripts/lib/setup.js` `doctorReport`** — add optional `instinctsFile` param (default `path.join(getInstinctsDir(), 'mobile-instincts.json')` via the existing utils path helper); read it with `readJsonFile`; add `instincts: instinctHealth(loaded || {instincts:[]})` to the returned object. All other fields/behaviour byte-unchanged. Existing setup.test.js doctorReport tests do not assert exhaustive keys → adding `instincts` does not break them; new F tests inject `instinctsFile` for determinism.
3. **`commands/instinct-review.md`** — frontmatter description; operating-discipline blockquote; `## Usage` (`/instinct-review` = report only; `/instinct-review --prune` = report then ask explicit confirmation); `## Steps`: loadInstincts → `instinctHealth`+`selectPrunable` → print health + prunable list → **default: stop (report only)**; on `--prune` + explicit user "yes": copy `mobile-instincts.json` → `mobile-instincts.json.bak`, remove prunable, `saveInstincts`, report counts; `## Invokes` (`scripts/lib/instincts.js`).
4. Docs: `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` (new `/instinct-review` row in the learning/instinct group); update the `/ecc-doctor` row/desc (EN+TR) to note it now reports instinct health.

## Constraints / Safety
- New command MUST contain the exact operating-discipline line (global `setup.test.js` lint).
- Pruning is NEVER the default and NEVER unconfirmed; a `.bak` is written before any destructive write to the user's global instinct store. `/instinct-review` with no flag never writes.
- `instinctHealth`/`selectPrunable` are pure (no fs/path/global state) → deterministic tests.
- `doctorReport` change is additive + injectable → existing tests stay green; verify by running `setup.test.js` after F-T2.
- No agent, no hooks/.mcp.json/plugin/skill changes. Full `npm test` green after each task.

## Testing
`tests/unit/instinct-hygiene.test.js` (node:test): `instinctHealth` (empty/null, mixed confidences+ages → correct counts), `selectPrunable` (returns exactly the lowConfidence|stale set, threshold params honored, pure/no mutation of input), `doctorReport` with injected `instinctsFile` (missing → instincts all-zero; populated synthetic → expected health; existing keys still present), command contract (`commands/instinct-review.md` exists, valid frontmatter, discipline line, report-first wording + `.bak` + invokes instincts.js). Existing `tests/unit/scripts.test.js` instinct tests + `setup.test.js` doctorReport tests stay green (unchanged).

## Files
| Action | Path | Responsibility |
|---|---|---|
| Modify | `scripts/lib/instincts.js` | + `instinctHealth`, `selectPrunable` (pure) |
| Modify | `scripts/lib/setup.js` | `doctorReport` + injectable `instinctsFile` + `instincts` field |
| Create | `commands/instinct-review.md` | Report-first hygiene command (confirmed prune + .bak) |
| Create | `tests/unit/instinct-hygiene.test.js` | Unit + contract tests |
| Modify | `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` | Document `/instinct-review`; note `/ecc-doctor` instinct health (EN+TR) |
