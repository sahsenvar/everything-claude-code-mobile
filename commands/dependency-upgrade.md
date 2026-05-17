---
description: Upgrade AGP/Kotlin/Gradle, SwiftPM, or KMP dependency versions with coordinated version sets and minimal-diff migration. Delegates to the mobile-dependency-upgrader agent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Dependency Upgrade

Forward version bumps across Android/iOS/KMP with coordinated sets + migration.

## Usage

```
/dependency-upgrade            # interactive: detect & propose targets
/dependency-upgrade kotlin     # bump Kotlin (+ coupled KSP/Compose compiler)
/dependency-upgrade agp        # bump AGP (+ required Gradle wrapper)
/dependency-upgrade --check    # read-only: report current vs target + coupled set, no edits
```

## What It Does

1. Detect current versions (version catalog / `gradle-wrapper.properties` / `Package.swift` / KMP build).
2. **`--check`**: report current → recommended target and the coordinated set; make NO edits.
3. Otherwise invoke `mobile-dependency-upgrader`: minimal coordinated edits to the version source of truth, build/sync, minimally fix migration breakage.
4. Report old→new versions, the coupled set, files touched, and any manual follow-up.

## Invokes

- `mobile-dependency-upgrader` agent
