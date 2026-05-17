# Feature E — Dependency-Upgrade Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Add `mobile-dependency-upgrader` agent + `/dependency-upgrade` command (Android/iOS/KMP version bump + migration), bump agent-count 29→30, document EN+TR — full suite green.

**Architecture:** Prompt agent (android-build-resolver template); paired command; contract tests in `tests/unit/dependency-upgrade.test.js`.

**Branch:** `feature/roadmap-efg` (no push; consent at end).

**Verified invariants:** Agent frontmatter `name`/`description`/`tools`/`model: opus`; blank then exact blockquote `> **Operating discipline:** follow the \`ecc-operating-discipline\` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).`. `tests/unit/feature-builder.test.js` asserts agent count = **29** (line ~308-313: `it('should auto-discover exactly 29 agents…')` + `assert.strictEqual(agentFiles.length, 29, …)`) and loops every agent for valid `name`+`description` — adding this agent REQUIRES bumping 29→30 same change. `tests/unit/setup.test.js` lint requires the discipline line in every agent+command. Commands need only `description` frontmatter. No command-count test. `npm test` runs `tests/unit/*.test.js`.

---

### Task 1: `mobile-dependency-upgrader` agent + count 29→30 + contract test

**Files:** Create `agents/mobile-dependency-upgrader.md`, `tests/unit/dependency-upgrade.test.js`; Modify `tests/unit/feature-builder.test.js`.

- [ ] **Step 1: Write failing test** — create `tests/unit/dependency-upgrade.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DISC = 'ecc-operating-discipline';

describe('Feature E — mobile-dependency-upgrader agent', () => {
  it('exists, valid frontmatter, discipline ref, 3 ecosystems + coordinated set', () => {
    const p = path.join(ROOT, 'agents', 'mobile-dependency-upgrader.md');
    assert.ok(fs.existsSync(p), 'agent file must exist');
    const c = fs.readFileSync(p, 'utf8');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block');
    assert.match(m[1], /name:\s*mobile-dependency-upgrader/);
    assert.match(m[1], /description:\s*\S/);
    assert.match(m[1], /model:\s*opus/);
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(/AGP|Gradle/.test(c), 'covers Android/Gradle');
    assert.ok(/SwiftPM|Package\.swift/.test(c), 'covers iOS SwiftPM');
    assert.ok(/KMP|multiplatform/i.test(c), 'covers KMP');
    assert.ok(/KSP|Compose compiler|coordinated/i.test(c), 'coordinated version set');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/dependency-upgrade.test.js` → FAIL (agent missing).

- [ ] **Step 3: Create `agents/mobile-dependency-upgrader.md`** EXACTLY:

```markdown
---
name: mobile-dependency-upgrader
description: Mobile dependency/toolchain upgrade specialist. Bumps AGP/Kotlin/Gradle, SwiftPM, and KMP dependency versions with coordinated version sets and minimal-diff migration. Use to upgrade versions, not to resolve conflicts.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: opus
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Mobile Dependency Upgrader

You perform forward version upgrades across Android, iOS, and KMP with the smallest correct, coordinated diff.

## Core Responsibilities

1. Upgrade toolchain/dependency versions to a requested (or latest-stable) target.
2. Keep hard-coupled version sets consistent.
3. Build/sync, then minimally fix migration breakage.
4. Never blanket-update everything; bump only what was asked plus its coupled set.

## Upgrade Workflow

1. **Detect current versions** from the source of truth: Android → `gradle/libs.versions.toml` + `gradle/wrapper/gradle-wrapper.properties`; iOS → `Package.swift` / `Package.resolved`; KMP → `gradle/libs.versions.toml` + shared `build.gradle.kts`.
2. **Pick target + coupled set** (see Coordinated Version Sets). Confirm the target with the user if ambiguous.
3. **Apply minimal edits** to the version source of truth only (the `[versions]` table / `Package.swift` / wrapper `distributionUrl`), not scattered through modules.
4. **Build/sync**: `./gradlew help` or a fast compile / `swift package resolve` — verify the upgrade resolves.
5. **Fix migration breakage minimally**: deprecated/renamed APIs, removed Gradle options, AGP namespace/DSL changes — change only what the new version requires.
6. **Report**: old→new versions, the coupled set applied, files touched, migration changes, and any manual follow-up.

## Coordinated Version Sets

Bump these together (a mismatch breaks the build):
- **Kotlin ↔ KSP ↔ Compose compiler** (KSP is `<kotlin>-<ksp>`; Compose compiler must match the Kotlin/Compose-BOM line).
- **AGP ↔ Gradle** (each AGP has a minimum Gradle; bump the wrapper `distributionUrl` accordingly).
- **Compose BOM ↔ Compose libraries** (let the BOM drive; don't pin members against it).

For version-catalog structure/conventions, defer to the `gradle-expert` agent — do not restate catalog layout here; only edit the `[versions]` values.

## Per-Ecosystem Notes

- **Android:** edit `[versions]` in `gradle/libs.versions.toml`; bump Gradle via `gradle-wrapper.properties` `distributionUrl`; check AGP min-Gradle.
- **iOS (SwiftPM):** bump `.package(url:, from:/exact:)` in `Package.swift`; refresh `Package.resolved` via `swift package update <pkg>` (targeted, not all).
- **KMP:** bump shared versions in the catalog; verify `expect/actual` and multiplatform artifacts (`-jvm`/`-iosArm64`) resolve for every target; align `kotlin`/`compose-multiplatform` together.

## Minimal Diff Strategy

- DO: edit only the version source of truth; bump the requested item + its coupled set; smallest migration change to compile.
- DON'T: mass-bump unrelated deps, reformat the catalog, change module wiring, or "modernize" code beyond what the new version requires.

## When to Use This Agent

USE: raise AGP/Kotlin/Gradle/SwiftPM/KMP versions; coordinated toolchain bump + migration.
DON'T USE: version *conflict* resolution (`gradle-fix`, `kmp-dependency-fix`), catalog setup/optimization (`gradle-expert`), build error triage (`android-build-resolver`).
```

- [ ] **Step 4: Bump agent count** — in `tests/unit/feature-builder.test.js`, the "should auto-discover exactly 29 agents" test: change `29`→`30` in the `it()` title, the `assert.strictEqual(agentFiles.length, 29, …)` value, and the `Expected 29` message. ONLY those (3 symmetric lines); nothing else. If the current number is not 29, STOP and report it (bump current→current+1, do not weaken).

- [ ] **Step 5: Run, verify pass** —
```
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
node --test tests/unit/dependency-upgrade.test.js 2>&1 | tail -3
node --test tests/unit/feature-builder.test.js 2>&1 | tail -3
node --test tests/unit/setup.test.js 2>&1 | tail -3
```
Expected: all green; feature-builder green at 30 agents; setup discipline lint covers the new agent.

- [ ] **Step 6: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add agents/mobile-dependency-upgrader.md tests/unit/dependency-upgrade.test.js tests/unit/feature-builder.test.js
git -c commit.gpgsign=false commit -m "feat(agent): mobile-dependency-upgrader (Android/iOS/KMP bumps) + count 29->30

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: `/dependency-upgrade` command

**Files:** Modify `tests/unit/dependency-upgrade.test.js`; Create `commands/dependency-upgrade.md`.

- [ ] **Step 1: Append failing test** to `tests/unit/dependency-upgrade.test.js`:

```js
describe('Feature E — dependency-upgrade command', () => {
  it('exists, valid frontmatter, discipline ref, invokes the agent, --check', () => {
    const p = path.join(ROOT, 'commands', 'dependency-upgrade.md');
    assert.ok(fs.existsSync(p), 'command file must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, 'frontmatter description');
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('mobile-dependency-upgrader'), 'invokes the agent');
    assert.match(c, /--check/, 'documents read-only --check mode');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `node --test tests/unit/dependency-upgrade.test.js` → FAIL (command missing).

- [ ] **Step 3: Create `commands/dependency-upgrade.md`** EXACTLY:

```markdown
---
description: Upgrade AGP/Kotlin/Gradle, SwiftPM, or KMP dependency versions with coordinated version sets and minimal-diff migration. Delegates to the mobile-dependency-upgrader agent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Dependency Upgrade

Forward version bumps across Android/iOS/KMP with coordinated sets + migration.

## Usage

```
/dependency-upgrade            # interactive: detect & propose targets
/dependency-upgrade kotlin     # bump Kotlin (+ coupled KSP/Compose compiler)
/dependency-upgrade agp        # bump AGP (+ required Gradle wrapper)
/dependency-upgrade --check    # read-only: report current vs target + coupled set, no edits
```

## What It Does

1. Detect current versions (version catalog / `gradle-wrapper.properties` / `Package.swift` / KMP build).
2. **`--check`**: report current → recommended target and the coordinated set; make NO edits.
3. Otherwise invoke `mobile-dependency-upgrader`: minimal coordinated edits to the version source of truth, build/sync, minimally fix migration breakage.
4. Report old→new versions, the coupled set, files touched, and any manual follow-up.

## Invokes

- `mobile-dependency-upgrader` agent
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/dependency-upgrade.test.js` → PASS (2 describes green).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/dependency-upgrade.md tests/unit/dependency-upgrade.test.js
git -c commit.gpgsign=false commit -m "feat(command): /dependency-upgrade -> mobile-dependency-upgrader

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Document the agent + command (EN + TR) + full suite

**Files:** Modify `docs/AGENTS.md`, `docs/tr/AGENTS.md`, `docs/COMMANDS.md`, `docs/tr/COMMANDS.md`.

- [ ] **Step 1: `docs/AGENTS.md`** — read it; add a `mobile-dependency-upgrader` entry near the build/Gradle agents (`gradle-expert`/`android-build-resolver`), matching the file's existing per-agent format (`### \`name\`` + description + `**Engaged:**`):
`mobile-dependency-upgrader` — Bumps AGP/Kotlin/Gradle, SwiftPM, and KMP versions with coordinated version sets + minimal-diff migration. Invoked by `/dependency-upgrade`.

- [ ] **Step 2: `docs/tr/AGENTS.md`** — mirror, same location/format, Turkish: `mobile-dependency-upgrader` — AGP/Kotlin/Gradle, SwiftPM ve KMP sürümlerini eşgüdümlü sürüm setleriyle + minimal-diff migration ile yükseltir. `/dependency-upgrade` ile çağrılır.

- [ ] **Step 3: `docs/COMMANDS.md` + `docs/tr/COMMANDS.md`** — add a `/dependency-upgrade` row to the build/compile command group (where `/gradle-fix`,`/android-ci`,`/crash-triage` live), matching the table style. EN: `| \`/dependency-upgrade [--check]\` | Upgrades AGP/Kotlin/Gradle/SwiftPM/KMP versions (coordinated sets + migration) via \`mobile-dependency-upgrader\`; \`--check\` is read-only. | \`/dependency-upgrade kotlin\` |`. TR mirror: faithful translation, same example, matching columns.

- [ ] **Step 4: Full suite** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && npm test 2>&1 | tail -4` → all green (≈440: prior + dependency-upgrade's 2; feature-builder at 30 agents; setup lint covers new agent+command). Also `node scripts/lint-json.js` → exit 0. Capture totals.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add docs/AGENTS.md docs/tr/AGENTS.md docs/COMMANDS.md docs/tr/COMMANDS.md
git -c commit.gpgsign=false commit -m "docs: document mobile-dependency-upgrader agent + /dependency-upgrade (EN+TR)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review
- **Spec coverage:** agent (3 ecosystems, coordinated sets, minimal-diff migration, --check read-only) → T1; count-bump 29→30 (mandatory, co-located) → T1; command → T2; contract tests → T1/T2 (`dependency-upgrade.test.js`); docs EN+TR → T3. No gaps.
- **Placeholders:** none — agent + command bodies literal; doc steps give exact content + read-then-place anchors (existing-file edits).
- **Consistency:** agent `mobile-dependency-upgrader` / command `/dependency-upgrade` consistent across T1/T2/T3 + tests; discipline line byte-identical to lint string; frontmatter shape matches android-build-resolver; the 29→30 bump is the single documented test change (G later: 30→31→32).
- **Safety:** count-bump co-located (suite never red); `--check` read-only respects non-destructive ethos; references `gradle-expert` instead of duplicating catalog content; bounded vs conflict tools in When-to-Use; no hooks/.mcp.json/plugin/skill/source changes; full `npm test`+lint-json in T3.

