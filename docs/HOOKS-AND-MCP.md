**🌐 Language / Dil:** **English** · [Türkçe](tr/HOOKS-AND-MCP.md)

# Hooks, MCP servers & the continuous-learning system

This is the "it gets smarter as you work" machinery. None of it needs manual invocation — it runs in the background.

---

## Background hooks (10 handlers, 4 events)

Registered in `hooks/hooks.json`, path-portable via `${CLAUDE_PLUGIN_ROOT}`. Hooks run asynchronously and never fail your session.

### `Stop` — when a session ends

| Handler | What it does |
|---|---|
| `evaluate-session.js` | Scans the last 5 commits' `.kt` files for mobile patterns (Compose state hoisting, MVI intents, Koin injection, safe Ktor requests, structured concurrency, LazyColumn keys, immutable data classes, sealed state). Records each as a low-confidence instinct (~0.4). |
| `v2-analysis.js` | Cross-file architectural analysis of recent Kotlin changes (layer separation, feature modules, repositories, use cases, pagination, test mirroring). Boosts confidence of patterns seen across 3+ sessions. |
| `evaluate-ios-session.js` | iOS counterpart — scans recent `.swift` files for SwiftUI/Combine/Concurrency/Core Data patterns and records instincts. |
| `session-checkpoint-prompt.js` | Counts changed files & branch; if the session was substantial (≥5 files / feature branch) it suggests saving a checkpoint, and stores a session summary (last 30 kept). |

### `PreCompact` — before context is compressed

| Handler | What it does |
|---|---|
| `pre-compact.js` | Saves a checkpoint (instincts, git branch, recent files) so nothing critical is lost to compaction. Keeps the last 10. |
| `pre-compact-ios.js` | iOS-specific checkpoint (recent `.swift` files + instincts). Keeps the last 10. |

### `PostToolUse` — after Claude acts

| Handler | Matcher | What it does |
|---|---|---|
| `post-tool-use.js` | `Write`\|`Edit` | Dispatcher. Routes by filename to focused capturers — `*ViewModel.kt` → ViewModel patterns, `*Screen.kt` → Compose structure, `*Module.kt` → Koin DI, `build.gradle.kts` → dependency tracking, other `.kt` → generic pattern extraction. |
| `track-build.js` | `Bash` | Logs build/test command runs (kind, command, branch) to a rolling history (last 100). |
| `track-focus.js` | `Read` | Counts repeated reads of the same file — files you revisit a lot mark your problem-solving focus. |

### `SessionStart` — when a session begins

| Handler | What it does |
|---|---|
| `check-setup.js` | Detection-only: on session start, if any bundled MCP server's deps are missing, prints a one-line nudge to run `/ecc-setup`. Never installs, no network, never fails the session. |

## Project-memory MCP servers (3)

Configured in `.mcp.json`. Each is a small server that remembers project state **across sessions** so Claude doesn't have to re-read your whole codebase every time.

> ⚙️ **One-time setup:** after installing the plugin, run `/ecc-setup` (installs the bundled MCP server deps and verifies). Check status anytime with `/ecc-doctor`.

| Server | Remembers | Config (`.mcp.json`) |
|---|---|---|
| `mobile-memory` | Android project structure, dependencies, architecture metadata, test coverage/trend, Compose screens, build variants, navigation graph, recent changes. | `MOBILE_MEMORY_DIR=.claude/mobile-memory`, max 10 MB, 90-day retention |
| `ios-memory` | Xcode project/workspace/targets/schemes, SwiftUI views & navigation, SPM/CocoaPods deps, test metadata, `Info.plist` properties. | `IOS_MEMORY_DIR=.claude/ios-memory`, max 10 MB, 90-day retention |
| `kmp-context` | KMP module layout, source sets & their deps, `expect`/`actual` declarations, shared serializable models, platform targets. | `KMP_CONTEXT_DIR=.claude/kmp-context`, optional auto-detect |

## Continuous learning

**The claim "it learns your codebase" — concretely:**

1. **Capture.** You write/edit code → the `PostToolUse(Write|Edit)` hook fires → `post-tool-use.js` routes the file to a pattern extractor (`extract-pattern.js` and the focused `capture-*` scripts).
2. **Score.** Detected patterns become **instincts** via `scripts/lib/instincts.js`: a new pattern starts at ~0.3–0.5 confidence; each re-detection adds +0.1 (capped at 1.0); unused instincts decay −0.05 after 30 days.
3. **Persist.** Instincts are written to **`~/.claude/instincts/mobile-instincts.json`** (plus `build-history.json`, `focus-history.json`, `v2-sessions.json` for activity signals). The `mobile-pattern-extractor` agent itself is **read-only** — persistence is intentionally delegated to the hook chain, so the agent and the writer never conflict.
4. **Reinforce.** On session stop, `v2-analysis.js` looks across sessions and boosts patterns it keeps seeing.
5. **Reuse & evolve.** `/instinct-status` shows what's been learned (with confidence), `/instinct-export` / `/instinct-import` move it between machines, and `/evolve` clusters mature instincts into brand-new reusable `SKILL.md` skills. The `mobile-instinct-v2` / `continuous-learning` skills feed high-confidence patterns back into future work.

**Where your data lives:** on your machine under `~/.claude/instincts/` (the pattern store) and, per project, `.claude/checkpoints/` (pre-compaction snapshots) and the MCP memory dirs above. Nothing is sent anywhere.

---

← Back to [README](../README.md) · See also [Agents](AGENTS.md) · [Skills](SKILLS.md) · [Commands](COMMANDS.md)
