---
description: Audit Compose/SwiftUI/KMP UI for accessibility violations (labels, semantics, touch targets, Dynamic Type). Delegates to the accessibility-reviewer agent. Read-only.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Accessibility Review

Read-only accessibility audit with prioritized findings.

## Usage

```
/accessibility-review            # audit changed files
/accessibility-review <path>     # audit a path
/accessibility-review <branch>   # audit a branch diff
```

## What It Does

1. Determine scope (changed files / path / branch).
2. Invoke `accessibility-reviewer` to scan UI source and report a11y violations by severity (🔴/🟡/🟢) with exact `file:line` and the fix.
3. Summarize pass / needs work / fail. Mutates nothing.

## Invokes

- `accessibility-reviewer` agent
