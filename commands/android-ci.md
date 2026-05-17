---
description: Generate or fix the GitHub Actions Android CI workflow. Delegates to the android-ci-generator agent. Use to bootstrap CI or repair a broken/slow Android pipeline.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Android CI

Bootstrap or repair GitHub Actions CI for an Android/Gradle project.

## Usage

```
/android-ci            # generate .github/workflows/android-ci.yml
/android-ci generate   # same as above (explicit)
/android-ci fix        # diagnose & minimally repair the existing workflow
```

## What It Does

1. Detect the Gradle module/task layout.
2. **generate**: invoke `android-ci-generator` to write a complete, runnable `.github/workflows/android-ci.yml` (JDK 17 temurin, Gradle caching, assemble/test/lint/detekt, artifact upload).
3. **fix**: invoke `android-ci-generator` in fix mode — smallest correct diff to make the existing workflow green/fast; never restructures it.
4. Report the workflow path and the change summary.

## Invokes

- `android-ci-generator` agent
