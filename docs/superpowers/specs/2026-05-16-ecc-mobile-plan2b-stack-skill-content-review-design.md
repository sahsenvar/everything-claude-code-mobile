# Design: Plan 2B — Stack-Skill Content Review (targeted correctness pass)

**Date:** 2026-05-16
**Status:** Approved-by-delegation (user waived interactive approval; autonomous execution, single final report; no `main` push without explicit consent)
**Repo:** `sahsenvar/everything-claude-code-mobile` (fork of `ahmed3elshaer/everything-claude-code-mobile`)
**Local:** `~/Developer/everything-claude-code-mobile`, branch `plan2/content-quality-review` (off `main` @ `ed16e02`, post-Plan-2A)
**Relationship:** Plan 2 was decomposed into 2A (mechanical fixes — DONE, merged to `main`), **2B** (this — content review), 2C (library-version policy — next, separate cycle).

## 1. Goal

Eliminate the content defects in the **stack-relevant** skills and their tightly-bound agents that measurably degrade agent code-generation for the owner's stack (**Koin** DI, **Ktor** networking, **MVI**, **SQLDelight**; KMP + Android + native SwiftUI), plus resolve the two Plan 2A carry-forward findings. Success = the skills no longer steer bound agents toward off-stack libraries (Retrofit/Hilt/Room) for shared code, the two carry-forward items are correctly resolved, `npm test` stays fully green, and the change set is small, objective, and reviewable.

## 2. Context & Constraints

- **Reconnaissance (read-only sweep, 2026-05-16) established:**
  - ~46 skills total; **~28–30 are stack-relevant** (the earlier "~16" estimate was conservative). Reviewing and rewriting all of them is out of scope — see scope decision below.
  - **Carry-forward (a):** `tests/unit/feature-builder.test.js` `should auto-discover skills and commands directories` filters `skills/*` subdirs by `fs.existsSync(SKILL.md)` (line ~359), silently skipping any subdir lacking `SKILL.md`. Today **0** subdirs lack it (46/46 present) — no false negative now, structural fragility only.
  - **Carry-forward (b) — RESOLVED by investigation:** instinct persistence is **delegated to the hook chain** `hooks/hooks.json` (PostToolUse on `.kt`) → `scripts/hooks/post-tool-use.js` → `scripts/hooks/extract-pattern.js` → `scripts/lib/instincts.js` `addInstinct()`/`writeJsonFile()` → `.omc/instincts/mobile-instincts.json`. The `mobile-pattern-extractor` agent itself is **read-only by design**; it surfaces patterns, the hook layer persists them. Therefore **adding `Write` to its `tools` would be WRONG** (it would duplicate/conflict with the working hook persistence). The correct fix is to **document the delegation**, not change the tool set.
  - **Highest-value defect:** `skills/feature-builder/SKILL.md` lists `Retrofit/Ktor` (line ~174) and `Koin/Hilt` (lines ~155, ~174) as alternatives without committing to the owner's stack. `feature-builder` feeds `feature-planner`, `network-impl`, `data-impl`, `wiring-impl` — ambiguity here directly causes agents to generate off-stack code.
  - `skills/koin-patterns/SKILL.md` shows Android-only `Room.databaseBuilder()` (line ~16) and `HttpClient(OkHttp)` (line ~26) with no KMP/SQLDelight/Ktor cross-reference.
  - `skills/offline-first/SKILL.md` discusses a generic DB abstraction without naming SQLDelight (the owner's shared DB layer).
  - Low-risk objective polish: `skills/kmp-networking/SKILL.md:65` uses a verbose anonymous `object : Logger` where a SAM lambda is idiomatic; `coroutines-patterns` ↔ `shared-coroutines` lack a cross-reference clarifying Android-only vs KMP.
  - **9 hardcoded library version pins** were inventoried (sqldelight-patterns, gradle-patterns, shared-models, room-patterns). **None are stale.** Version policy is **Plan 2C**, NOT this plan — they are listed here only as an inventory hand-off.
- **Scope decision (made under delegated authority; the conservative, reversible, high-value reading):** Plan 2B is a *targeted correctness pass*, not a full content audit. It changes ONLY the sites enumerated in §3. It does **not** rewrite correct-but-Android-only skills, does **not** create new skills, does **not** touch the ~14 non-stack skills, and does **not** alter any library version (Plan 2C). Every change is prose/example/doc-level (plus one test assertion) and lands on `plan2/content-quality-review`; nothing is pushed to `main` without explicit user consent.

## 3. Components (the complete, closed change set)

### C1 — Carry-forward (a): harden the skills auto-discovery test
`tests/unit/feature-builder.test.js`, the `should auto-discover skills and commands directories` test: before the existing `skillFiles` filter, add an explicit assertion that **every** `skills/*` subdirectory contains a `SKILL.md`, listing any offenders in the failure message. This converts the silent skip into a hard failure (the structural guard Plan 2A's review asked for). It must stay GREEN today (46/46) and would go RED if any future skill dir lacked `SKILL.md`. Existing assertions are preserved.

### C2 — Carry-forward (b): document instinct-persistence delegation (do NOT add `Write`)
`agents/mobile-pattern-extractor.md`: keep `tools: ["Read", "Grep", "Glob", "Bash"]` unchanged. Add a concise note in the body (near the "Store as Instinct" step) stating that the agent does not write files itself — persistence is handled automatically by the PostToolUse hook chain (`post-tool-use.js` → `extract-pattern.js` → `instincts.js`) — and the agent is read-only by design. This removes the misleading impression the body currently gives and locks in the verified architecture. No frontmatter change.

### C3 — feature-builder: commit to the owner's stack (highest value)
`skills/feature-builder/SKILL.md`: at the technology table/guidance (lines ~155, ~174) resolve the two ambiguities so bound agents stop emitting off-stack code:
- **Networking:** state Ktor as the project's networking choice for all platforms (shared KMP + Android + iOS via Ktor engines); remove Retrofit as a co-equal option (it may remain only as an explicit "not used in this project" aside if a table cell needs it, but the recommendation must be unambiguous Ktor).
- **DI:** state Koin as the project's DI; remove Hilt as a co-equal option (Hilt is not in the owner's stack).
Change is wording/table-cell only; no structural rewrite of the skill.

### C4 — koin-patterns: add KMP cross-reference notes (non-breaking)
`skills/koin-patterns/SKILL.md`: the Android-only `Room.databaseBuilder()` (line ~16) and `HttpClient(OkHttp)` (line ~26) examples each get a brief inline note that for KMP/shared code this project uses SQLDelight (see `sqldelight-patterns`) and Ktor with platform engines (see `kmp-networking`) respectively. The existing Android examples stay (Android is still valid) — we add clarity, we do not delete or rewrite.

### C5 — offline-first: name SQLDelight
`skills/offline-first/SKILL.md`: add an explicit statement that the shared persistence layer for this project is SQLDelight (cross-link `sqldelight-patterns`), so agents learning offline-first don't reach for Room/generic DBs in shared code. Minimal addition, no rewrite.

### C6 — low-risk objective polish
- `skills/kmp-networking/SKILL.md:~65`: replace the anonymous `object : Logger { override fun log(...) { ... } }` with the idiomatic SAM-lambda form (`Logger { ... }`). Behaviour-equivalent.
- `skills/coroutines-patterns/SKILL.md` and `skills/shared-coroutines/SKILL.md`: add a one-line mutual "See also" note clarifying coroutines-patterns = Android-focused, shared-coroutines = KMP-shared, so neither is misapplied.

## 4. Sequencing, Validation, Delivery

- **Order:** C1 (test hardening — TDD-style: add assertion, prove GREEN now, reason about the RED-on-missing case) → C2 → C3 → C4 → C5 → C6. C1 first because it is the only behavioural/test change and acts as a guard while the prose edits land. C2–C6 are independent skill/agent doc edits and may be done in any order after C1; the plan will sequence them as discrete tasks.
- **Validation gates (every component, and final):** `npm test` → `# fail 0` (the suite, incl. the Plan 2A frontmatter guard and the new C1 assertion); `npm run lint:json` exit 0; `npm run lint:scripts` exit 0; `claude plugin validate .` still passes (manifest untouched). Content edits are additionally validated by SDD's two-stage review (spec-compliance then code-quality) per task, with a final holistic review.
- **No code execution of skills** (they are markdown guidance); "testing" of C2–C6 = the test suite stays green + reviewer diff inspection that the change matches the spec and introduces no new off-stack guidance or contradiction.
- **Delivery:** all commits on `plan2/content-quality-review`. Plan 2C (library-version policy) is a **separate** spec→plan→cycle that runs immediately after 2B per the user's instruction; the 9-pin inventory in §2 is its starting input. Merge/push of 2B+2C to `main` is presented to the user as a handoff in the final report and requires explicit consent (the Plan 2A push consent does NOT extend to 2B/2C).

## 5. Out of Scope (YAGNI / deferred)

- **Library-version policy / any version bump** — Plan 2C (the §2 9-pin inventory is the hand-off, not a 2B task).
- The ~14 non-stack skills (app-lifecycle, accessibility, analytics, deep-linking, feature-flags, image-loading, m3-expressive, push-notifications, etc.) — not reviewed.
- Creating new skills (e.g. a `kmp-koin-patterns`), splitting skills, or sweeping idiom rewrites of correct-but-Android-only skills.
- Any change to `mobile-pattern-extractor` frontmatter / `tools` (the investigation proved `Write` would be wrong).
- Any manifest/hook/MCP/`package.json`/`marketplace.json` change; any agent change beyond the C2 documentation note.
- Reviewing or changing the hook/instinct persistence implementation itself (it is correct as-is — confirmed).
