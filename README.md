**🌐 Language / Dil:** **English** · [Türkçe](README.tr.md)

# Everything Claude Code Mobile

> **Describe a mobile feature in one sentence. Get it planned, built, tested, reviewed, and verified — across Android, iOS, and Kotlin Multiplatform.**

[![Stars](https://img.shields.io/github/stars/sahsenvar/everything-claude-code-mobile?style=flat)](https://github.com/sahsenvar/everything-claude-code-mobile/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](https://claude.com/claude-code)
![Kotlin](https://img.shields.io/badge/-Kotlin-7F52FF?logo=kotlin&logoColor=white)
![Compose](https://img.shields.io/badge/-Jetpack%20Compose-4285F4?logo=jetpackcompose&logoColor=white)
![Android](https://img.shields.io/badge/-Android-3DDC84?logo=android&logoColor=white)
![Swift](https://img.shields.io/badge/-Swift-FA7343?logo=swift&logoColor=white)
![SwiftUI](https://img.shields.io/badge/-SwiftUI-0D96F6?logo=swift&logoColor=white)
![KMP](https://img.shields.io/badge/-Kotlin%20Multiplatform-7F52FF?logo=kotlin&logoColor=white)

> 🍴 **This is a personal fork** of [`ahmed3elshaer/everything-claude-code-mobile`](https://github.com/ahmed3elshaer/everything-claude-code-mobile), hardened for real-world installs and tuned to an opinionated KMP stack. See [Credits & upstream](#-credits--upstream) and [`FORK-NOTES.md`](FORK-NOTES.md).

---

## ✨ What is this?

**Everything Claude Code Mobile** is a [Claude Code](https://claude.com/claude-code) plugin that turns Claude into a full mobile engineering team.

Instead of pasting code back and forth, you give it a feature ("Add offline-first article reading with sync"), and an orchestrated pipeline of **specialized agents** plans the architecture, implements each layer, writes the tests, fixes the build, runs quality and security review, and verifies reliability — for **Android, iOS, and Kotlin Multiplatform**. While you work, it quietly **learns the patterns of your codebase** and gets better at matching your conventions.

It ships with **32 agents**, **47 skills**, **46 slash commands**, **3 background hook stages**, and **3 project-memory MCP servers** — all auto-discovered by Claude Code on install.

### Who is it for?

Mobile developers and teams using **Android (Kotlin/Compose)**, **iOS (Swift/SwiftUI)**, or **Kotlin Multiplatform** who want Claude Code to deliver structured, tested, review-passed features instead of loose snippets — with architectural guardrails enforced automatically.

---

## 🚀 Why use it?

- **One command, a whole feature.** `/feature-build "<description>"` runs a 6-phase pipeline end to end — planning → implementation → tests → build-fix → quality gate → verification.
- **Specialists, not a generalist.** 32 agents each own one job (network layer, SwiftUI, Gradle errors, security review, TDD…), so every layer is handled by something that knows that layer deeply.
- **Cross-platform by default.** The same feature request is realized idiomatically on Android, iOS, and shared KMP code.
- **Opinionated, consistent stack.** Koin · Ktor · MVI · SQLDelight for shared code; Jetpack Compose + native SwiftUI for UI. Skills steer agents to *your* stack, not a grab-bag of alternatives.
- **It learns your codebase.** A continuous-learning system captures recurring patterns as reusable "instincts" so later work matches your conventions automatically.
- **Guardrails are enforced, not suggested.** 80% test coverage, TDD, no hardcoded secrets, structured concurrency, null-safety, and code-size limits are applied on every change.
- **Zero manual wiring.** Agents, skills, and commands are auto-discovered — install and go.

---

## ⚡ Quick start

> **Requirements:** [Claude Code](https://claude.com/claude-code) and **Node.js ≥ 18**.

```bash
# 1. Add the marketplace (this fork)
/plugin marketplace add sahsenvar/everything-claude-code-mobile

# 2. Install the plugin
/plugin install everything-claude-code-mobile@sahsenvar
```

```bash
# 3. Run setup (installs MCP server deps + verifies): /ecc-setup
#    Check health anytime with /ecc-doctor.
```

```bash
# 4. (Optional) Install the bundled discipline rules into your global Claude config
git clone https://github.com/sahsenvar/everything-claude-code-mobile.git
cp -r everything-claude-code-mobile/rules/* ~/.claude/rules/
```

Then just ask:

```
/feature-build "Add a favorites screen with offline persistence and pull-to-refresh"
```

> 💡 **Upgrading?** `claude plugin update` is a no-op if the version string is unchanged — bump the version or reinstall to pick up manifest changes. If MCP tools don't appear, run `/ecc-setup` or `/ecc-doctor` to diagnose.

### Uninstall

```
/plugin uninstall everything-claude-code-mobile@sahsenvar
```

Clean: nothing is copied into your global config. Project data dirs (`.claude/mobile-memory`, `.claude/ios-memory`, `.claude/kmp-context`, `.claude/checkpoints`) are your data; delete them manually only if you want.

### Recommended companion plugins

ECC works alongside (does not bundle) the official plugins — install whichever you use: Figma, Atlassian (Jira/Confluence), GitHub. Run `/ecc-doctor` to see which are detected.

---

## 🛠️ The Feature Builder pipeline

`/feature-build "<description>"` orchestrates **six structured phases**. Each phase hands off to the next; the implementation phase fans out across a 5-agent DAG.

```
1. Planning            feature-planner + mobile-architect
                        → architecture, modules, task DAG
2. Implementation      architecture-impl → (network-impl ∥ ui-impl)
                        → data-impl → wiring-impl   (dependency-ordered DAG)
3. Testing             unit-test-writer + ui-test-writer + mobile-e2e-runner
4. Build & Fix         compile/test loop until green
5. Quality Gate        android-reviewer ∥ ios-reviewer ∥
                        mobile-security-reviewer ∥ mobile-performance-reviewer
6. Verification        mobile-verifier (pass@k reliability metrics)
```

You can also drive phases individually: `/feature-plan`, `/feature-implement`, `/feature-test`, `/feature-build-fix`, `/feature-quality-gate`, `/feature-verify`, `/feature-status`.

---

## 🧭 More ways to use it

`/feature-build` is the headline, but most of the plugin is useful on its own — point it at whatever you're doing:

| You want to… | Run | What happens |
|---|---|---|
| Fix a broken Android build | `/android-build` | `android-build-resolver` diagnoses Gradle/AGP/dependency errors and applies minimal fixes |
| Backfill missing tests | `/mobile-tdd "<requirement>"` | `mobile-tdd-guide` + `unit-test-writer`/`ui-test-writer` write tests first, then implement |
| Review a branch before PR | `/android-review <branch>` | `android-reviewer` checks Kotlin/Compose/MVI style, security, performance |
| Catch flaky tests | `/mobile-verify --k=3` | `mobile-verifier` runs the suite k times and reports pass@k reliability |
| Plan before coding | `/mobile-plan "<desc>"` | `feature-planner` + `mobile-architect` produce an architecture/task plan |
| See what it learned | `/instinct-status` | Lists the patterns ("instincts") captured from your codebase, with confidence |
| Turn patterns into skills | `/evolve` | Clusters mature instincts into new reusable `SKILL.md` skills |

Full catalog with every command, agent, and skill explained → **[Documentation](#-documentation)**.

---

## 📦 What's inside

> 📚 These are summaries. **Every single agent, skill, and command is explained** in the [Documentation](#-documentation) section below (English + Türkçe).

### 32 agents — [full reference →](docs/AGENTS.md)

| Group | Agents | What they do |
|---|---|---|
| **Code review (4)** | `android-reviewer`, `ios-reviewer`, `mobile-security-reviewer`, `mobile-performance-reviewer` | Platform and cross-cutting quality, security, and performance review |
| **Build & compile (3)** | `android-build-resolver`, `xcode-build-resolver`, `gradle-expert` | Diagnose and fix build/Gradle/Xcode errors |
| **Architecture & planning (4)** | `mobile-architect`, `kmp-architect`, `feature-planner`, `shared-model-designer` | Plan features and design cross-platform structure |
| **UI & design (4)** | `compose-guide`, `swiftui-guide`, `m3-expressive-guide`, `liquid-glass-guide` | Idiomatic Compose / SwiftUI / Material 3 / Liquid Glass |
| **Implementation (5)** | `architecture-impl`, `network-impl`, `data-impl`, `ui-impl`, `wiring-impl` | The dependency-ordered feature-build DAG |
| **Testing (5)** | `mobile-tdd-guide`, `mobile-e2e-runner`, `unit-test-writer`, `ui-test-writer`, `mobile-verifier` | TDD workflow, E2E, and reliability verification |
| **Learning & meta (2)** | `mobile-pattern-extractor`, `mobile-compactor` | Capture reusable patterns; optimize context |

### 47 skills — [full reference →](docs/SKILLS.md)

Reusable, stack-specific playbooks the agents draw on, spanning:

- **Android** — `jetpack-compose`, `navigation-compose`, `koin-patterns`, `coroutines-patterns`, `room-patterns`, `gradle-patterns`, `m3-expressive`, `android-patterns`
- **iOS** — `swiftui-patterns`, `swift-patterns`, `combine-framework`, `core-data`, `ios-testing`, `liquid-glass`
- **Kotlin Multiplatform** — `kmp-di`, `kmp-networking`, `kmp-navigation`, `kmp-repositories`, `shared-models`, `shared-coroutines`, `expect-actual`, `sqldelight-patterns`
- **Architecture & quality** — `mvi-architecture`, `feature-builder`, `mobile-testing`, `mobile-verification`, `mobile-security`, `ci-cd-patterns`
- **Feature recipes** — `offline-first`, `pagination-patterns`, `deep-linking`, `push-notifications`, `feature-flags`, `image-loading`, `localization-patterns`, `analytics-patterns`, `accessibility-patterns`, `app-lifecycle`, `ktor-patterns`
- **Continuous learning** — `continuous-learning`(+`-v2`), `mobile-instinct-v1`/`-v2`, `mobile-checkpoint`, `mobile-compaction`, `mobile-memory`

### 46 commands — [full reference →](docs/COMMANDS.md)

| Group | Examples |
|---|---|
| **Feature pipeline (9)** | `/feature-build`, `/feature-plan`, `/feature-implement`, `/feature-test`, `/feature-build-fix`, `/feature-quality-gate`, `/feature-status`, `/feature-verify`, `/feature-learn` |
| **Build & compile (10)** | `/android-build`, `/ios-build`, `/kmp-build`, `/gradle-fix`, `/kmp-dependency-fix`, `/compose-preview`, `/lint-android`, `/swiftlint`, `/release-build`, `/mobile-build` |
| **Testing (7)** | `/mobile-tdd`, `/android-test`, `/ios-test`, `/kmp-test`, `/compose-test`, `/mobile-test`, `/mobile-verify` |
| **Planning & review (3)** | `/mobile-plan`, `/android-review`, `/platform-info` |
| **Learning & instincts (6)** | `/learn`, `/instinct-status`, `/instinct-export`, `/instinct-import`, `/evolve`, `/mobile-checkpoint` |

---

## 🧠 How the continuous-learning system works

The plugin gets smarter the more you use it on a codebase — automatically, with no extra commands:

1. **Capture** — a `PostToolUse` hook fires whenever Claude writes or edits code.
2. **Extract** — the read-only `mobile-pattern-extractor` agent analyzes the change and surfaces recurring patterns (MVI shapes, DI wiring, Compose idioms…).
3. **Persist** — the hook chain (`post-tool-use.js → extract-pattern.js → instincts.js`) stores them as "instincts" under `~/.claude/instincts/`. *(The agent itself never writes — persistence is intentionally delegated to the hook, by design.)*
4. **Observe** — the `mobile-instinct-v2` / `continuous-learning` skills detect patterns recurring across sessions.
5. **Reuse & evolve** — `/instinct-status` lists what's been learned, `/instinct-export` / `/instinct-import` share it across machines, and `/evolve` clusters mature instincts into reusable skills.

Exact data flow, file paths, and every handler → [docs/HOOKS-AND-MCP.md](docs/HOOKS-AND-MCP.md#continuous-learning).

---

## 🔌 Hooks & MCP servers

**Background hooks** (3 event stages, 9 script handlers) — registered via `hooks/hooks.json`, path-portable through `${CLAUDE_PLUGIN_ROOT}`:

| Event | Handlers | Purpose |
|---|---|---|
| `Stop` | `evaluate-session`, `v2-analysis`, `evaluate-ios-session`, `session-checkpoint-prompt` | End-of-session pattern extraction & checkpoint prompts |
| `PreCompact` | `pre-compact`, `pre-compact-ios` | Preserve critical context before token compaction |
| `PostToolUse` | `post-tool-use` (Write/Edit), `track-build` (Bash), `track-focus` (Read) | Instinct capture, build tracking, focus tracking |

**Project-memory MCP servers** (3) — persistent per-project context, configured in `.mcp.json`:

| Server | Remembers |
|---|---|
| `mobile-memory` | Project structure, dependencies, architecture, test state |
| `ios-memory` | iOS project state, SwiftUI components, XCTest patterns |
| `kmp-context` | KMP module structure, expect/actual, shared models |

> ⚠️ MCP servers need their dependencies installed once after plugin install: run `/ecc-setup` (see [Quick start](#-quick-start) step 3).

**Every hook handler and MCP server, and the full learning data-flow, explained → [docs/HOOKS-AND-MCP.md](docs/HOOKS-AND-MCP.md).**

---

## 📚 Documentation

The README is the overview. Every agent, skill, command, hook, and MCP server is documented in full — in **English and Türkçe**:

| Reference | English | Türkçe |
|---|---|---|
| **Agents** — all 27, what each does & how it's engaged | [docs/AGENTS.md](docs/AGENTS.md) | [docs/tr/AGENTS.md](docs/tr/AGENTS.md) |
| **Skills** — all 46, purpose & when each applies | [docs/SKILLS.md](docs/SKILLS.md) | [docs/tr/SKILLS.md](docs/tr/SKILLS.md) |
| **Commands** — all 35, usage & examples | [docs/COMMANDS.md](docs/COMMANDS.md) | [docs/tr/COMMANDS.md](docs/tr/COMMANDS.md) |
| **Hooks & MCP** — 9 hooks, 3 servers, learning flow | [docs/HOOKS-AND-MCP.md](docs/HOOKS-AND-MCP.md) | [docs/tr/HOOKS-AND-MCP.md](docs/tr/HOOKS-AND-MCP.md) |

---

## 🎯 Opinionated stack

Skills and agents are tuned to a single, consistent stack so generated code is coherent rather than a mix of alternatives:

| Concern | Choice |
|---|---|
| Dependency injection | **Koin** (Koin Multiplatform for KMP) |
| Networking | **Ktor** (platform engines: OkHttp / Darwin) |
| Architecture | **MVI** unidirectional data flow |
| Shared persistence | **SQLDelight** |
| UI | **Jetpack Compose** + native **SwiftUI** |
| Build | Gradle **version catalogs** (`libs.*`) — no inline version pins |

---

## 🛡️ Rules enforced on every change

≥ 80% test coverage · test-driven development · no hardcoded secrets · immutability-first & null-safety · structured concurrency · Compose/SwiftUI best practices · HTTPS + certificate pinning · code-size limits. Install them globally via [Quick start](#-quick-start) step 4.

---

## 🩹 Troubleshooting

| Symptom | Fix |
|---|---|
| MCP tools (mobile-memory, etc.) don't appear | Run `/ecc-setup` (installs deps + verifies), then restart Claude Code. Use `/ecc-doctor` to see what's missing. |
| `claude plugin update` did nothing | It no-ops on an unchanged version string — reinstall, or wait for a version bump |
| Agents/skills not loading | They are auto-discovered from `agents/`, `skills/`, `commands/`; do not add `agents`/`skills`/`commands` keys to `plugin.json` (that breaks discovery) |

---

## 🤝 Contributing

Issues and PRs are welcome on [this fork](https://github.com/sahsenvar/everything-claude-code-mobile). Good areas: new platform skills, additional feature recipes, agent prompt tuning, and instinct-system improvements. Changes are tracked in [`FORK-NOTES.md`](FORK-NOTES.md).

---

## 🙏 Credits & upstream

This project is a personal fork of **[`ahmed3elshaer/everything-claude-code-mobile`](https://github.com/ahmed3elshaer/everything-claude-code-mobile)** by Ahmed El-Shaer — full credit for the original concept and foundation goes upstream. This fork adds portability fixes (path-portable hooks, working MCP wiring, schema-correct manifest, auto-discovery), a stack-alignment content pass, and a library-version policy. The divergence is documented in [`FORK-NOTES.md`](FORK-NOTES.md).

## 📄 License

[MIT](LICENSE). Original work © its respective authors; fork modifications contributed under the same MIT license.
