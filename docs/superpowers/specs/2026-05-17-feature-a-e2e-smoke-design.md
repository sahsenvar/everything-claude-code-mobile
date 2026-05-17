# Feature A — E2E Smoke Layer — Design Spec

**Date:** 2026-05-17 · **Branch:** `feature/roadmap-abcd` · Roadmap item A (of A→B→C→D).

## Problem
420 unit/contract tests exist but nothing exercises the plugin's JS surface (hooks, MCP servers, setup/doctor) **end-to-end against a real project**. As subsystems grow, regressions in the integrated runtime path go uncaught.

## Goal
A deterministic smoke layer: (1) a committed minimal **real Android project** fixture; (2) an integration test that drives the JS runtime surface against a scaffolded project and asserts real artifacts; (3) a manual smoke checklist doc. No headless agent/LLM execution (impossible for prompt files) — scope is the JS-testable runtime.

## Non-Goals
- Running agents/commands/skills headlessly (prompt files; can't).
- Re-testing structural contracts already covered by `feature-builder.test.js`/`missing-hooks.test.js` (extend, don't duplicate).
- iOS/KMP fixtures (Android-minimal per decision).

## Decisions (locked)
- Fixture: **Android-minimal**, committed at `examples/android-smoke/` (real, reproducible).
- Smoke test = a `node:test` file in `tests/integration/` (auto-run by `npm test` via the `tests/integration/*.test.js` glob; gated by `pretest` lint).
- Reuse `tests/helpers/test-utils.js` (`createMockAndroidProject`, `cleanupDir`, `writeFiles`) for the temp scaffold; the committed `examples/android-smoke/` is the canonical human-facing fixture, asserted to be android-detectable.
- MCP smoke = spawn each `mcp-servers/*/index.js`, JSON-RPC `initialize`, assert valid response, kill (timeout-bounded, no hang).

## Architecture / Components

### 1. `examples/android-smoke/` (committed real fixture)
Minimal Android/Gradle project that `setup.js detectPlatform` → `'android'` and `utils.isAndroidProject` → true:
- `settings.gradle.kts`, `build.gradle.kts`, `app/build.gradle.kts`
- `app/src/main/AndroidManifest.xml`
- `app/src/main/java/com/example/smoke/HomeViewModel.kt`, `HomeScreen.kt` (real-ish Compose/MVI snippets)
- `README.md` (states it's a fixture for the smoke layer, not a shipped app)
Kept tiny; no gradle wrapper binary (not needed — JS surface only reads files).

### 2. `tests/integration/smoke.test.js` (`node:test`)
Drives the JS runtime against a temp project (scaffolded via `createMockAndroidProject`), asserting real behavior:
- **Hooks** (invoked as child processes with synthetic stdin JSON, `CLAUDE_PROJECT_DIR`/`CLAUDE_PLUGIN_ROOT` env set, per `missing-hooks.test.js` pattern):
  - `post-tool-use.js` with `{tool_name:'Write',tool_input:{file_path:.../HomeViewModel.kt}}` → exit 0, emits the TDD reminder line.
  - `track-build.js` with `{tool_name:'Bash',tool_input:{command:'./gradlew assembleDebug'}}` → `.claude/instincts/build-history.json` created with an event.
  - `track-focus.js` (Read) → `.claude/instincts/focus-history.json` updated.
  - `check-setup.js` (SessionStart) → exits 0; never throws (deps-missing path tolerated).
  - `pre-compact.js` (PreCompact) → a checkpoint file written under `.claude/checkpoints/`.
  - Every hook: exit code 0, no thrown error (session-safety contract).
- **doctorReport** (`scripts/lib/setup.js`) against the temp project → structured object: `platform === 'android'`, `projectDataDirs` includes `.claude/mobile-memory`, shape keys present.
- **MCP servers**: for each of `mobile-memory`, `ios-memory`, `kmp-context`: spawn `node mcp-servers/<n>/index.js`, write a JSON-RPC `initialize` request, read response within a timeout, assert `result.protocolVersion` + `result.capabilities`, kill. Skips with a clear message (not fail) if that server lacks `node_modules` (so CI without `mcp:install` doesn't false-fail) — but asserts at least the require/contract path.
- **install-mcp-deps shim**: `require()` returns `{installMcpDeps}` and does not spawn.
- **Committed fixture contract**: `examples/android-smoke/` exists and `detectPlatform(examples/android-smoke) === 'android'`.

### 3. `docs/smoke-checklist.md` (+ `docs/tr/smoke-checklist.md`)
Manual pre-release checklist: all agents discoverable, all 3 MCP servers start, `/ecc-doctor` green on a real project, hooks fire without disrupting a session, `npm test` green. Bilingual (repo convention).

## Constraints / Safety
- Deterministic: temp dirs via helpers, `afterEach` cleanup; no network; MCP spawns timeout-bounded (≤5s) and killed; no reliance on global `~/.claude`.
- Must keep full suite green (currently 420). New tests are additive.
- MCP-server smoke must **skip-not-fail** if `node_modules` absent (env-robust) while still asserting the contract path.
- No new top-level `scripts/*.js` (would dodge `lint:scripts`); logic lives in the test file + helpers.
- No changes to agents/commands/hooks.json/.mcp.json/plugin packaging.

## Testing
The deliverable *is* tests; additionally `npm test` (incl. new `tests/integration/smoke.test.js`) and `npm run verify` must pass. Determinism verified by running the smoke test twice.

## Files
| Action | Path | Responsibility |
|---|---|---|
| Create | `examples/android-smoke/**` | Committed minimal real Android fixture |
| Create | `tests/integration/smoke.test.js` | JS-runtime E2E smoke (hooks, doctor, MCP, fixture contract) |
| Create | `docs/smoke-checklist.md` + `docs/tr/smoke-checklist.md` | Manual pre-release smoke checklist (EN+TR) |
| (reuse) | `tests/helpers/test-utils.js` | Temp scaffolding (no change) |
