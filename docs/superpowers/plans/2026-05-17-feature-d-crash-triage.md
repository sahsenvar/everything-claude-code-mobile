# Feature D — Crash/Log Triage Agent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Add `mobile-crash-resolver` agent + `/crash-triage` command (crash/log → root cause + minimal fix; raw/Crashlytics/Sentry inputs), bump agent-count 28→29, document EN+TR — full suite green.

**Architecture:** Prompt agent (resolver template); paired command; contract tests in `tests/unit/crash-triage.test.js`.

**Branch:** `feature/roadmap-abcd` (no push; consent at end).

**Verified invariants:** Agent frontmatter `name`/`description`/`tools`/`model: opus`; blank then exact blockquote `> **Operating discipline:** follow the \`ecc-operating-discipline\` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).`. `tests/unit/feature-builder.test.js` asserts agent count = **28** (Feature C bumped 27→28) and loops every agent for valid `name`+`description` frontmatter — adding this agent REQUIRES bumping 28→29 in the same change. `tests/unit/setup.test.js` lint requires the discipline line in every agent+command. Commands need only `description` frontmatter. No doc-count test. `npm test` runs `tests/unit/*.test.js`.

---

### Task 1: `mobile-crash-resolver` agent + count 28→29 + contract test

**Files:** Create `agents/mobile-crash-resolver.md`, `tests/unit/crash-triage.test.js`; Modify `tests/unit/feature-builder.test.js`.

- [ ] **Step 1: Write failing test** — create `tests/unit/crash-triage.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DISC = 'ecc-operating-discipline';

describe('Feature D — mobile-crash-resolver agent', () => {
  it('exists, valid frontmatter, discipline ref, all input sources + output', () => {
    const p = path.join(ROOT, 'agents', 'mobile-crash-resolver.md');
    assert.ok(fs.existsSync(p), 'agent file must exist');
    const c = fs.readFileSync(p, 'utf8');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block');
    assert.match(m[1], /name:\s*mobile-crash-resolver/);
    assert.match(m[1], /description:\s*\S/);
    assert.match(m[1], /model:\s*opus/);
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(/Crashlytics/.test(c), 'documents Crashlytics input');
    assert.ok(/Sentry/.test(c), 'documents Sentry input');
    assert.ok(/logcat/i.test(c), 'documents logcat/raw input');
    assert.ok(/Caused by/.test(c), 'normalization mentions root-cause chain');
    assert.ok(/Root cause/i.test(c), 'structured output: root cause');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/crash-triage.test.js` → FAIL (agent missing).

- [ ] **Step 3: Create `agents/mobile-crash-resolver.md`** EXACTLY:

```markdown
---
name: mobile-crash-resolver
description: Mobile crash/log triage specialist. Turns a pasted stacktrace, logcat, Crashlytics export, or Sentry event into a ranked root cause and a minimal fix at the exact code location. Diagnostic + minimal-diff fix, no architectural edits.
tools: ["Read", "Grep", "Glob", "Bash", "Edit"]
model: opus
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Mobile Crash Resolver

You triage a crash/log into a root cause and the smallest correct fix. Text-only input — the user pastes the crash; no external service calls.

## Accepted Inputs

1. **Raw Throwable / `adb logcat`** — `java.lang.X: msg` + `at pkg.Class.method(File.kt:NN)` frames, possibly multiple `Caused by:`.
2. **Crashlytics console export** — "Crash Type / Message / Stack Trace" text plus device/session counts.
3. **Sentry event JSON** — `exception.values[].type/value/stacktrace.frames[]` (filename/function/lineno), `release`, `platform`.
4. **Sentry issue URL + pasted text** — issue title + events/users + the stack excerpt.

If the input is none of these / too sparse to act on, say exactly what extra detail is needed (full stack, the `Caused by:` chain, the app package) and stop — do not guess a fix.

## Normalization (signal-only)

- Keep: exception type + message; **project-package** frames; the **last `Caused by:`** (true root cause).
- Strip framework noise from reasoning: `java.`, `jdk.`, `kotlin.`, `android.`, `androidx.`, `com.google.`, `org.junit.`, coroutine/reflection internals — list at most the top 5 app frames.
- Identify the crashing app frame (first project-package frame from the top) and the root-cause frame (in the last `Caused by:`).

## Triage Workflow

1. Detect input shape; extract exception type, message, frames, and the `Caused by:` chain.
2. Normalize per above.
3. Map the top app frame(s) to source: `Grep`/`Glob` for the class/method/file; open the cited line with `Read`.
4. Form 1–3 ranked root-cause hypotheses (most likely first) with the concrete evidence (which frame/line/message supports it).
5. Propose the **minimal** fix at the exact `file:line` (null-guard, lifecycle/threading correction, missing init, etc.) — a targeted `Edit`, never a broad refactor. If the fix is non-obvious, give the precise next diagnostic step instead of a speculative change.

## Output Format

```
Exception: <type>: <message>
Root cause: <one-sentence hypothesis> (confidence: high|medium|low)
Evidence: <app frame file:line> → <why> ; root: <Caused by frame>
Fix: <file:line> — <the minimal change> (or: "Needs more info: <what>")
Notes: <alternative hypotheses / follow-up if low confidence>
```

## When to Use This Agent

USE: a crash/ANR/stacktrace/Crashlytics/Sentry report to diagnose and minimally fix.
DON'T USE: build/compile errors (`android-build-resolver`), perf profiling (`mobile-performance-reviewer`), feature work.
```

- [ ] **Step 4: Bump agent count** — in `tests/unit/feature-builder.test.js`, the "should auto-discover exactly 28 agents" test has `assert.strictEqual(agentFiles.length, 28, …)`. Change `28`→`29` (and the `it()` title `28`→`29` and message `Expected 28`→`Expected 29` to stay consistent). Change ONLY those; nothing else in the file. (If the current number is not 28, report it and bump current→current+1 — do not weaken.)

- [ ] **Step 5: Run, verify pass** —
```
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
node --test tests/unit/crash-triage.test.js 2>&1 | tail -3
node --test tests/unit/feature-builder.test.js 2>&1 | tail -3
node --test tests/unit/setup.test.js 2>&1 | tail -3
```
Expected: all green; feature-builder green at 29 agents; setup discipline lint covers the new agent.

- [ ] **Step 6: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add agents/mobile-crash-resolver.md tests/unit/crash-triage.test.js tests/unit/feature-builder.test.js
git -c commit.gpgsign=false commit -m "feat(agent): mobile-crash-resolver (crash/log triage) + count 28->29

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: `/crash-triage` command

**Files:** Modify `tests/unit/crash-triage.test.js`; Create `commands/crash-triage.md`.

- [ ] **Step 1: Append failing test** to `tests/unit/crash-triage.test.js`:

```js
describe('Feature D — crash-triage command', () => {
  it('exists, valid frontmatter, discipline ref, invokes the agent', () => {
    const p = path.join(ROOT, 'commands', 'crash-triage.md');
    assert.ok(fs.existsSync(p), 'command file must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, 'frontmatter description');
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('mobile-crash-resolver'), 'invokes the agent');
    assert.match(c, /paste|stacktrace|crash/i, 'documents pasting a crash');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `node --test tests/unit/crash-triage.test.js` → FAIL (crash-triage.md missing).

- [ ] **Step 3: Create `commands/crash-triage.md`** EXACTLY:

```markdown
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
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/crash-triage.test.js` → PASS (2 describes green).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/crash-triage.md tests/unit/crash-triage.test.js
git -c commit.gpgsign=false commit -m "feat(command): /crash-triage -> mobile-crash-resolver

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Document the agent + command (EN + TR) + full suite

**Files:** Modify `docs/AGENTS.md`, `docs/tr/AGENTS.md`, `docs/COMMANDS.md`, `docs/tr/COMMANDS.md`.

- [ ] **Step 1: `docs/AGENTS.md`** — read it; add a `mobile-crash-resolver` entry near the resolver/review agents, matching the file's existing per-agent format (mirror `android-build-resolver`'s heading/`**Engaged:**` style):
`mobile-crash-resolver` — Triages a pasted stacktrace/logcat/Crashlytics/Sentry crash into a ranked root cause + minimal fix at the exact file:line. Invoked by `/crash-triage`.

- [ ] **Step 2: `docs/tr/AGENTS.md`** — mirror, same location/format, Turkish: `mobile-crash-resolver` — Yapıştırılan stacktrace/logcat/Crashlytics/Sentry kazasını sıralı kök neden + tam `file:line`'da minimal düzeltmeye dönüştürür. `/crash-triage` ile çağrılır.

- [ ] **Step 3: `docs/COMMANDS.md` + `docs/tr/COMMANDS.md`** — add a `/crash-triage` row. Place it in the testing/debug or build-fix command group (wherever diagnostic commands like `/gradle-fix` live, or a "Debug & triage" grouping if one exists; otherwise the build/compile group). EN: `| \`/crash-triage\` | Triages a pasted stacktrace/logcat/Crashlytics/Sentry crash into root cause + minimal fix via \`mobile-crash-resolver\`. | \`/crash-triage\` |`. TR mirror: faithful translation, same example, matching the file's table columns/placement.

- [ ] **Step 4: Full suite** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && npm test 2>&1 | tail -4` → all green (≈438: prior + crash-triage's 2; feature-builder at 29 agents; setup lint covers new agent+command). Capture totals. Also `node scripts/lint-json.js` → exit 0.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add docs/AGENTS.md docs/tr/AGENTS.md docs/COMMANDS.md docs/tr/COMMANDS.md
git -c commit.gpgsign=false commit -m "docs: document mobile-crash-resolver agent + /crash-triage (EN+TR)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review
- **Spec coverage:** agent (all 4 input shapes, signal-only normalization, ranked root cause, minimal fix, structured output) → T1; count-bump 28→29 (mandatory, co-located) → T1; command → T2; contract tests → T1/T2 (`crash-triage.test.js`); docs EN+TR → T3. No gaps.
- **Placeholders:** none — agent + command bodies literal; doc steps give exact content + read-then-place anchors (existing-file edits).
- **Consistency:** agent `mobile-crash-resolver` / command `/crash-triage` consistent across T1/T2/T3 + tests; discipline line byte-identical to lint string; frontmatter shape matches the resolver template; the 28→29 bump is the single documented test change (C already did 27→28; D's expected current value is 28).
- **Safety:** count-bump co-located with agent add (suite never red); text-only agent (no external MCP/network); minimal-diff fix ethos; no hooks/.mcp.json/plugin/source changes; full `npm test` + lint-json run in T3.

