---
description: Review continuous-learning instinct health and prune stale / low-confidence instincts. Report-first; prunes only on explicit confirmation, always after a .bak backup of the global instinct store.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Instinct Review

Curate the continuous-learning store (`~/.claude/instincts/mobile-instincts.json`).

## Usage

```
/instinct-review            # default: REPORT ONLY — never writes
/instinct-review --prune    # report, then ask for explicit confirmation before pruning
```

## Steps

1. `loadInstincts()` from `scripts/lib/instincts.js`.
2. Compute `instinctHealth(data)` and `selectPrunable(data)` (low-confidence `< 0.3` OR unused `> 60` days).
3. **Report** the health summary (total / confident / stale / lowConfidence / prunable) and list the prunable instinct ids with confidence + lastUsed + reason.
4. **No flag → stop here. The command never writes by default.**
5. `--prune` only: ask the user to explicitly confirm (show exactly which ids will be removed). On an explicit "yes":
   a. Copy `mobile-instincts.json` → `mobile-instincts.json.bak` (overwrite a prior `.bak`).
   b. Remove the confirmed prunable instincts and `saveInstincts(remaining)`.
   c. Report removed count, backup path, and the new health summary.
6. Never prune without the `.bak` and an explicit confirmation. `/ecc-doctor` also surfaces this instinct health.

## Invokes

- `scripts/lib/instincts.js` (`loadInstincts`, `instinctHealth`, `selectPrunable`, `saveInstincts`)
