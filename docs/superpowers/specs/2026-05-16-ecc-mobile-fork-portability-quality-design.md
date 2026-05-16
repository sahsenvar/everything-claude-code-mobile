# Design: Personal Fork — Portability Repair + Content Quality

**Date:** 2026-05-16
**Status:** Approved (design); pending implementation plan
**Status update (2026-05-16):** Plan 1 (portability + plugin wiring) + working-plugin finalize: DONE. Plugin installs from the fork (v1.2.1) with Agents (27), Skills (81), Hooks (3), MCP (3) all loading; MCP servers start after `npm run mcp:install`; PostToolUse dispatcher verified. Phase 4 (deep content-quality review of stack-relevant skills/agents/commands) deferred to its own Plan 2 cycle.
**Repo:** `sahsenvar/everything-claude-code-mobile` (fork of `ahmed3elshaer/everything-claude-code-mobile`)
**Local:** `~/Developer/everything-claude-code-mobile`, branch `fix/portability-and-quality` off canonical `main` (v1.1.5)

## 1. Goal

Maintain a personal fork of the `everything-claude-code-mobile` Claude Code plugin: fix the bugs that prevent it from working when installed as a plugin, deeply review and improve the content relevant to the maintainer's stack, and install it into Claude Code from the maintainer's own GitHub — while keeping the ability to merge future upstream improvements.

## 2. Context & Constraints

**Maintainer's KMP stack (drives content-review priority):** Koin (DI), Ktor (networking), MVI, SQLDelight; mixed UI — Compose Multiplatform *and* native SwiftUI (both critical).

**Security review of upstream (snapshot):** All `child_process`/`execSync` usage in hook scripts and the 3 MCP servers is hardcoded git read commands (`git status`, `git diff`, `git rev-parse`). No network calls, no credential/SSH/secret access, no exfiltration. MCP servers only read/write local `.claude/*-memory` dirs. Risk assessed low for the reviewed snapshot; future upstream merges are not auto-vetted.

**Key technical findings that shape the work:**

1. **Hooks & MCP servers do not load when installed as a plugin.** `.claude-plugin/plugin.json` declares only `skills`, `agents`, `commands`. There is no `hooks` key, no `mcpServers` key, no root `.mcp.json`, no auto-discovered plugin-format `hooks/hooks.json`.
2. **Hook JSON is in the wrong schema.** Existing `hooks/*.json` use an array form `{"hooks":[{"event":"Stop",...}]}`. The current Claude Code plugin hook schema is event-keyed: `{"hooks":{"Stop":[{"matcher":...,"hooks":[...]}]}}`. Files must be converted, not just path-patched.
3. **Hardcoded absolute paths.** `hooks/checkpoint-hooks.json`, `hooks/extended/instinct-hooks.json`, and `mcp-configs/*.json` reference `/Users/ah3sh/Developer/everything-claude-code-mobile/...`. Correct portable variable is `${CLAUDE_PLUGIN_ROOT}` (plugin dir); also available: `${CLAUDE_PROJECT_DIR}` (user project), `${CLAUDE_PLUGIN_DATA}` (persistent plugin state). Hook/MCP working directory defaults to the user's project, not the plugin dir.
4. **Missing hook scripts.** Referenced but absent: `scripts/hooks/evaluate-ios-session.js`, `pre-compact-ios.js`, `track-build.js`, `track-focus.js`. Their siblings (`evaluate-session.js`, `pre-compact.js`, `v2-analysis.js`) exist and serve as templates.
5. **Low-value noisy hooks.** e.g. iOS hook greps `!` in every `.swift` file — matches almost everything.

**Decisions locked during brainstorming:**
- Host on maintainer's GitHub fork; keep `upstream` remote for future merges.
- Critical fixes applied repo-wide; deep content-quality review scoped to the maintainer's stack.
- Keep AND fix the entire instinct / memory / continuous-learning subsystem (incl. 3 MCP servers and all hooks).
- Execution approach **A** (phased: repair → wire → early install/smoke test → content review → finalize).

## 3. Repository Structure & Workflow

- `main` stays a clean mirror of `upstream/main` (enables clean `git merge upstream/main`).
- All fork changes on `fix/portability-and-quality`; phases land as separate, individually-verified commits; merge to `main` when validated.
- `FORK-NOTES.md` documents divergence from upstream and the upstream-merge procedure.

## 4. Phases

### Phase 1 — Portability repair (repo-wide)
- Replace every `/Users/ah3sh/Developer/...` path with `${CLAUDE_PLUGIN_ROOT}/...` in hook and MCP config files.
- Convert all hook definitions (`hooks.json`, `hooks-ios.json`, `checkpoint-hooks.json`, `extended/instinct-hooks.json`) into the current event-keyed plugin hook schema, consolidated into a single coherent `hooks/hooks.json`, de-duplicating overlapping triggers.
- Write the 4 missing scripts (`evaluate-ios-session.js`, `pre-compact-ios.js`, `track-build.js`, `track-focus.js`) modeled on existing siblings.
- Harden script root resolution in `scripts/lib/utils.js`: plugin-bundled files via `process.env.CLAUDE_PLUGIN_ROOT`; user-project files via `CLAUDE_PROJECT_DIR`/cwd.
- Narrow low-value/noisy matchers (e.g. Swift `!` grep).

### Phase 2 — Wire hooks + MCP into the plugin (keep all 3 MCP servers)
- Register hooks via the auto-discovered plugin-format `hooks/hooks.json`, and MCP servers via a root `.mcp.json`. (File-based over plugin.json keys: keeps `plugin.json` minimal and the configs reviewable in isolation.)
- MCP `args` → `${CLAUDE_PLUGIN_ROOT}/mcp-servers/<server>/index.js`; state dir → `${CLAUDE_PLUGIN_DATA}` or project `.claude/`.
- Move non-standard keys (`capabilities`, `memoryTypes`, embedded `hooks`) out of `mcp-configs/*.json` into docs; keep the real MCP config minimal.
- `npm install` per server (lockfiles present); manual start smoke test per server.

### Phase 3 — Early install & smoke test
- Install from the maintainer's fork: `/plugin marketplace add sahsenvar/everything-claude-code-mobile` + `/plugin install`.
- Verify: skills/agents/commands listed; at least one hook fires; each MCP server connects.
- `npm test`, `npm run lint:scripts`, `npm run lint:json` green.
- On failure, return to Phase 2.

### Phase 4 — Deep content-quality review (maintainer's stack)
- **Scope:** Koin, Ktor, MVI, SQLDelight + Compose + SwiftUI + KMP infra skills and their bound agents/commands — concretely: `kmp-di`, `kmp-networking`, `kmp-repositories`, `kmp-navigation`, `expect-actual`, `offline-first`, `mvi-architecture`, `ktor-patterns`, `koin-patterns`, `sqldelight-patterns`, `jetpack-compose`, `navigation-compose`, `swift-patterns`, `swiftui-patterns`, `combine-framework`, `core-data`.
- **Rubric:** correctness/currency (library versions), compilability, KMP idiom (expect/actual, source sets), cross-artifact consistency (skill ↔ agent ↔ command), security (no anti-pattern advice), completeness/contradictions. Reuse the repo's existing skill-review methodology in `docs/` if present.
- **Execution:** per-domain batches; each batch = its own commit + short change note; fix → verify within each batch.
- Out-of-stack skills receive only Phase 1 critical fixes (no deep content rework).

### Phase 5 — Finalize
- Final install verification; update `FORK-NOTES.md` and `docs/installation.md`; document the upstream-merge procedure.
- Version bump (e.g. `1.1.5` → `1.2.0-fork.1`); set `plugin.json`/`marketplace.json` author/repo to the maintainer's account, keep upstream link as a note.

## 5. Validation Strategy

Every phase: `npm test`, `npm run lint:scripts`, `npm run lint:json`. From Phase 3 onward: real Claude Code install smoke test each phase.

## 6. Out of Scope (YAGNI)

- No new skills/agents/commands.
- No deep content rework of out-of-stack artifacts.
- No PR/contribution back to upstream (personal fork).
- No `delete_repo` automation — the stray `ssenvar/everything-claude-code-mobile` fork is deleted manually by the maintainer.
