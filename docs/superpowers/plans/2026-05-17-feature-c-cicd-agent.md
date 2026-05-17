# Feature C — CI/CD Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Add `android-ci-generator` agent + `/android-ci` command (generate/fix GitHub Actions Android workflows), bump the agent-count test 27→28, document EN+TR — full suite green.

**Architecture:** Prompt agent (frontmatter + operating-discipline blockquote + body, like `android-build-resolver`); paired command; contract tests in `tests/unit/ci-cd-agent.test.js`.

**Branch:** `feature/roadmap-abcd` (no push; consent at end).

**Verified invariants:** Agent frontmatter = `name`/`description`/`tools: ["Read","Write","Edit","Bash","Grep","Glob"]`/`model: opus`; line after frontmatter (blank) then the exact blockquote `> **Operating discipline:** follow the \`ecc-operating-discipline\` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).`. `tests/unit/feature-builder.test.js:308-314` asserts `assert.strictEqual(agentFiles.length, 27, …)` AND loops every agent requiring valid `name`+`description` frontmatter — adding an agent REQUIRES bumping 27→28 in the same change (no `NEW_AGENTS` array edit). `tests/unit/setup.test.js` convention lint requires the discipline line in every agent+command. Commands need only `description` frontmatter. No doc-count test. `npm test` runs `tests/unit/*.test.js`.

---

### Task 1: `android-ci-generator` agent + count-test bump + contract test

**Files:** Create `agents/android-ci-generator.md`, `tests/unit/ci-cd-agent.test.js`; Modify `tests/unit/feature-builder.test.js`.

- [ ] **Step 1: Write failing test** — create `tests/unit/ci-cd-agent.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DISC = 'ecc-operating-discipline';

describe('Feature C — android-ci-generator agent', () => {
  it('exists with valid frontmatter, discipline ref, real GH Actions body', () => {
    const p = path.join(ROOT, 'agents', 'android-ci-generator.md');
    assert.ok(fs.existsSync(p), 'agent file must exist');
    const c = fs.readFileSync(p, 'utf8');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block');
    assert.match(m[1], /name:\s*android-ci-generator/);
    assert.match(m[1], /description:\s*\S/);
    assert.match(m[1], /model:\s*opus/);
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('actions/setup-java'), 'real GH Actions: setup-java');
    assert.ok(c.includes('runs-on:'), 'real GH Actions: runs-on');
    assert.ok(c.includes('./gradlew'), 'gradle build steps');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/ci-cd-agent.test.js` → FAIL (agent missing).

- [ ] **Step 3: Create `agents/android-ci-generator.md`** EXACTLY:

```markdown
---
name: android-ci-generator
description: Android CI/CD specialist. Generates and fixes GitHub Actions workflows for Android/Gradle projects (build, unit test, lint, detekt, artifact upload). Use to bootstrap CI or repair broken/slow Android pipelines. Minimal diffs, no architectural edits.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: opus
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Android CI Generator

You generate and repair GitHub Actions CI for Android/Gradle projects with minimal, correct changes.

## Core Responsibilities

1. **Generate** a complete, runnable workflow at `.github/workflows/android-ci.yml`.
2. **Fix** a broken/slow existing workflow with the smallest correct diff.
3. Detect the module/task layout (`./gradlew tasks`, `settings.gradle(.kts)`) before writing steps.

## Generate Mode

Write `.github/workflows/android-ci.yml`:

```yaml
name: Android CI

on:
  push:
    branches: [ main ]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - uses: gradle/actions/setup-gradle@v4
      - name: Build & unit test
        run: ./gradlew assembleDebug testDebugUnitTest lintDebug --stacktrace
      - name: Detekt (if configured)
        run: ./gradlew detekt --stacktrace || echo "detekt not configured; skipping"
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: reports
          path: |
            **/build/reports/**
            **/build/outputs/apk/**
```

Adjust `java-version`/branch/module tasks to the detected project. Keep `gradle/actions/setup-gradle@v4` for built-in caching (do not hand-roll cache keys unless asked).

## Fix Mode

Diagnose then minimally patch:
- Wrong/missing JDK → correct `setup-java` distribution/version (match the project's `sourceCompatibility`).
- No Gradle caching / slow → add `gradle/actions/setup-gradle@v4`.
- `gradlew: Permission denied` → add `chmod +x ./gradlew` step (or `git update-index --chmod=+x`).
- Flaky/no reports on failure → add `if: always()` artifact upload.
- Deprecated action majors → bump to current majors only.
Change only the failing lines; preserve unrelated steps and formatting.

## Minimal Diff Strategy

- DO: smallest YAML change that makes CI correct/green; keep existing job/step names.
- DON'T: restructure the workflow, rename jobs, add unrelated matrices, or touch app/Gradle source.

## When to Use This Agent

USE: bootstrap Android CI, fix a red/slow Android GitHub Actions pipeline.
DON'T USE: iOS/KMP CI, Fastlane/Bitrise, release signing (out of scope).
```

- [ ] **Step 4: Bump the agent-count assertion** — in `tests/unit/feature-builder.test.js`, find `assert.strictEqual(\n        agentFiles.length,\n        27,` (the "should auto-discover exactly 27 agents" test) and change `27` → `28`. Also update its message string `Expected 27 agent files` → `Expected 28 agent files` if present. Change ONLY that number/message; touch nothing else in the file.

- [ ] **Step 5: Run, verify pass** —
```
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
node --test tests/unit/ci-cd-agent.test.js
node --test tests/unit/feature-builder.test.js 2>&1 | tail -3
node --test tests/unit/setup.test.js 2>&1 | tail -3
```
Expected: ci-cd-agent green; feature-builder green (28 agents, new agent's frontmatter valid); setup green (discipline lint covers the new agent).

- [ ] **Step 6: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add agents/android-ci-generator.md tests/unit/ci-cd-agent.test.js tests/unit/feature-builder.test.js
git -c commit.gpgsign=false commit -m "feat(agent): android-ci-generator (GH Actions Android CI) + count 27->28

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: `/android-ci` command

**Files:** Modify `tests/unit/ci-cd-agent.test.js`; Create `commands/android-ci.md`.

- [ ] **Step 1: Append failing test** to `tests/unit/ci-cd-agent.test.js`:

```js
describe('Feature C — android-ci command', () => {
  it('exists, valid frontmatter, discipline ref, invokes the agent, generate+fix', () => {
    const p = path.join(ROOT, 'commands', 'android-ci.md');
    assert.ok(fs.existsSync(p), 'command file must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, 'frontmatter description');
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('android-ci-generator'), 'invokes the agent');
    assert.match(c, /generate/i, 'documents generate mode');
    assert.match(c, /fix/i, 'documents fix mode');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `node --test tests/unit/ci-cd-agent.test.js` → FAIL (android-ci.md missing).

- [ ] **Step 3: Create `commands/android-ci.md`** EXACTLY:

```markdown
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
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/ci-cd-agent.test.js` → PASS (2 describes green).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/android-ci.md tests/unit/ci-cd-agent.test.js
git -c commit.gpgsign=false commit -m "feat(command): /android-ci -> android-ci-generator

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Document the agent + command (EN + TR) + full suite

**Files:** Modify `docs/AGENTS.md`, `docs/tr/AGENTS.md`, `docs/COMMANDS.md`, `docs/tr/COMMANDS.md`.

- [ ] **Step 1: `docs/AGENTS.md`** — read it; in the build/CI-related agents area (near `android-build-resolver`/`gradle-expert`), add an entry matching the file's existing per-agent format:
`android-ci-generator` — Generates & fixes GitHub Actions Android CI workflows (build/test/lint/detekt, Gradle caching, artifacts). Minimal-diff fixes. Invoked by `/android-ci`.

- [ ] **Step 2: `docs/tr/AGENTS.md`** — same location/format, Turkish: `android-ci-generator` — GitHub Actions Android CI workflow'larını üretir ve onarır (build/test/lint/detekt, Gradle önbelleği, artefaktlar). Minimal-diff onarım. `/android-ci` ile çağrılır.

- [ ] **Step 3: `docs/COMMANDS.md` + `docs/tr/COMMANDS.md`** — add an `/android-ci` row to the build/CI command group (EN table; TR mirror, "Komut|Ne yapar|Örnek"):
EN: `| \`/android-ci [fix]\` | Generates or (with \`fix\`) repairs the GitHub Actions Android CI workflow via \`android-ci-generator\`. | \`/android-ci\` |`
TR: faithful translation, same example.

- [ ] **Step 4: Full suite** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && npm test 2>&1 | tail -4` → all green (≈436: prior + ci-cd-agent's 2; feature-builder now 28-agent; setup discipline lint covers new agent+command). Capture totals.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add docs/AGENTS.md docs/tr/AGENTS.md docs/COMMANDS.md docs/tr/COMMANDS.md
git -c commit.gpgsign=false commit -m "docs: document android-ci-generator agent + /android-ci (EN+TR)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review
- **Spec coverage:** agent → T1; count-bump 27→28 → T1 (same task, mandatory); command → T2; contract tests → T1/T2 (`ci-cd-agent.test.js`); docs EN+TR → T3. No gaps.
- **Placeholders:** none — agent body has a complete runnable GH Actions workflow (not pseudo); command literal; doc steps give exact insertion content + read-then-place anchors (existing-file edits).
- **Consistency:** agent name `android-ci-generator` and command `/android-ci` consistent across T1/T2/T3 + tests; discipline line byte-identical to lint string; frontmatter shape matches recon (`android-build-resolver` template); the 27→28 bump is the documented single test change.
- **Safety:** count-bump co-located with agent add (suite never left red); no plugin `.github/workflows/ci.yml`/hooks/.mcp.json/source changes; D will bump 28→29 later; full `npm test` run in T1 (subtests) and T3 (whole suite).

