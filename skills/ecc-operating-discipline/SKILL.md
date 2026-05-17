---
name: ecc-operating-discipline
description: Operating discipline for everything-claude-code-mobile — agent delegation, Android/iOS style, mobile security, and testing/TDD. Apply whenever an ECC agent or command runs.
---

# ECC Operating Discipline

Consolidated, always-applicable discipline for ECC's mobile agents and commands. (Source of truth; the `rules/*.md` files remain as optional human reference.)

## Agent Delegation

Use `/feature-build` to orchestrate the 7-phase pipeline: Plan → Implement → Test → Build Fix → Quality Gate → Verify → Learn.

Delegate by situation:
- **Review:** Android/Kotlin → `android-reviewer`; iOS/Swift → `ios-reviewer`; security → `mobile-security-reviewer`; performance → `mobile-performance-reviewer`.
- **Build & fix:** Gradle/AGP/R8 → `android-build-resolver`; Xcode/SPM/CocoaPods → `xcode-build-resolver`; Gradle tuning → `gradle-expert`.
- **Architecture/planning:** `mobile-architect`, `kmp-architect`, `feature-planner`, `shared-model-designer`.
- **UI:** `compose-guide`, `swiftui-guide`, `m3-expressive-guide`, `liquid-glass-guide`.
- **Implementation layers (dependency order: architecture → network + UI → data → wiring):** `architecture-impl`, `network-impl`, `data-impl`, `ui-impl`, `wiring-impl`.
- **Testing:** `mobile-tdd-guide` (mandatory TDD), `mobile-e2e-runner`, `unit-test-writer`, `ui-test-writer`, `mobile-verifier`.
- **Learning/quality:** `mobile-pattern-extractor`, `mobile-compactor`.

Guidelines: delegate complex specialized tasks with context and constraints; always review agent output.

## Android Kotlin Style

- Immutability: prefer `val`; immutable collections; data classes with `copy()`.
- Null safety: `?.`, `?:`; minimize `!!`.
- Organization: files < 400 lines, functions < 50 lines, nesting < 4.
- Compose: state hoisting (stateless composables); `Modifier` as first optional param; `@Preview` with themes/devices; no side effects in composition.

## iOS Swift Style

- Naming: camelCase vars, PascalCase types; explicit access control.
- Value semantics: `let` over `var`; structs over classes.
- Optionals: `guard let` / `if let` / `??` / `?.`; minimize force-unwrap `!`.
- SwiftUI: state hoisting; `@StateObject` ownership, `@ObservedObject` observation, `@EnvironmentObject` app-wide; previews for all views; no side effects in `body`.
- Concurrency: `async/await` over completion handlers; `MainActor` for UI; `Task` for cancellable work; no `DispatchQueue.main.async`.
- Organization: files < 400 lines, functions < 50 lines, nesting < 4.

## Mobile Security

- Secrets: no hardcoded API keys/passwords; use `BuildConfig` / `local.properties`.
- Storage: `EncryptedSharedPreferences` for tokens; Android Keystore for keys; no sensitive data in plain SharedPrefs.
- Network: HTTPS only; certificate pinning in production; no cleartext traffic.
- Logging: no sensitive data in logs; Timber with a release tree.

## Mobile Testing

- Coverage: 80% minimum.
- TDD (mandatory): write failing test (RED) → run, must fail → minimal implementation (GREEN) → refactor → verify 80%+ coverage.
- Test types: unit (ViewModels, UseCases), integration (repositories, flows), UI (Compose with Espresso).
- Agents: `mobile-tdd-guide` (enforcement), `mobile-e2e-runner` (E2E).
