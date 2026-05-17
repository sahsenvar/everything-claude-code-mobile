# Feature E — Dependency-Upgrade Agent — Design Spec

**Date:** 2026-05-17 · **Branch:** `feature/roadmap-efg` · Roadmap item E (of E→F→G).

## Problem
No agent performs systematic version upgrades + migration. `gradle-expert` sets up version catalogs; `android-build-resolver`/`gradle-fix`/`kmp-dependency-fix` resolve *conflicts* — none drive AGP/Kotlin/Gradle/SwiftPM/KMP **version bumps with coordinated migration**. Verified gap.

## Goal
A new agent `mobile-dependency-upgrader` + command `/dependency-upgrade` that bumps dependency/toolchain versions across **Android (AGP/Kotlin/Gradle/version-catalog deps), iOS (SwiftPM), and KMP (shared deps + expect/actual alignment)**, keeps coordinated version sets consistent (Kotlin↔KSP↔Compose-compiler; AGP↔Gradle), builds, and fixes migration breakage with minimal diffs.

## Non-Goals
- Conflict resolution (that's `gradle-fix`/`kmp-dependency-fix`) — this is forward version bumps.
- Re-teaching version-catalog structure (that's `gradle-expert`) — reference it, don't duplicate.
- A JS implementation — prompt agent (android-build-resolver template).
- Auto-merging/committing upgrades — proposes minimal diffs; user reviews.

## Decisions (locked)
- All 3 ecosystems (user choice). Agent `mobile-dependency-upgrader` (cross-platform → `mobile-` prefix), command `/dependency-upgrade`.
- `model: opus`, `tools: ["Read","Write","Edit","Bash","Grep","Glob"]` (matches android-build-resolver).
- Minimal, coordinated diffs: bump only what's requested + its hard-coupled set; never a blanket "update everything".

## Architecture / Components
1. `agents/mobile-dependency-upgrader.md` — frontmatter → operating-discipline blockquote → body: role; ## Core Responsibilities; ## Upgrade Workflow (1 detect current versions [version catalog `gradle/libs.versions.toml`, `gradle-wrapper.properties`, `Package.swift`/`Package.resolved`, KMP `build.gradle.kts`]; 2 determine target + the coupled set; 3 apply minimal edits to the version source of truth; 4 build/sync; 5 fix migration breakage minimally; 6 report); ## Coordinated Version Sets (Kotlin↔KSP↔Compose-compiler, AGP↔Gradle — reference `gradle-expert` for catalog shape, do not restate it); ## Per-Ecosystem Notes (Android / iOS SwiftPM / KMP); ## Minimal Diff Strategy (DO/DON'T); ## When to Use (vs gradle-fix/kmp-dependency-fix conflict tools).
2. `commands/dependency-upgrade.md` — frontmatter description; operating-discipline blockquote; usage (`/dependency-upgrade` interactive, `/dependency-upgrade kotlin`, `/dependency-upgrade --check` dry-run report only); delegates to the agent; `## Invokes`.
3. **Count bump:** `tests/unit/feature-builder.test.js` agent count `29`→`30` (only that number + matching it()-title + message; no NEW_AGENTS edit). Same task as agent creation.
4. Docs: `docs/AGENTS.md`+`docs/tr/AGENTS.md`, `docs/COMMANDS.md`+`docs/tr/COMMANDS.md`.

## Constraints / Safety
- New agent AND command MUST contain the exact operating-discipline line (global `setup.test.js` lint); agent needs valid `name`+`description` frontmatter (`feature-builder.test.js` per-agent loop).
- `29`→`30` bump co-located with the agent add (suite never red). (G later: 30→31→32.)
- `--check` mode is read-only (report target versions + the coupled set, no edits) — a non-destructive default-friendly entry, consistent with repo philosophy.
- No hooks/.mcp.json/plugin/source/skill changes; the plugin's own files untouched. Full `npm test` green after each task.

## Testing
`tests/unit/dependency-upgrade.test.js` (node:test): agent exists, valid frontmatter (`name: mobile-dependency-upgrader`, `model: opus`, tools array), discipline line, body covers all 3 ecosystems (matches `/AGP|Gradle/`, `/SwiftPM|Package\.swift/`, `/KMP|multiplatform/`) and a coordinated-set rule (Kotlin/KSP/Compose); command exists, valid, discipline line, invokes the agent, documents `--check`. Plus `feature-builder.test.js` (30 agents) + `setup.test.js` lint green; full suite green.

## Files
| Action | Path | Responsibility |
|---|---|---|
| Create | `agents/mobile-dependency-upgrader.md` | Cross-ecosystem version bump + migration agent |
| Create | `commands/dependency-upgrade.md` | `/dependency-upgrade` → the agent |
| Create | `tests/unit/dependency-upgrade.test.js` | Contract tests (agent + command) |
| Modify | `tests/unit/feature-builder.test.js` | Bump agent count 29 → 30 |
| Modify | `docs/AGENTS.md`+`docs/tr/AGENTS.md`, `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` | Document agent + command (EN+TR) |
