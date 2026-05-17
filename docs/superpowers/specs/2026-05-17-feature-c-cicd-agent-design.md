# Feature C — CI/CD Agent — Design Spec

**Date:** 2026-05-17 · **Branch:** `feature/roadmap-abcd` · Roadmap item C.

## Problem
ECC has build/test/review agents but no agent that generates or fixes **CI/CD pipelines** — the largest capability gap for real mobile teams.

## Goal
A new agent `android-ci-generator` + paired command `/android-ci` that generates and fixes **GitHub Actions** workflows for Android/Gradle projects (setup-java, Gradle cache, assemble/test/lint/detekt, artifact upload), and repairs broken/slow existing workflows with minimal diffs.

## Non-Goals
- Fastlane/Bitrise/CircleCI (GitHub Actions only, per decision).
- iOS/KMP CI (Android focus this iteration).
- Touching the plugin's OWN `.github/workflows/ci.yml` (that runs `npm test`; out of scope — the agent generates *consumer-project* workflows).
- A JS implementation — this is a prompt agent (like `android-build-resolver`).

## Decisions (locked)
- Agent name `android-ci-generator`; command `/android-ci`.
- `model: opus`, `tools: ["Read","Write","Edit","Bash","Grep","Glob"]` (matches `android-build-resolver`).
- Generate workflow at the consumer repo's `.github/workflows/android-ci.yml`; fix mode edits the existing one with minimal changes (mirrors `android-build-resolver`'s minimal-diff ethos).

## Architecture / Components
1. `agents/android-ci-generator.md` — frontmatter (name/description/tools/model) → blank → mandatory operating-discipline blockquote → body: role statement, ## Core Responsibilities, ## Generate Mode (a concrete, correct GitHub Actions Android workflow template: `actions/checkout@v4`, `actions/setup-java@v4` temurin 17, Gradle cache via `gradle/actions/setup-gradle@v4`, steps `./gradlew assembleDebug testDebugUnitTest lintDebug detekt`, upload APK/report artifacts, sane triggers push/pull_request), ## Fix Mode (diagnose YAML/cache/version/permission issues, minimal diff), ## Minimal Diff Strategy, ## When to Use / not.
2. `commands/android-ci.md` — frontmatter description; operating-discipline blockquote; usage (`/android-ci` generate, `/android-ci fix`); delegates to the agent; `## Invokes`.
3. **Count-test bump:** adding one agent breaks `tests/unit/feature-builder.test.js` `assert.strictEqual(agentFiles.length, 27, …)` → change `27`→`28` (the only required test change; no `NEW_AGENTS` array edit).
4. Docs: `docs/AGENTS.md`+`docs/tr/AGENTS.md` (new agent entry), `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` (new command row).

## Constraints / Safety
- New agent AND command MUST contain the exact operating-discipline line (global `setup.test.js` lint). New agent MUST have valid `name`+`description` frontmatter (the `feature-builder.test.js` per-file frontmatter loop validates all agents).
- The `27`→`28` bump is mandatory and in the same task as agent creation (else suite red). D will later bump `28`→`29`.
- Generated workflow YAML in the agent body must be correct, runnable GitHub Actions (no placeholder/pseudo-YAML) — it's documentation an agent will emit.
- No changes to the plugin's own `.github/workflows/ci.yml`, hooks, .mcp.json, source.
- Full `npm test` green after each task.

## Testing
`tests/unit/ci-cd-agent.test.js` (node:test): agent file exists, valid frontmatter (`name: android-ci-generator`, non-empty description, `model: opus`, tools array), contains operating-discipline line, body contains a GitHub Actions workflow (`uses: actions/setup-java`, `runs-on:`, `./gradlew`); command file exists, valid, discipline line, references the agent + both generate/fix modes. Plus `feature-builder.test.js` (28 agents) + `setup.test.js` (discipline lint) green.

## Files
| Action | Path | Responsibility |
|---|---|---|
| Create | `agents/android-ci-generator.md` | GitHub Actions Android CI generate+fix agent |
| Create | `commands/android-ci.md` | `/android-ci` command → the agent |
| Create | `tests/unit/ci-cd-agent.test.js` | Contract tests (agent + command) |
| Modify | `tests/unit/feature-builder.test.js` | Bump agent count 27 → 28 |
| Modify | `docs/AGENTS.md`+`docs/tr/AGENTS.md`, `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` | Document new agent + command (EN+TR) |
