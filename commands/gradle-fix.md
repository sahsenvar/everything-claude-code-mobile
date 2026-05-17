---
description: Fix Gradle sync, dependency conflicts, and cache issues. Invokes android-build-resolver agent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Gradle Fix Command

Resolve Gradle build issues.

## Usage

```
/gradle-fix
/gradle-fix dependencies
/gradle-fix sync
```

## Common Fixes

```bash
# Clear caches
./gradlew cleanBuildCache
rm -rf ~/.gradle/caches

# Refresh dependencies
./gradlew --refresh-dependencies

# View dependency tree
./gradlew :app:dependencies
```
