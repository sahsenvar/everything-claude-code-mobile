---
description: Audit Android/iOS/KMP code for hardcoded strings, missing plurals, RTL hazards, and locale-unsafe formatting. Delegates to the localization-reviewer agent. Read-only.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Localization Review

Read-only internationalization audit with prioritized findings.

## Usage

```
/localization-review            # audit changed files
/localization-review <path>     # audit a path
/localization-review <branch>   # audit a branch diff
```

## What It Does

1. Determine scope (changed files / path / branch).
2. Invoke `localization-reviewer` to scan for hardcoded strings, plural/format/RTL/locale issues and report by severity (🔴/🟡/🟢) with exact `file:line` and the fix.
3. Summarize pass / needs work / fail. Mutates nothing.

## Invokes

- `localization-reviewer` agent
