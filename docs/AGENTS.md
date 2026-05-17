**🌐 Language / Dil:** **English** · [Türkçe](tr/AGENTS.md)

# Agents reference

This plugin ships **29 specialized agents**. Each owns one job and is engaged by Claude Code **automatically** — there are no `/agent-name` slash commands. An agent runs when:

- the **[Feature Builder pipeline](../README.md#️-the-feature-builder-pipeline)** reaches the phase it owns (e.g. `/feature-build` → planning → `feature-planner`),
- a **[command](COMMANDS.md)** orchestrates it (e.g. `/android-build` → `android-build-resolver`),
- or Claude decides it's relevant to what you asked (many are marked *“use proactively / MUST be used”* in their definition).

> Tools listed are the agent's allowed tool set. "Auto" = invoked by Claude/the pipeline, not by you typing a command.

---

## Architecture & planning

### `feature-planner`
Detects the platform and turns a feature description into a structured plan (modules, files, dependencies, task DAG, test strategy).
**Engaged:** Phase 1 of `/feature-build`, or directly via `/feature-plan "<desc>"` / `/mobile-plan`.

### `mobile-architect`
MVI / Clean Architecture / modularization expert; reviews and shapes layer separation and cross-module structure.
**Engaged:** Phase 1 of `/feature-build` alongside `feature-planner`; proactively when an architectural decision is needed.

### `kmp-architect`
Kotlin Multiplatform structure expert: `expect`/`actual`, shared vs. platform modules, KMP navigation, shared-code organization.
**Engaged:** Auto, when the project is KMP and module/structure design is in scope.

### `shared-model-designer`
Designs cross-platform data models for KMP (kotlinx-serialization, validation, platform fields, `@ObjCName` for iOS interop).
**Engaged:** Auto, during planning/implementation of shared domain models.

## Implementation (the feature-build DAG)

These five run, dependency-ordered, in **Phase 2** of `/feature-build` (or via `/feature-implement`). `network-impl` ∥ `ui-impl` run in parallel.

### `architecture-impl`
Creates the domain/architecture layer — use cases, domain models, repository interfaces, DI module skeletons (Koin / iOS container).

### `network-impl`
Implements the networking layer — Ktor (KMP/Android) or URLSession (iOS) clients, DTOs, error handling, serialization.

### `data-impl`
Implements the data layer — SQLDelight (KMP) / Room (Android) / Core Data (iOS), caching, offline-first wiring.

### `ui-impl`
Implements the UI layer — Compose or SwiftUI screens, MVI state hoisting, components, previews.

### `wiring-impl`
Integrates everything — navigation routes, DI registration, manifest/plist entries, inter-feature wiring. Runs last.

## Code review (the quality gate)

These four run in parallel in **Phase 5** of `/feature-build` (or via `/feature-quality-gate`).

### `android-reviewer`
Reviews Kotlin/Compose for quality, MVI correctness, coroutine safety, Google guidelines. *Must be used for Android changes.*

### `ios-reviewer`
Reviews Swift/SwiftUI for quality, concurrency/memory, Apple guidelines. *Must be used for iOS changes.*

### `mobile-security-reviewer`
Audits for insecure storage, weak transport, leaked secrets, missing input validation, compliance gaps.

### `mobile-performance-reviewer`
Reviews startup time, memory, rendering, and battery cost; flags regressions.

### `accessibility-reviewer`
Read-only a11y audit of Compose/SwiftUI/KMP UI — labels, semantics, touch targets, Dynamic Type; severity-ranked findings. Does not modify code.
**Engaged:** `/accessibility-review`.

### `localization-reviewer`
Read-only i18n audit for Android/iOS/KMP — hardcoded strings, plurals, RTL layout, locale-sensitive formatting; severity-ranked findings. Does not modify code.
**Engaged:** `/localization-review`.

## Build & compile resolvers

### `android-build-resolver`
Diagnoses and fixes Gradle/AGP/dependency build failures with minimal, non-architectural changes.
**Engaged:** `/android-build`, `/gradle-fix`, build-fix loop.

### `mobile-crash-resolver`
Triages a pasted stacktrace/logcat/Crashlytics/Sentry crash into a ranked root cause + minimal fix at the exact file:line (text-only, no external service calls).
**Engaged:** `/crash-triage`.

### `xcode-build-resolver`
Fixes Xcode build, Swift Package Manager, and signing/certificate failures.
**Engaged:** `/ios-build`.

### `gradle-expert`
Optimizes Gradle: version catalogs, convention plugins, build caching, configuration.
**Engaged:** Auto, when build configuration or performance is the task.

### `android-ci-generator`
Generates and fixes GitHub Actions Android CI workflows (build/test/lint/detekt, Gradle caching, artifact upload). Applies minimal-diff repairs to existing workflows.
**Engaged:** `/android-ci`.

### `mobile-dependency-upgrader`
Bumps AGP/Kotlin/Gradle, SwiftPM, and KMP versions with coordinated version sets + minimal-diff migration (forward upgrades, not conflict resolution).
**Engaged:** `/dependency-upgrade`.

## UI & design

### `compose-guide`
Jetpack Compose specialist — state, recomposition, side effects, theming, animation, testing patterns.

### `swiftui-guide`
SwiftUI specialist — state management, view performance, theming, animation, best practices.

### `m3-expressive-guide`
Material 3 Expressive — expressive theming, spring motion, shape morphing, the 28 expressive components.

### `liquid-glass-guide`
Apple Liquid Glass (iOS 26+ SwiftUI) — glass effects, morphing, interactive/tinted glass, accessibility.

**Engaged:** Auto, when you build/refine UI on the matching platform/design system.

## Testing

### `mobile-tdd-guide`
Enforces write-tests-first (JUnit5/Mockk/Turbine, XCTest). Mandatory for new features.

### `unit-test-writer`
Writes ViewModel/UseCase/Repository unit tests (JUnit5 + Mockk + Turbine + Kotest; XCTest on iOS).

### `ui-test-writer`
Writes Compose UI tests / XCUITest covering loading/error/success states, interactions, accessibility.

### `mobile-e2e-runner`
Creates and runs end-to-end UI flows (Espresso/Compose) and reports results.

### `mobile-verifier`
Runs the suite in **pass@k loops** to detect flaky tests and measure reliability. Phase 6 of `/feature-build`.

**Engaged:** Phases 3 & 6 of `/feature-build`, the testing commands (`/mobile-tdd`, `/android-test`…), or proactively before commit/push.

## Learning & meta

### `mobile-pattern-extractor`
Read-only. Analyzes Android/Kotlin changes and surfaces reusable patterns as "instincts" for the continuous-learning system. **Never writes** — persistence is delegated to the `PostToolUse` hook chain by design. See [Hooks & MCP](HOOKS-AND-MCP.md#continuous-learning).

### `mobile-compactor`
Read-only. Produces a strategic context-compaction plan to cut token usage while preserving critical context, when sessions get large or before a big refactor.

---

← Back to [README](../README.md) · See also [Skills](SKILLS.md) · [Commands](COMMANDS.md) · [Hooks & MCP](HOOKS-AND-MCP.md)
