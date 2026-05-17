# ECC-Mobile "Setup & Health" — Design Spec

**Date:** 2026-05-17
**Status:** Approved (brainstorming) — pending user spec review → writing-plans
**Branch:** `feature/ecc-setup-health`
**Supersedes scope of:** roadmap items #1 (frictionless setup), #2 (`/ecc-doctor`), #3 (rules without copy)

---

## 1. Problem

Installing the `everything-claude-code-mobile` plugin currently requires four manual steps with real friction (verified by recon):

1. `/plugin marketplace add …` then `/plugin install …` (two commands).
2. `cd ~/.claude/plugins/cache/*/everything-claude-code-mobile/*/` — an opaque glob the user must resolve by hand.
3. `npm run mcp:install` — a separate, manual, easily-forgotten step; if skipped the 3 project-memory MCP servers silently never start.
4. No verification or feedback that any of this succeeded; the optional discipline `rules/` require a *separate* `git clone` + copy into `~/.claude/rules/`.

There is also no clean uninstall story, and no first-class way for the plugin to interoperate with companion official plugins (Jira/Atlassian, Figma, GitHub) without vendoring them.

## 2. Goals

- Reduce install to: `/plugin install` → **`/ecc-setup`** (one command) → verified.
- Provide **`/ecc-doctor`**: an at-a-glance health + companion-integration report.
- A SessionStart nudge so a missing-deps install is never silently forgotten — **detection only**, never an unprompted side effect.
- Let users benefit from the discipline `rules/` **without any file copy**, so uninstall stays trivially clean (`/plugin uninstall`, zero residue).
- Make companion interop concrete (detect + report + document) without bundling those plugins.

## 3. Non-Goals (explicitly out of scope)

- **Bridge orchestration commands** (`/feature-from-ticket`, Figma design-handoff, etc.) — deferred to a separate roadmap item with its own spec/plan (Tier-2 capability).
- Any write to `~/.claude/` (global user config) — never touched.
- Auto-installing companion plugins, or reimplementing their MCP functionality.
- Auto-running `npm install` from a hook (rejected during brainstorming; bootstrap is detection-only).
- A bespoke `/ecc-uninstall` + install manifest + `.bak` machinery — eliminated because nothing is copied (see §5.5).

## 4. Constraints / Principles (all preserved)

- Zero global-config mutation; zero file copy into the user's machine config.
- Idempotent: every command re-runnable with no duplication or drift.
- SessionStart hook is detection-only and session-safe (errors swallowed, implicit exit 0, no network).
- Reuse existing infrastructure: `scripts/install-mcp-deps.js` logic, `scripts/lib/*`, `node:test` harness, `${CLAUDE_PLUGIN_ROOT}` path portability.
- No `agents`/`skills`/`commands`/`hooks` keys added to `plugin.json` (auto-discovery contract preserved).
- Token discipline: rules apply only while ECC's own agents/commands run, not session-wide.

## 5. Architecture

A shared, pure, unit-tested Node library (`scripts/lib/setup.js`) holds all logic. Thin consumers — two slash commands and one SessionStart hook — call into it. This matches the repo's established `scripts/lib/` + `scripts/hooks/` + `commands/*.md` pattern (verified).

```
scripts/lib/setup.js  ── detectState() ─┐
                       ── installMcpDeps() ─┤
                       ── doctorReport() ───┼─< commands/ecc-setup.md
                       ── detectCompanions()┘   commands/ecc-doctor.md
                                                scripts/hooks/check-setup.js (SessionStart)
skills/ecc-operating-discipline/SKILL.md  ← referenced by ECC agents/commands (new convention)
scripts/install-mcp-deps.js  → thin CLI shim over setup.installMcpDeps() (refactor, behavior-preserving)
```

### 5.1 `scripts/lib/setup.js` (new, pure, testable)

Single responsibility: install/health primitives. No side effects at require time. Exported functions:

- `detectState({ pluginRoot, projectDir })` → `{ mcpDeps: { 'mobile-memory': bool, 'ios-memory': bool, 'kmp-context': bool }, platform: 'android'|'ios'|'kmp'|'unknown', hooksRegistered: bool, disciplineSkillPresent: bool }`. "deps present" = the server dir has a `node_modules/` (cheap fs check); platform reuses existing `scripts/lib/utils.js` detection.
- `installMcpDeps({ pluginRoot })` → runs the existing per-server `npm ci`/`npm install --omit=dev` loop (logic moved here verbatim from `install-mcp-deps.js`), returns `{ perServer: { name: 'installed'|'skipped'|'failed', error? } }`. Never throws to the caller; aggregates failures.
- `doctorReport({ pluginRoot, projectDir })` → a structured report object consumed by `/ecc-doctor` (MCP deps per server, hooks registered, platform, discipline skill present, companions, and an informational list of project data dirs `/plugin uninstall` will NOT remove).
- `detectCompanions()` → reads `~/.claude/plugins/installed_plugins.json` (verified reliably readable) and maps known companion plugin name-prefixes to `present|absent`. Recognized: Figma, Atlassian/Jira, GitHub. Matching is by plugin-name prefix within the `plugins` object keys, tolerant of the `@<marketplace>` suffix and version drift. If the file is missing/unparseable → all `unknown` (never throws).

> **Implementation micro-recon (scoped, not a placeholder):** the exact key strings for the Atlassian and GitHub official plugins must be read from the live `~/.claude/plugins/installed_plugins.json` at implementation time (the Figma key `figma@claude-plugins-official` is confirmed). Matching is prefix-based so version/marketplace drift does not break it; the recon is only to seed the recognized-prefix list accurately.

### 5.2 `commands/ecc-setup.md` (new)

Frontmatter: `description` only (matches verified command convention). Body instructs Claude to:

1. Resolve plugin root via `${CLAUDE_PLUGIN_ROOT}` (no glob `cd` for the user).
2. Run `detectState`; print a **preview** of what will run.
3. Call `installMcpDeps`; surface per-server result.
4. Run `detectState` again to **verify**; print a green/red summary and, on any failure, the exact manual command to retry that one server.

Idempotent: if deps already present it reports "already set up" and exits without reinstalling. No rules copying anywhere.

### 5.3 `commands/ecc-doctor.md` (new)

Frontmatter: `description` only. Body runs `doctorReport` and prints a green/red report:

- Each MCP server: deps present? `index.js` resolvable?
- Hooks registered (incl. the new SessionStart entry)?
- Detected platform.
- `ecc-operating-discipline` skill present?
- **Companion integrations:** Figma / Atlassian (Jira) / GitHub — ✓ present / ✗ absent, with the exact `/plugin install` line to add each missing one.
- Informational: project data dirs (`.claude/mobile-memory`, `.claude/ios-memory`, `.claude/kmp-context`, `.claude/checkpoints`) that `/plugin uninstall` will not remove — these are user data; the user deletes them manually only if desired.

Every red line includes its fix. Read-only; no mutations.

### 5.4 `scripts/hooks/check-setup.js` (new, SessionStart)

Follows the verified hook skeleton (`main()`, `require('../lib/...')`, errors caught + logged, no `process.exit(1)`, session-safe). Detection only: calls `detectState`; if any MCP server's deps are missing, prints exactly one line to stdout so the model sees it:

```
⚠ ECC: MCP server dependencies missing — run /ecc-setup to install
```

(English, to match the existing hook scripts' output convention, e.g. `📊 Build event tracked`.) Never installs, no network, never fails the session. Registered in `hooks/hooks.json` by adding a new top-level `SessionStart` block (none exists today) matching the verified entry shape:

```json
"SessionStart": [
  { "hooks": [ { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check-setup.js\"" } ] } ]
```

### 5.5 `skills/ecc-operating-discipline/SKILL.md` + activation convention (no copy)

The discipline content currently in `rules/` becomes a **plugin-native skill**: `skills/ecc-operating-discipline/SKILL.md` (directory + `SKILL.md`, frontmatter `name` + `description` only — matches verified convention). The raw `rules/` directory stays as optional human reference; it is no longer something to "install".

Because recon confirmed there is **no pre-existing convention** for an agent/command to pull in a *skill* (existing commands only list *agents* under `## Invokes`), this spec **introduces one explicit, minimal convention**:

- Every ECC-authored agent (`agents/*.md`) and command (`commands/*.md`) gains one standard line in its body:
  `> Operate under the \`ecc-operating-discipline\` skill (token discipline, lean commands, build/log hygiene).`
- A `node:test` unit/lint test asserts this line is present in every `agents/*.md` and `commands/*.md` (so future additions can't silently drop it).

Effect: when any ECC agent/command runs, the model invokes the discipline skill; the skill's `description` also makes it model-discoverable. Zero copy, zero global mutation; uninstall removes the plugin and everything goes with it.

### 5.6 `scripts/install-mcp-deps.js` refactor (behavior-preserving)

The script currently has no exports and no `require.main` guard. Refactor: move the install loop into `scripts/lib/setup.js`'s `installMcpDeps()`; reduce `scripts/install-mcp-deps.js` to a thin CLI shim:

```js
#!/usr/bin/env node
const { installMcpDeps } = require('./lib/setup');
const paths = require('./lib/paths'); // existing plugin-root resolver; use that module's actual exported symbol
if (require.main === module) { installMcpDeps({ pluginRoot: paths.<pluginRootResolver>() }); }
```

> The plugin-root resolver already lives in `scripts/lib/paths.js` (verified to exist for "plugin root & project dir resolution"); the implementation plan binds `<pluginRootResolver>` to that module's actual exported name — this spec does not invent an API.

`package.json`'s `"mcp:install": "node scripts/install-mcp-deps.js"` is unchanged and behaves identically (verified: it points at this file). DRY: one implementation, two entry points (`/ecc-setup` and the CLI).

### 5.7 Documentation

- `README.md` + `README.tr.md`: install section 4 steps → 2 (`/plugin install` → `/ecc-setup`); add an "Uninstall / Kaldırma" line = just `/plugin uninstall` (clean; only noted project data dirs remain, user-owned); add "Recommended companion plugins / Önerilen tamamlayıcı eklentiler" (Figma, Atlassian, GitHub — independent official plugins; ECC runs alongside, does not bundle).
- `docs/COMMANDS.md` + `docs/tr/COMMANDS.md`: add `/ecc-setup`, `/ecc-doctor`.
- `docs/SKILLS.md` + `docs/tr/SKILLS.md`: add `ecc-operating-discipline`.
- `docs/HOOKS-AND-MCP.md` + `docs/tr/HOOKS-AND-MCP.md`: add the SessionStart `check-setup.js` handler.

## 6. Naming Decision

New commands use the `ecc-` prefix (`ecc-setup`, `ecc-doctor`). Rationale: existing commands are platform/action scoped (`android-*`, `ios-*`, `kmp-*`, `mobile-*`, `feature-*`); these two are **plugin-wide** lifecycle/health, not platform-specific, so a distinct `ecc-` namespace is clearer than overloading `mobile-*`. No `ecc-*` command exists today (verified) — no collision.

## 7. Data Flow

`/ecc-setup`: command → `detectState` → preview → `installMcpDeps` → re-`detectState` (verify) → summary.
`/ecc-doctor`: command → `doctorReport` (which internally calls `detectState` + `detectCompanions`) → rendered green/red report.
SessionStart: `check-setup.js` → `detectState` → (deps missing?) one-line nudge → exit 0.
All read `${CLAUDE_PLUGIN_ROOT}` for the plugin root and the active project dir via the existing `scripts/lib/paths.js`.

## 8. Error Handling

- `installMcpDeps`: per-server try/catch; one server's failure does not abort the others; failures aggregated and surfaced by `/ecc-setup` and `/ecc-doctor` with the exact retry command.
- `detectCompanions`: missing/unparseable `installed_plugins.json` → all `unknown`, never throws.
- `check-setup.js`: top-level catch logs and returns; never `exit(1)`; no network; cannot disrupt the session.
- `/ecc-doctor`: read-only; if a probe fails it renders that line red with the fix, never mutates.

## 9. Testing

`tests/unit/setup.test.js` (`node:test` + `node:assert`, requiring `../../scripts/lib/setup`):

- `detectState`: deps-present vs deps-missing (fs-mocked server dirs); platform mapping; flags.
- `installMcpDeps`: success / one-server-failure aggregation (child-process mocked); never throws.
- `detectCompanions`: present / absent / file-missing / unparseable; prefix matching tolerant of `@marketplace` + version.
- `doctorReport`: structural snapshot (shape + green/red classification).
- Convention lint test: every `agents/*.md` and `commands/*.md` contains the `ecc-operating-discipline` reference line.
- `check-setup.js`: detection branch logic unit-tested with no side effects.

`npm test` (`node --test tests/unit/*.test.js tests/integration/*.test.js`) must stay fully green (current baseline 402/402).

## 10. Decomposition Note

The companion **bridge orchestration** (e.g. `/feature-from-ticket <JIRA-KEY>` feeding `/feature-build`; pulling Figma context into the UI-impl agent) is a distinct subsystem with its own external-MCP-schema maintenance surface. It is **not** in this spec. It becomes a separate roadmap item (Tier-2 capability) with its own spec → plan → implementation cycle. This spec deliberately ships only the *detection + reporting + documentation* layer of interop (low cost, fits `/ecc-doctor`, no scope creep).

## 11. Summary of Files

| Action | Path | Responsibility |
|---|---|---|
| Create | `scripts/lib/setup.js` | Pure install/health primitives |
| Create | `commands/ecc-setup.md` | One-command setup, idempotent |
| Create | `commands/ecc-doctor.md` | Health + companion report |
| Create | `scripts/hooks/check-setup.js` | SessionStart detection-only nudge |
| Create | `skills/ecc-operating-discipline/SKILL.md` | Discipline as plugin-native skill (no copy) |
| Create | `tests/unit/setup.test.js` | Unit + convention-lint tests |
| Modify | `scripts/install-mcp-deps.js` | Reduce to CLI shim over `setup.installMcpDeps()` |
| Modify | `hooks/hooks.json` | Add `SessionStart` → `check-setup.js` |
| Modify | `agents/*.md`, `commands/*.md` | Add one-line `ecc-operating-discipline` reference |
| Modify | `README.md`, `README.tr.md` | Install 4→2, uninstall, companions |
| Modify | `docs/{COMMANDS,SKILLS,HOOKS-AND-MCP}.md` + `docs/tr/*` | Document new commands/skill/hook |
