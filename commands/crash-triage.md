---
description: Triage a crash into a root cause and a minimal fix. Paste a stacktrace, logcat, Crashlytics export, or Sentry event; delegates to the mobile-crash-resolver agent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Crash Triage

Turn a crash report into a root cause + targeted fix.

## Usage

```
/crash-triage
<paste the stacktrace / logcat / Crashlytics export / Sentry event here>
```

(Or `/crash-triage <pasted crash text>` inline.)

## What It Does

1. Take the pasted crash data (raw Throwable/logcat, Crashlytics console export, or Sentry JSON / issue text).
2. Invoke `mobile-crash-resolver`: normalize (signal-only), map frames to source, rank root-cause hypotheses.
3. Propose the minimal fix at the exact `file:line` — or, if confidence is low, the precise next diagnostic step.
4. Report the structured triage (Exception / Root cause / Evidence / Fix / Notes).

## Invokes

- `mobile-crash-resolver` agent
