---
description: Run Compose UI tests with Espresso. Verify critical user flows.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Compose Test Command

Run Compose UI tests.

## Usage

```
/compose-test
/compose-test HomeScreenTest
```

## Commands

```bash
./gradlew connectedAndroidTest
./gradlew :app:connectedDebugAndroidTest
```
