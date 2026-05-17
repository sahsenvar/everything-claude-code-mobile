**🌐 Language / Dil:** **English** · [Türkçe](tr/SKILLS.md)

# Skills reference

**46 skills** — reusable, stack-specific playbooks the [agents](AGENTS.md) draw on. You don't invoke skills directly; Claude pulls in the relevant skill automatically when the work matches. Each entry: **what it gives you** · *when it kicks in*.

---

## Android

- **`android-patterns`** — Core Kotlin idioms + Android lifecycle-aware components. *Building Android components that must follow Kotlin/lifecycle conventions.*
- **`jetpack-compose`** — Declarative UI: state, theming, animation, recomposition. *Building Android UI without XML.*
- **`navigation-compose`** — Type-safe Compose Navigation: graphs, back stack, args. *Multi-screen Compose apps.*
- **`koin-patterns`** — Koin DI: modules, scopes, ViewModel injection (Android). *Wiring DI in an Android app.*
- **`coroutines-patterns`** — Structured concurrency + Flow: cancellation, error handling, scopes. *Background/async work on Android.*
- **`room-patterns`** — Room DB: DAOs, entities, migrations (Android-local). *Local persistence on Android.*
- **`gradle-patterns`** — Modern Gradle: version catalogs, convention plugins, multi-module. *Setting up/refactoring build scripts.*
- **`m3-expressive`** — Material 3 Expressive: spring physics, shape morphing, motion. *Polished, animated Android UI.*
- **`app-lifecycle`** — Process death, `SavedStateHandle`, background tasks. *State that must survive config change / process death.*

## iOS

- **`swift-patterns`** — Idiomatic Swift: optionals, error handling, modern features. *Writing idiomatic Swift.*
- **`swiftui-patterns`** — SwiftUI state/composition/lifecycle (`@State`, binding, observation). *Building SwiftUI UI correctly.*
- **`combine-framework`** — Publishers/subscribers/operators for reactive flow. *Async data streams in iOS.*
- **`core-data`** — Core Data: models, fetch requests, background contexts. *Local persistence on iOS.*
- **`ios-testing`** — XCTest, mocking, UI & snapshot tests. *Testing iOS features.*
- **`liquid-glass`** — iOS 26 Liquid Glass: `.glassEffect()`, layered transparency. *Glass-morphism UI on iOS 26+.*

## Kotlin Multiplatform

- **`expect-actual`** — `expect`/`actual` platform-specific implementations. *Abstracting platform APIs in shared code.*
- **`kmp-di`** — Koin Multiplatform DI with platform modules. *DI across shared + platform code.*
- **`kmp-networking`** — Ktor client with platform engines (OkHttp/Darwin). *Shared networking layer.*
- **`kmp-navigation`** — Cross-platform navigation (Voyager / Decompose). *Shared navigation across Android & iOS.*
- **`kmp-repositories`** — Repository pattern: shared interfaces, platform impls. *Shared data-access layer.*
- **`sqldelight-patterns`** — Type-safe SQL → generated Kotlin for KMP. *Shared, type-safe DB access.*
- **`shared-coroutines`** — KMP coroutine config: platform dispatchers, shared scopes. *Async in KMP shared code.*
- **`shared-models`** — Shared serializable domain models, single source of truth. *Defining domain models once for all platforms.*

## Architecture & quality

- **`mvi-architecture`** — Model-View-Intent unidirectional flow: state/intent/side-effect. *Structuring app architecture.*
- **`feature-builder`** — The 6-phase end-to-end feature pipeline itself. *Building a complete feature start to finish.*
- **`mobile-testing`** — Test strategy (JUnit5/Mockk/Turbine/Compose), ≥80% coverage. *Writing the test layer.*
- **`mobile-verification`** — pass@k metrics & flaky-test detection. *Measuring/improving test reliability.*
- **`mobile-security`** — Encrypted storage, TLS/cert pinning, input validation, secure logging. *Implementing security-sensitive features.*
- **`ci-cd-patterns`** — GitHub Actions, Fastlane, signing, release pipelines. *Setting up CI/CD.*
- **`accessibility-patterns`** — WCAG, content descriptions, touch targets, dynamic type. *Making the app accessible.*

## Feature recipes

- **`offline-first`** — NetworkBoundResource, sync, conflict resolution (SQLDelight-backed for shared code). *Offline cache + sync.*
- **`pagination-patterns`** — Paging 3 (Android) / custom (iOS) for large lists. *Lazy-loading long lists.*
- **`deep-linking`** — URI schemes, App Links, Universal Links, deferred deep links. *Routing into app content from outside.*
- **`push-notifications`** — FCM (Android) + APNs (iOS). *Adding push.*
- **`feature-flags`** — LaunchDarkly / Firebase Remote Config, A/B rollout. *Gradual releases & experiments.*
- **`image-loading`** — Coil (Android) / AsyncImage (iOS): caching, transforms. *Efficient image display.*
- **`localization-patterns`** — Multi-language strings, RTL, pluralization. *Worldwide / multi-language apps.*
- **`analytics-patterns`** — Event/screen tracking, user properties, consent. *Instrumenting usage analytics.*
- **`ktor-patterns`** — Ktor HTTP client config (Android/OkHttp): negotiation, interceptors, error mapping. *Android networking setup.*

## Continuous learning

These power the [self-learning system](HOOKS-AND-MCP.md#continuous-learning).

- **`continuous-learning`** — Orchestrates pattern extraction from sessions to evolve skills.
- **`continuous-learning-v2`** — V2: instinct capture with confidence scoring across sessions.
- **`mobile-instinct-v1`** — Immediate, real-time pattern capture during edits.
- **`mobile-instinct-v2`** — Observational learning across sessions; reinforces recurring patterns.
- **`mobile-memory`** — Persistent project context (structure, deps, architecture) across sessions.
- **`mobile-checkpoint`** — Save/restore project state at critical checkpoints.
- **`mobile-compaction`** — Context-optimization strategy for large codebases.

---

← Back to [README](../README.md) · See also [Agents](AGENTS.md) · [Commands](COMMANDS.md) · [Hooks & MCP](HOOKS-AND-MCP.md)
