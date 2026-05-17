**🌐 Language / Dil:** **English** · [Türkçe](tr/COMMANDS.md)

# Commands reference

**35 slash commands.** Type them in Claude Code. These are the things *you* invoke; they orchestrate the [agents](AGENTS.md) and [skills](SKILLS.md) behind the scenes.

---

## Setup & health

| Command | What it does | Example |
|---|---|---|
| `/ecc-setup` | One-command setup: installs the 3 bundled MCP server deps, verifies health. Idempotent. | `/ecc-setup` |
| `/ecc-doctor` | Read-only health report: MCP deps, platform, discipline skill, SessionStart hook, detected companion plugins. | `/ecc-doctor` |

---

## Companion bridges

These connect ECC to the official Atlassian/GitHub/Figma plugins. They soft-detect: if the companion plugin is not installed they explain and skip — never fail. Run `/ecc-doctor` to see which companions are detected.

| Command | What it does | Example |
|---|---|---|
| `/jira-feature-build <KEY>` | Fetches a Jira issue (Atlassian MCP) and runs `/feature-build` with it as the description. | `/jira-feature-build PROJ-123` |
| `/github-pr-feature [name]` | Opens/updates a GitHub PR (GitHub MCP) for the current feature branch. | `/github-pr-feature auth` |
| `/figma-ui-impl <url>` | Fetches Figma design context (Figma MCP) and hands it to `ui-impl`. | `/figma-ui-impl https://figma.com/design/…` |

---

## Feature pipeline

The headline workflow. `/feature-build` runs all 6 phases; the rest let you drive or inspect individual phases.

| Command | What it does | Example |
|---|---|---|
| `/feature-build "<desc>"` | End-to-end: plan → implement → test → build-fix → quality gate → verify. Auto-detects platform. | `/feature-build "Add biometric login"` |
| `/feature-plan "<desc>"` | Phase 1 only: produces the architecture/file/dependency/test plan. | `/feature-plan "Push notification handling"` |
| `/feature-implement <name>` | Phase 2: executes an approved plan via the implementation DAG. | `/feature-implement auth` |
| `/feature-test <name>` | Phase 3: writes unit + UI + E2E tests for the feature. | `/feature-test offline-cache` |
| `/feature-build-fix <name>` | Phase 4: compile/test/fix loop until green (max 5 iterations). | `/feature-build-fix auth` |
| `/feature-quality-gate <name>` | Phase 5: parallel review + security + performance audit, applies fixes. | `/feature-quality-gate auth` |
| `/feature-verify <name>` | Phase 6: pass@k (k=3) reliability + coverage sign-off. | `/feature-verify auth` |
| `/feature-status [<name>]` | Shows which phase a feature build is in, done/remaining, blockers. | `/feature-status` |
| `/feature-learn [--export]` | Shows patterns/instincts learned from completed builds. | `/feature-learn --export` |

## Build & compile

| Command | What it does | Example |
|---|---|---|
| `/mobile-build` | Detects platform, delegates to the right build command. | `/mobile-build` |
| `/android-build [release\|<module>]` | Gradle build; auto-fixes errors via `android-build-resolver`; produces APK/AAB. | `/android-build release` |
| `/ios-build [release\|test]` | Xcode build; auto-fixes via `xcode-build-resolver`; produces IPA. | `/ios-build release` |
| `/kmp-build [android\|ios]` | Builds all KMP targets; fixes dependency errors. | `/kmp-build` |
| `/gradle-fix [dependencies\|sync]` | Resolves Gradle sync/dependency/cache problems. | `/gradle-fix dependencies` |
| `/android-ci [generate\|fix]` | Generates or repairs the GitHub Actions Android CI workflow via `android-ci-generator`. | `/android-ci` |
| `/kmp-dependency-fix` | Resolves KMP dependency conflicts/version mismatches. | `/kmp-dependency-fix` |
| `/release-build [apk\|bundle]` | Signed, R8-optimized production build with size report. | `/release-build bundle` |
| `/compose-preview [<Component>]` | Adds/verifies `@Preview`s and checks they render. | `/compose-preview HomeScreen` |

## Testing

| Command | What it does | Example |
|---|---|---|
| `/mobile-test` | Detects platform, delegates to the right test command. | `/mobile-test` |
| `/android-test [--coverage]` | Android unit + instrumentation tests with coverage. | `/android-test --coverage` |
| `/ios-test [unit\|coverage]` | iOS unit + UI tests via `xcodebuild`, analyzes failures. | `/ios-test coverage` |
| `/kmp-test [common\|android]` | KMP tests across all targets + coverage. | `/kmp-test` |
| `/compose-test [<TestClass>]` | Runs Compose UI tests for critical flows. | `/compose-test HomeScreenTest` |
| `/mobile-verify [--k=N] [--flaky]` | pass@k loop to detect flaky tests / measure reliability. | `/mobile-verify --k=3` |
| `/mobile-tdd "<requirement>"` | Test-first → implement → refactor cycle, ≥80% coverage. | `/mobile-tdd "Add search to HomeScreen"` |
| `/lint-android [--fix]` | Android Lint + Detekt + ktlint, optional auto-fix. | `/lint-android --fix` |
| `/swiftlint [fix\|strict]` | SwiftLint style check + auto-fix. | `/swiftlint fix` |
| `/android-review [<branch>]` | Reviews Kotlin/Compose/MVI: style, patterns, security, perf. | `/android-review feature/home` |

## Planning & review

| Command | What it does | Example |
|---|---|---|
| `/mobile-plan "<desc>"` | Plans a feature: architecture, module placement, tasks, test strategy. | `/mobile-plan "Implement offline support"` |
| `/platform-info [detect\|list]` | Detects project type (Android/iOS/KMP) and platform details. | `/platform-info` |
| `/mobile-checkpoint save\|restore\|list [name]` | Snapshots/restores build & test project state before risky work. | `/mobile-checkpoint save before-mvi-refactor` |

## Learning & instincts

These drive the [continuous-learning system](HOOKS-AND-MCP.md#continuous-learning).

| Command | What it does | Example |
|---|---|---|
| `/learn [--type <ctx>]` | Extracts patterns from the current session into reusable knowledge. | `/learn --type compose` |
| `/instinct-status [--type <ctx>]` | Lists learned instincts with confidence scores and last-used dates. | `/instinct-status` |
| `/instinct-export [<file>]` | Exports instincts to JSON for sharing. | `/instinct-export patterns.json` |
| `/instinct-import <file>` | Imports + merges instincts (dedupes, keeps confidence). | `/instinct-import patterns.json` |
| `/evolve [--context <ctx>]` | Clusters mature instincts into new reusable `SKILL.md` skills. | `/evolve` |

---

← Back to [README](../README.md) · See also [Agents](AGENTS.md) · [Skills](SKILLS.md) · [Hooks & MCP](HOOKS-AND-MCP.md)
