# Design: Plan 2A — Mechanical Fixes + Test Reconciliation

**Date:** 2026-05-16
**Status:** Approved (design); pending implementation plan
**Repo:** `sahsenvar/everything-claude-code-mobile` (fork of `ahmed3elshaer/everything-claude-code-mobile`)
**Local:** `~/Developer/everything-claude-code-mobile`, branch `plan2/content-quality-review` off `main` (9fa5827)
**Relationship:** Plan 2 (Phase 4 content-quality review) was decomposed into independent workstreams. This is **Plan 2A** — the objective, low-risk mechanical subset, split out to a fast spec→plan→ship cycle so the repo is structurally clean and green before the larger subjective content review (Plan 2B = deep stack-skill review; Plan 2C = library-version policy) is undertaken.

## 1. Goal

Make the repository structurally sound: every agent loads with valid frontmatter, and the test suite validates the **auto-discovery reality** instead of an obsolete plugin-manifest convention. Success = `npm test` fully green (0 failures), `lint:json` and `lint:scripts` green, `claude plugin validate` still passing.

## 2. Context & Constraints

- **Plan 1 established** that `.claude-plugin/plugin.json` MUST be metadata-only (no `agents`/`skills`/`commands` keys). Claude Code rejects a directory-string (`"agents":"./agents/"` → `agents: Invalid input`); an explicit file array installs but yields Agents (0). Omission → auto-discovery is the only working form (verified: Agents 27, Skills 81, Hooks 3, MCP 3). **Re-adding arrays to satisfy the old tests is therefore not an option** — it provably breaks install.
- **Verified facts (Explore sweep, 2026-05-16):**
  - `agents/` contains exactly **27** `.md` files.
  - **3** agents have no YAML frontmatter at all (start with `# X Agent`): `mobile-verifier.md`, `mobile-compactor.md`, `mobile-pattern-extractor.md`. They currently load with a generic placeholder description and "All tools".
  - `agents/network-impl.md` **is valid** (starts with `---`, complete frontmatter). The prior project-memory note claiming a "YAML parse error" there is wrong and will be corrected.
  - `skills/` contains **46** `skills/*/SKILL.md` files; all have valid `name`+`description` frontmatter. (Claude Code's reported "Skills (81)" reflects its own discovery semantics, not the local SKILL.md count; the test must not hardcode 81.)
  - No additional agents/skills have malformed frontmatter beyond the 3 above.
  - `feature-builder.test.js` has 948 lines; the 5 failing assertions are 5 `it()` blocks in `describe('Feature Builder - Plugin Registration')`, lines 291–345, all depending on `plugin.agents` / `plugin.skills` arrays that no longer exist by design. A `parseFrontmatter` helper already exists in that test file (used at line ~281) and will be reused.
  - No pre-existing content-review rubric/methodology exists in the repo.
- **Out of scope (YAGNI / deferred to Plan 2B/2C):** content correctness, library-version currency, KMP idiom review, description quality beyond presence, any edits to skill/command bodies, any agent edits beyond the 3 frontmatter additions.

## 3. Components

### Component 1 — Add frontmatter to 3 agents

A `---` YAML block is prepended to the top of each file. The existing `# X Agent` body is preserved byte-for-byte below the new block. Convention mirrors sibling agents (`name` = filename slug, one-line `description` derived from the agent's own body, `tools` JSON array scoped to the agent's actual responsibilities, `model: opus`).

| File | `name` | `tools` | `model` | `description` |
|---|---|---|---|---|
| `agents/mobile-verifier.md` | `mobile-verifier` | `["Read","Write","Edit","Bash","Grep","Glob"]` | `opus` | Mobile verification specialist. Runs test suites in pass@k loops to detect flaky tests and measure reliability. Use after implementing features, before commit/push, or when investigating test failures. |
| `agents/mobile-compactor.md` | `mobile-compactor` | `["Read","Grep","Glob"]` | `opus` | Mobile context-compaction specialist. Analyzes the session and applies a strategic compaction plan to cut token usage while preserving critical context. Use when token usage is high, switching modules, or before a large refactor. |
| `agents/mobile-pattern-extractor.md` | `mobile-pattern-extractor` | `["Read","Grep","Glob","Bash"]` | `opus` | Mobile pattern-extraction specialist. Analyzes Android/Kotlin codebases to identify reusable patterns and capture them as instincts for the continuous-learning system. Use after a feature is implemented, after refactoring, or to consolidate learning. |

Tool sets are grounded in each agent's body: `mobile-verifier` discovers and runs tests and proposes fixes (read+exec+edit); `mobile-compactor` only analyzes session/project state to produce a compaction plan (read-only); `mobile-pattern-extractor` scans codebases for patterns (read+search+exec), mirroring `feature-planner`'s tool set.

### Component 2 — Rewrite the 5 obsolete test assertions

The 5 `it()` blocks in `describe('Feature Builder - Plugin Registration')` are rewritten to validate the auto-discovery model (Approach 2: a structural-loadability guard). They use the existing `parseFrontmatter` helper and the existing `ROOT_DIR`/`PLUGIN_FILE` constants. Scope is **structural loadability only** — no content-quality checks.

1. **`should have a valid plugin.json`** — keep `existsSync` + valid-JSON + `name` assertions. Remove the `plugin.agents`/`plugin.skills` assertions. Add: `plugin.json` must NOT contain `agents`, `skills`, or `commands` keys (locks in Plan 1's omit-keys decision; regression guard against accidental re-introduction).
2. **`should list all 27 agents`** → rename to reflect intent. Enumerate `agents/*.md`; assert count === 27; assert each parses via `parseFrontmatter` with non-empty `name` and `description`.
3. **`should have all listed agent files existing on disk`** → repurpose: assert each agent's frontmatter `name` equals its filename slug, and that all `name` values are unique across `agents/`.
4. **`should include all 8 new feature agents`** → assert each of `feature-planner, network-impl, data-impl, architecture-impl, ui-impl, wiring-impl, unit-test-writer, ui-test-writer` exists as a file in `agents/` AND has valid frontmatter (non-empty `name`+`description`).
5. **`should have skills array pointing to skills and commands`** → rename: enumerate `skills/*/SKILL.md` (assert ≥ 1; each has non-empty `name`+`description`); assert `commands/*.md` count ≥ 1. No hardcoded 46/81 — the count is asserted as "> 0" plus per-file frontmatter validity, so it is robust to future additions.

This converts five dead assertions into a guard that fails whenever any agent/skill loses parseable frontmatter — i.e. it would have caught the 3-broken-agents bug and will catch regressions during Plan 2B/2C.

## 4. Sequencing, Validation, Delivery

- **TDD order** (per `superpowers:test-driven-development`): rewrite the 5 tests first → suite goes **RED** (the 3 frontmatter-less agents fail the new agent-frontmatter assertion; the auto-discovery assertions also exercise the new shape) → add frontmatter to the 3 agents → suite goes **GREEN**. The rewritten test is the proof of the fix; no separate verification needed beyond running it.
- **Validation gates:** `npm test` (currently 402 tests, 5 fail; target 0 fail), `npm run lint:json`, `npm run lint:scripts` all green; `claude plugin validate` still passes (manifest untouched).
- **Delivery:** commits land on the working branch; the branch-split question (keep on `plan2/content-quality-review` vs. a dedicated `plan2a/mechanical-fixes` cut from main, leaving `plan2/...` pristine for Plan 2B/2C) is decided with the user at the writing-plans/implementation transition, not now. Merge-to-main decision follows the Plan 1 pattern (work branch → verified → merge → push) and requires explicit user consent for the push to `main`.
- **Side task:** correct the `ecc-mobile-fork-project` project memory — remove the inaccurate "`agents/network-impl.md` (YAML parse error)" claim; the file is valid. Restate the real defect set as "3 agents lack frontmatter: mobile-verifier, mobile-compactor, mobile-pattern-extractor."

## 5. Out of Scope (YAGNI)

- No content-quality, correctness, version-currency, or KMP-idiom review (Plan 2B/2C).
- No edits to skill or command bodies; no agent edits beyond the 3 frontmatter blocks.
- No new tests beyond rewriting the 5 existing assertions (the rewrite already provides the regression guard).
- No changes to `plugin.json`, `marketplace.json`, hooks, or MCP config.
