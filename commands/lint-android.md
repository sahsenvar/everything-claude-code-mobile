---
description: Run Android Lint, Detekt, and ktlint for code quality.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Lint Android Command

Run linting tools.

## Usage

```
/lint-android
/lint-android --fix
```

## Commands

```bash
./gradlew lint
./gradlew detekt
./gradlew ktlintCheck
./gradlew ktlintFormat  # Auto-fix
```
