---
description: Android code review for Kotlin, Compose, and MVI patterns.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Android Review Command

Review Android code.

## Usage

```
/android-review
/android-review feature/home
```

## Checks

- Kotlin style (val, null safety)
- Compose patterns (state hoisting)
- MVI correctness
- Security issues
- Performance

## Invokes

- `android-reviewer` agent
