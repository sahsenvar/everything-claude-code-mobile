# Feature F — Instinct Hygiene — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Add `instinctHealth`/`selectPrunable` pure helpers + an `instincts` field in `doctorReport` + a report-first `/instinct-review` command (confirmed prune + `.bak`), document EN+TR — full suite green. No new agent.

**Architecture:** Pure functions in `scripts/lib/instincts.js`; additive injectable change to `scripts/lib/setup.js doctorReport`; prompt command `commands/instinct-review.md`; tests in `tests/unit/instinct-hygiene.test.js`.

**Branch:** `feature/roadmap-efg` (no push; consent at end).

**Verified invariants:** `scripts/lib/instincts.js` exports `loadInstincts/saveInstincts/addInstinct/getInstinctsByContext/getHighConfidenceInstincts/exportInstincts/importInstincts/decayUnusedInstincts`; instinct shape `{id, context, confidence, createdAt, lastUsed, usageCount, ...}`; store `~/.claude/instincts/mobile-instincts.json` via `getInstinctsDir()` (utils). `scripts/lib/setup.js doctorReport({pluginRoot,projectDir,pluginsFile})` returns `{mcp,platform,disciplineSkillPresent,sessionStartHookRegistered,companions,projectDataDirs,ok}` and is exported; its setup.test.js tests assert specific keys (not exhaustive `Object.keys` equality) so an added `instincts` key is safe. No agent added → `feature-builder.test.js` count untouched. Every command needs the exact operating-discipline blockquote (global `setup.test.js` lint). No command-count test. `npm test` runs `tests/unit/*.test.js`.

---

### Task 1: pure `instinctHealth` + `selectPrunable` in `instincts.js`

**Files:** Modify `scripts/lib/instincts.js`; Create `tests/unit/instinct-hygiene.test.js`.

- [ ] **Step 1: Write failing test** — create `tests/unit/instinct-hygiene.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const inst = require('../../scripts/lib/instincts');

const DAY = 86400000;
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();

function sample() {
  return {
    instincts: [
      { id: 'a', confidence: 0.9, lastUsed: iso(1 * DAY) },        // confident, fresh
      { id: 'b', confidence: 0.2, lastUsed: iso(1 * DAY) },        // lowConfidence
      { id: 'c', confidence: 0.8, lastUsed: iso(90 * DAY) },       // stale
      { id: 'd', confidence: 0.5, lastUsed: iso(2 * DAY) },        // healthy mid
      { id: 'e', confidence: 0.1, lastUsed: iso(120 * DAY) },      // low AND stale
    ],
  };
}

describe('Feature F — instinctHealth', () => {
  it('counts total/confident/stale/lowConfidence/prunable', () => {
    const h = inst.instinctHealth(sample());
    assert.strictEqual(h.total, 5);
    assert.strictEqual(h.confident, 2);       // a, c (>=0.7)
    assert.strictEqual(h.stale, 2);           // c, e (>60d)
    assert.strictEqual(h.lowConfidence, 2);   // b, e (<0.3)
    assert.strictEqual(h.prunable, 3);        // b, c, e (low OR stale)
  });
  it('tolerates null / empty / missing fields → zeros', () => {
    for (const d of [null, undefined, {}, { instincts: [] }, { instincts: [{ id: 'x' }] }]) {
      const h = inst.instinctHealth(d);
      assert.strictEqual(typeof h.total, 'number');
      assert.ok(h.prunable >= 0 && h.confident >= 0);
    }
    assert.strictEqual(inst.instinctHealth({ instincts: [{ id: 'x' }] }).prunable, 0); // missing fields → not flagged
  });
});

describe('Feature F — selectPrunable', () => {
  it('returns exactly the low-confidence OR stale instincts, input unmutated', () => {
    const data = sample();
    const snapshot = JSON.stringify(data);
    const ids = inst.selectPrunable(data).map((i) => i.id).sort();
    assert.deepStrictEqual(ids, ['b', 'c', 'e']);
    assert.strictEqual(JSON.stringify(data), snapshot, 'must not mutate input');
  });
  it('honors threshold params', () => {
    const data = sample();
    assert.deepStrictEqual(
      inst.selectPrunable(data, { maxConfidence: 0.05, staleDays: 999 }).map((i) => i.id), []);
  });
});
```

- [ ] **Step 2: Run, verify fail** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/instinct-hygiene.test.js` → FAIL (`inst.instinctHealth is not a function`).

- [ ] **Step 3: Edit `scripts/lib/instincts.js`** — add these pure helpers immediately BEFORE the `module.exports` line:

```js
function _instinctList(data) {
  return data && Array.isArray(data.instincts) ? data.instincts : [];
}
function _isStale(i, staleDays) {
  if (!i || !i.lastUsed) return false;
  const t = Date.parse(i.lastUsed);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > staleDays * 86400000;
}
function _isLowConfidence(i, maxConfidence) {
  return i && typeof i.confidence === 'number' && i.confidence < maxConfidence;
}

function selectPrunable(data, { maxConfidence = 0.3, staleDays = 60 } = {}) {
  return _instinctList(data).filter(
    (i) => _isLowConfidence(i, maxConfidence) || _isStale(i, staleDays)
  );
}

function instinctHealth(data) {
  const list = _instinctList(data);
  return {
    total: list.length,
    confident: list.filter((i) => i && typeof i.confidence === 'number' && i.confidence >= 0.7).length,
    stale: list.filter((i) => _isStale(i, 60)).length,
    lowConfidence: list.filter((i) => _isLowConfidence(i, 0.3)).length,
    prunable: selectPrunable(data).length,
  };
}
```

Then add `instinctHealth` and `selectPrunable` to the existing `module.exports = { … }` object (append the two keys; keep every existing export).

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/instinct-hygiene.test.js` → PASS. Also run the existing instinct suite to confirm no regression: `node --test tests/unit/scripts.test.js 2>&1 | tail -3` → green.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/lib/instincts.js tests/unit/instinct-hygiene.test.js
git -c commit.gpgsign=false commit -m "feat(instincts): pure instinctHealth + selectPrunable helpers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: `doctorReport` + injectable `instinctsFile` + `instincts` field

**Files:** Modify `scripts/lib/setup.js`; Modify `tests/unit/instinct-hygiene.test.js`.

- [ ] **Step 1: Append failing test** to `tests/unit/instinct-hygiene.test.js`:

```js
const os = require('os');
const fs = require('fs');
const path = require('path');
const setup = require('../../scripts/lib/setup');

describe('Feature F — doctorReport.instincts (injectable)', () => {
  it('missing instinctsFile → instincts all-zero, existing keys intact', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'f-root-'));
    const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'f-proj-'));
    const pf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f-pl-')), 'p.json');
    fs.writeFileSync(pf, JSON.stringify({ plugins: {} }));
    const r = setup.doctorReport({ pluginRoot: root, projectDir: proj, pluginsFile: pf,
      instinctsFile: '/no/such/instincts.json' });
    assert.deepStrictEqual(r.instincts, { total: 0, confident: 0, stale: 0, lowConfidence: 0, prunable: 0 });
    for (const k of ['mcp', 'platform', 'companions', 'projectDataDirs', 'ok']) assert.ok(k in r);
  });
  it('populated instinctsFile → health reflects it', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'f-root2-'));
    const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'f-proj2-'));
    const pf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f-pl2-')), 'p.json');
    fs.writeFileSync(pf, JSON.stringify({ plugins: {} }));
    const inf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f-in-')), 'mobile-instincts.json');
    fs.writeFileSync(inf, JSON.stringify({ instincts: [
      { id: 'a', confidence: 0.9, lastUsed: new Date().toISOString() },
      { id: 'b', confidence: 0.1, lastUsed: new Date(Date.now() - 120 * 86400000).toISOString() },
    ] }));
    const r = setup.doctorReport({ pluginRoot: root, projectDir: proj, pluginsFile: pf, instinctsFile: inf });
    assert.strictEqual(r.instincts.total, 2);
    assert.strictEqual(r.instincts.prunable, 1);
  });
});
```

- [ ] **Step 2: Run, verify fail** — `node --test tests/unit/instinct-hygiene.test.js` → FAIL (`r.instincts` undefined).

- [ ] **Step 3: Edit `scripts/lib/setup.js`**:
  - At the top requires, add: `const { instinctHealth } = require('./instincts');` (place with the other `require('./...')` lines).
  - Ensure `getInstinctsDir` is available: it is exported by `./utils`. Where setup.js destructures from `./utils` (e.g. `const { getClaudeConfigDir, readJsonFile } = require('./utils');`), add `getInstinctsDir` to that destructure (do not add a second require line). If setup.js does not currently import from `./utils`, add `const { getInstinctsDir, readJsonFile } = require('./utils');` (use whatever readJsonFile import already exists; don't duplicate).
  - In `doctorReport`, change the signature to accept `instinctsFile` (e.g. `function doctorReport({ pluginRoot, projectDir, pluginsFile, instinctsFile } = {})`), and before building the returned object add:
    ```js
    const instFile = instinctsFile || require('path').join(getInstinctsDir(), 'mobile-instincts.json');
    const instinctsData = readJsonFile(instFile) || { instincts: [] };
    const instincts = instinctHealth(instinctsData);
    ```
  - Add `instincts` to the returned object (alongside `companions`/`ok`). Change NOTHING else in the returned shape or other functions.

- [ ] **Step 4: Run, verify pass + no regression** —
```
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
node --test tests/unit/instinct-hygiene.test.js 2>&1 | tail -3
node --test tests/unit/setup.test.js 2>&1 | tail -3
node --check scripts/lib/setup.js
```
Expected: instinct-hygiene green; **setup.test.js still green** (existing doctorReport tests don't assert exhaustive keys; the added `instincts` key + injectable param doesn't break them — if any setup.test.js doctorReport test fails, STOP and report: the assumption was wrong, do not weaken existing tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/lib/setup.js tests/unit/instinct-hygiene.test.js
git -c commit.gpgsign=false commit -m "feat(doctor): instinct health in doctorReport (injectable instinctsFile)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: `/instinct-review` command (report-first, confirmed prune + .bak)

**Files:** Modify `tests/unit/instinct-hygiene.test.js`; Create `commands/instinct-review.md`.

- [ ] **Step 1: Append failing test** to `tests/unit/instinct-hygiene.test.js`:

```js
describe('Feature F — instinct-review command', () => {
  it('exists, valid, discipline ref, report-first + .bak + invokes instincts lib', () => {
    const p = path.join(__dirname, '..', '..', 'commands', 'instinct-review.md');
    assert.ok(fs.existsSync(p), 'command must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, 'frontmatter');
    assert.ok(c.includes('ecc-operating-discipline'), 'discipline ref');
    assert.match(c, /report|no flag|default/i, 'report-first wording');
    assert.match(c, /\.bak/, 'backup before prune');
    assert.ok(c.includes('scripts/lib/instincts'), 'invokes the instincts lib');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `node --test tests/unit/instinct-hygiene.test.js` → FAIL (command missing).

- [ ] **Step 3: Create `commands/instinct-review.md`** EXACTLY:

```markdown
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
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/instinct-hygiene.test.js` → PASS (all F describes green).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/instinct-review.md tests/unit/instinct-hygiene.test.js
git -c commit.gpgsign=false commit -m "feat(command): /instinct-review (report-first, confirmed prune + .bak)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Docs (EN + TR) + full suite

**Files:** Modify `docs/COMMANDS.md`, `docs/tr/COMMANDS.md`.

- [ ] **Step 1: `docs/COMMANDS.md`** — read it; in the learning/instinct command group (where `/instinct-status`,`/instinct-export`,`/instinct-import`,`/learn`,`/evolve` live), add a row matching the table style:
`| \`/instinct-review [--prune]\` | Reports instinct health + prunable (stale/low-confidence); prunes only on explicit confirm, after a \`.bak\`. | \`/instinct-review\` |`
Also update the `/ecc-doctor` row's description to append: ` Includes instinct health.` (only append; keep the rest of that row intact.)

- [ ] **Step 2: `docs/tr/COMMANDS.md`** — mirror: add the `/instinct-review` row in the matching group, Turkish "Ne yapar": `Instinct sağlığını + budanabilirleri (bayat/düşük-güven) raporlar; yalnızca açık onayla, .bak sonrası budar.`, same example; and append ` Instinct sağlığını da içerir.` to the `/ecc-doctor` row's Turkish description (keep the rest intact).

- [ ] **Step 3: Full suite** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && npm test 2>&1 | tail -4` → all green (prior + instinct-hygiene's describes; setup.test.js still green; discipline lint covers the new command). Also `node scripts/lint-json.js` → exit 0. Capture totals.

- [ ] **Step 4: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add docs/COMMANDS.md docs/tr/COMMANDS.md
git -c commit.gpgsign=false commit -m "docs: document /instinct-review + /ecc-doctor instinct health (EN+TR)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review
- **Spec coverage:** pure helpers → F-T1; doctorReport instinct health (injectable) → F-T2; report-first/confirmed-prune/.bak command → F-T3; docs EN+TR + /ecc-doctor note → F-T4. No new agent (no count bump). No gaps.
- **Placeholders:** none — helper code, test code, command body literal; doc steps give exact insert content + read-then-place anchors (existing-file edits).
- **Consistency:** `instinctHealth`/`selectPrunable` signatures + `{total,confident,stale,lowConfidence,prunable}` shape consistent across F-T1/F-T2/F-T3 + tests + command + docs; discipline line byte-identical to lint string; `instinctsFile` injection mirrors the shipped `pluginsFile` pattern; the F-T2 test asserts existing doctorReport keys still present (regression guard).
- **Safety:** pure functions (no fs/global) → deterministic; doctorReport change additive+injectable with an explicit "STOP if setup.test.js breaks" gate; command is report-only by default and never prunes without `.bak` + explicit confirm (non-destructive ethos for the user's global store); conservative prune predicates (missing confidence/lastUsed → NOT flagged); no agent/hooks/.mcp.json/plugin/skill changes; full `npm test`+lint-json in F-T4.

