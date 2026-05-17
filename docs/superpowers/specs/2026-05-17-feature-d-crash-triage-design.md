# Feature D — Crash/Log Triage Agent — Design Spec

**Date:** 2026-05-17 · **Branch:** `feature/roadmap-abcd` · Roadmap item D (last).

## Problem
No agent turns a crash report / stacktrace / log into a root cause + fix — a recurring high-value mobile task that fits ECC's "auto-fix" theme.

## Goal
A new agent `mobile-crash-resolver` + paired command `/crash-triage` that accepts pasted crash data from **all** common sources (raw Throwable/`adb logcat`, Crashlytics console export, Sentry event JSON or issue URL+text), normalizes it (signal-only: strip framework frames, keep the last `Caused by:`, surface top app frames), produces a ranked root-cause hypothesis, and proposes a minimal fix at the precise code location.

## Non-Goals
- Live MCP integration with Crashlytics/Sentry (text-paste only this iteration; no external MCP assumed).
- iOS-specific symbolication tooling (handles Kotlin/Java stacktraces + generic; iOS crash text accepted best-effort).
- A JS implementation — prompt agent (like `android-build-resolver`).

## Decisions (locked)
- Agent `mobile-crash-resolver`; command `/crash-triage`.
- `model: opus`, `tools: ["Read","Grep","Glob","Bash","Edit"]` (read+locate+minimal-fix; mirrors resolver pattern, Edit for the proposed fix).
- All four input shapes documented in the agent body (Crashlytics export, Sentry JSON, Sentry issue URL+text, raw logcat/Throwable).
- Normalization rules align with the repo's existing discipline (token-discipline: signal-only stacktraces — strip `java.`/`jdk.`/`kotlin.`/`android.`/framework frames; keep exception type+message, project-package frames, the last `Caused by:` root cause).

## Architecture / Components
1. `agents/mobile-crash-resolver.md` — frontmatter → operating-discipline blockquote → body: role; ## Accepted Inputs (the 4 shapes, with a short example of each); ## Normalization (signal-only rules); ## Triage Workflow (parse → normalize → map frames to source via Grep/Glob → rank root-cause hypotheses → locate the exact file:line → propose a minimal fix); ## Output Format (a structured report: Exception, Root cause, Evidence frames, Fix (file:line + change), Confidence); ## When to Use / not.
2. `commands/crash-triage.md` — frontmatter description; operating-discipline blockquote; usage (`/crash-triage` then paste the crash, or `/crash-triage <pasted text>`); delegates to `mobile-crash-resolver`; `## Invokes`.
3. **Count bump:** `tests/unit/feature-builder.test.js` agent count is `28` (after Feature C). Adding this agent → bump `28`→`29` (only that number + matching message/title; no `NEW_AGENTS` edit). Same task as agent creation.
4. Docs: `docs/AGENTS.md`+`docs/tr/AGENTS.md`, `docs/COMMANDS.md`+`docs/tr/COMMANDS.md`.

## Constraints / Safety
- New agent AND command MUST contain the exact operating-discipline line (global `setup.test.js` lint); agent needs valid `name`+`description` frontmatter (`feature-builder.test.js` per-agent loop).
- `28`→`29` bump co-located with the agent add (suite never red). (Sequencing: C already moved 27→28; D moves 28→29. If C's commit is present — it is — the current expected value is 28.)
- Agent stays text-only/diagnostic; the proposed fix is a minimal targeted Edit, never broad refactor (resolver minimal-diff ethos).
- No external MCP, hooks, .mcp.json, plugin, or source changes. Full `npm test` green after each task.

## Testing
`tests/unit/crash-triage.test.js` (node:test): agent exists, valid frontmatter (`name: mobile-crash-resolver`, `model: opus`, tools array), discipline line, body documents all 4 input sources (matches `/Crashlytics/`, `/Sentry/`, `/logcat/`, `/Caused by/`) and a structured output; command exists, valid, discipline line, invokes the agent. Plus `feature-builder.test.js` (29 agents) + `setup.test.js` lint green; full suite green.

## Files
| Action | Path | Responsibility |
|---|---|---|
| Create | `agents/mobile-crash-resolver.md` | Crash/log → root cause + minimal fix (all sources) |
| Create | `commands/crash-triage.md` | `/crash-triage` → the agent |
| Create | `tests/unit/crash-triage.test.js` | Contract tests (agent + command) |
| Modify | `tests/unit/feature-builder.test.js` | Bump agent count 28 → 29 |
| Modify | `docs/AGENTS.md`+`docs/tr/AGENTS.md`, `docs/COMMANDS.md`+`docs/tr/COMMANDS.md` | Document agent + command (EN+TR) |
