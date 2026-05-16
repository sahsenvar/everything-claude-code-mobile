# Plan 2A — Mechanical Fixes + Test Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repo structurally sound — all 27 agents load with valid frontmatter, and the 5 obsolete `feature-builder.test.js` plugin-registration assertions are rewritten to validate the auto-discovery model so `npm test` is fully green.

**Architecture:** TDD order per the approved spec — first rewrite the 5 test assertions into a structural-loadability guard (goes RED because 3 agents lack frontmatter), then add the 3 missing frontmatter blocks (goes GREEN). The rewritten test is the proof of the fix and a permanent regression guard.

**Tech Stack:** Node.js `node:test` + `node:assert`, regex `parseFrontmatter({ meta, body })` helper (already in the test file), `npm test`, `npm run lint:json`, `npm run lint:scripts`, `claude plugin validate`.

**Spec:** `docs/superpowers/specs/2026-05-16-ecc-mobile-plan2a-mechanical-fixes-design.md`

**Verified facts (do not re-derive):** `agents/` has exactly 27 `.md` files. All 24 already-valid agents have `name` == filename slug (invariant confirmed). Only `mobile-verifier.md`, `mobile-compactor.md`, `mobile-pattern-extractor.md` lack frontmatter (start with `# X Agent`). `network-impl.md` is valid. `commands/` has 35 `.md` files. `skills/*/SKILL.md` = 46, all valid. `parseFrontmatter` returns `{ meta, body }`, `meta` is `null` when no frontmatter else `{ key: trimmedString }`. Test constants `ROOT_DIR, AGENTS_DIR, COMMANDS_DIR, SKILLS_DIR, PLUGIN_FILE` already defined at the top of the test file. `package.json` `version` (1.1.5) mismatch with `plugin.json` (1.2.1) is INTENTIONALLY out of scope (spec §5) — do not touch it or any manifest/hook/MCP file.

---

### Task 1: Rewrite the 5 plugin-registration assertions (RED by design)

**Files:**
- Modify: `tests/unit/feature-builder.test.js` (the entire `describe('Feature Builder - Plugin Registration', …)` block, currently lines 291–345)

- [ ] **Step 1: Replace the obsolete describe block**

Use Edit on `tests/unit/feature-builder.test.js`.

`old_string` (exact current block, lines 291–345):

```javascript
describe('Feature Builder - Plugin Registration', () => {
    it('should have a valid plugin.json', () => {
        assert.ok(fs.existsSync(PLUGIN_FILE), 'plugin.json should exist');
        const plugin = readJson(PLUGIN_FILE);
        assert.ok(plugin, 'plugin.json should be valid JSON');
        assert.ok(plugin.name, 'Should have a name');
        assert.ok(plugin.agents, 'Should have agents array');
        assert.ok(plugin.skills, 'Should have skills array');
    });

    it('should list all 27 agents', () => {
        const plugin = readJson(PLUGIN_FILE);
        assert.strictEqual(
            plugin.agents.length,
            27,
            `Expected 27 agents, got ${plugin.agents.length}`
        );
    });

    it('should have all listed agent files existing on disk', () => {
        const plugin = readJson(PLUGIN_FILE);
        for (const agentPath of plugin.agents) {
            const resolved = path.resolve(ROOT_DIR, agentPath);
            assert.ok(
                fs.existsSync(resolved),
                `Agent file should exist: ${agentPath}`
            );
        }
    });

    it('should include all 8 new feature agents', () => {
        const plugin = readJson(PLUGIN_FILE);
        const newAgents = [
            'feature-planner', 'network-impl', 'data-impl',
            'architecture-impl', 'ui-impl', 'wiring-impl',
            'unit-test-writer', 'ui-test-writer',
        ];
        for (const agent of newAgents) {
            const found = plugin.agents.some(a => a.includes(agent));
            assert.ok(found, `plugin.json should list ${agent}`);
        }
    });

    it('should have skills array pointing to skills and commands', () => {
        const plugin = readJson(PLUGIN_FILE);
        assert.ok(
            plugin.skills.some(s => s.includes('skills')),
            'Should have skills directory reference'
        );
        assert.ok(
            plugin.skills.some(s => s.includes('commands')),
            'Should have commands directory reference'
        );
    });
});
```

`new_string`:

```javascript
describe('Feature Builder - Plugin Registration', () => {
    // Plan 1 established that Claude Code auto-discovers components from the
    // agents/ skills/ commands/ directories. Declaring these keys in
    // plugin.json breaks install (directory-string -> "agents: Invalid
    // input"; explicit file array -> Agents (0)). The manifest MUST stay
    // metadata-only; these tests validate the auto-discovery reality.

    it('should have a metadata-only plugin.json (no agents/skills/commands keys)', () => {
        assert.ok(fs.existsSync(PLUGIN_FILE), 'plugin.json should exist');
        const plugin = readJson(PLUGIN_FILE);
        assert.ok(plugin, 'plugin.json should be valid JSON');
        assert.ok(plugin.name, 'Should have a name');
        assert.strictEqual(plugin.agents, undefined, 'plugin.json must NOT declare an agents key (auto-discovery)');
        assert.strictEqual(plugin.skills, undefined, 'plugin.json must NOT declare a skills key (auto-discovery)');
        assert.strictEqual(plugin.commands, undefined, 'plugin.json must NOT declare a commands key (auto-discovery)');
    });

    it('should auto-discover exactly 27 agents with valid frontmatter', () => {
        const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
        assert.strictEqual(
            agentFiles.length,
            27,
            `Expected 27 agent files in agents/, got ${agentFiles.length}`
        );
        for (const file of agentFiles) {
            const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
            assert.ok(content.startsWith('---'), `${file} should start with --- frontmatter`);
            const { meta } = parseFrontmatter(content);
            assert.ok(meta, `${file} should have parseable frontmatter`);
            assert.ok(meta.name, `${file} should have a name field`);
            assert.ok(meta.description, `${file} should have a description field`);
        }
    });

    it('should have each agent name match its filename and be unique', () => {
        const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));
        const seen = new Set();
        for (const file of agentFiles) {
            const slug = file.replace(/\.md$/, '');
            const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
            const { meta } = parseFrontmatter(content);
            assert.ok(meta, `${file} should have parseable frontmatter`);
            assert.strictEqual(meta.name, slug, `${file} frontmatter name should equal "${slug}"`);
            assert.ok(!seen.has(meta.name), `Duplicate agent name: ${meta.name}`);
            seen.add(meta.name);
        }
    });

    it('should include all 8 feature-builder agents with valid frontmatter', () => {
        const newAgents = [
            'feature-planner', 'network-impl', 'data-impl',
            'architecture-impl', 'ui-impl', 'wiring-impl',
            'unit-test-writer', 'ui-test-writer',
        ];
        for (const agent of newAgents) {
            const filePath = path.join(AGENTS_DIR, `${agent}.md`);
            assert.ok(fs.existsSync(filePath), `agents/${agent}.md should exist`);
            const { meta } = parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
            assert.ok(meta, `${agent}.md should have parseable frontmatter`);
            assert.ok(meta.name, `${agent}.md should have a name field`);
            assert.ok(meta.description, `${agent}.md should have a description field`);
        }
    });

    it('should auto-discover skills and commands directories', () => {
        const skillFiles = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(SKILLS_DIR, d.name, 'SKILL.md'))
            .filter(p => fs.existsSync(p));
        assert.ok(skillFiles.length > 0, 'skills/ should contain at least one SKILL.md');
        for (const p of skillFiles) {
            const { meta } = parseFrontmatter(fs.readFileSync(p, 'utf8'));
            assert.ok(meta, `${p} should have parseable frontmatter`);
            assert.ok(meta.name, `${p} should have a name field`);
            assert.ok(meta.description, `${p} should have a description field`);
        }

        const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
        assert.ok(commandFiles.length > 0, 'commands/ should contain at least one .md command');
    });
});
```

- [ ] **Step 2: Run the test file, verify it fails for the RIGHT reason**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/feature-builder.test.js 2>&1 | grep -E '✖|not ok|should start with|parseable frontmatter|# (pass|fail|tests)' | head -30`

Expected: exactly 2 failing `it` subtests, both pointing at the 3 frontmatter-less agents:
- `should auto-discover exactly 27 agents with valid frontmatter` → fails: `mobile-compactor.md should start with --- frontmatter` (or mobile-pattern-extractor/mobile-verifier — whichever is read first)
- `should have each agent name match its filename and be unique` → fails: `mobile-compactor.md should have parseable frontmatter`

The other 3 new `it` blocks PASS. This proves the new test actually guards the frontmatter bug. If anything else fails, STOP and investigate before continuing.

- [ ] **Step 3: Commit (RED, greened in Task 2)**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add tests/unit/feature-builder.test.js
git commit -m "test: rewrite plugin-registration asserts to validate auto-discovery

Replaces 5 obsolete assertions that expected plugin.json agents/skills
arrays (removed in Plan 1 — re-adding breaks install) with a structural
loadability guard over agents/ skills/ commands/. RED by design: fails
on the 3 frontmatter-less agents until Task 2 adds their frontmatter.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Add frontmatter to the 3 agents (GREEN)

**Files:**
- Modify: `agents/mobile-verifier.md` (prepend frontmatter)
- Modify: `agents/mobile-compactor.md` (prepend frontmatter)
- Modify: `agents/mobile-pattern-extractor.md` (prepend frontmatter)

- [ ] **Step 1: Add frontmatter to `agents/mobile-verifier.md`**

Edit `agents/mobile-verifier.md`. `old_string`: `# Mobile Verifier Agent`  →  `new_string`:

```markdown
---
name: mobile-verifier
description: Mobile verification specialist. Runs test suites in pass@k loops to detect flaky tests and measure reliability. Use after implementing features, before commit/push, or when investigating test failures.
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: opus
---

# Mobile Verifier Agent
```

- [ ] **Step 2: Add frontmatter to `agents/mobile-compactor.md`**

Edit `agents/mobile-compactor.md`. `old_string`: `# Mobile Compactor Agent`  →  `new_string`:

```markdown
---
name: mobile-compactor
description: Mobile context-compaction specialist. Analyzes the session and applies a strategic compaction plan to cut token usage while preserving critical context. Use when token usage is high, switching modules, or before a large refactor.
tools: ["Read", "Grep", "Glob"]
model: opus
---

# Mobile Compactor Agent
```

- [ ] **Step 3: Add frontmatter to `agents/mobile-pattern-extractor.md`**

Edit `agents/mobile-pattern-extractor.md`. `old_string`: `# Mobile Pattern Extractor Agent`  →  `new_string`:

```markdown
---
name: mobile-pattern-extractor
description: Mobile pattern-extraction specialist. Analyzes Android/Kotlin codebases to identify reusable patterns and capture them as instincts for the continuous-learning system. Use after a feature is implemented, after refactoring, or to consolidate learning.
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

# Mobile Pattern Extractor Agent
```

- [ ] **Step 4: Run the test file, verify GREEN**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/feature-builder.test.js 2>&1 | grep -E '# (pass|fail|tests)'`

Expected: `# fail 0` (all `it` blocks in the file pass).

- [ ] **Step 5: Run the full suite, verify 0 failures**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && npm test 2>&1 | grep -E '# (pass|fail|tests)'`

Expected: `# fail 0` (≈402 tests, all pass). `pretest` (`lint:scripts`) must also pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add agents/mobile-verifier.md agents/mobile-compactor.md agents/mobile-pattern-extractor.md
git commit -m "fix: add valid frontmatter to 3 agents (verifier/compactor/pattern-extractor)

These 3 agents had no YAML frontmatter so Claude Code loaded them with a
placeholder description and All tools. Adds name/description/tools/model
mirroring sibling agents. Greens the Task 1 auto-discovery guard.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Finalize — full validation gates + FORK-NOTES + handoff

**Files:**
- Modify: `FORK-NOTES.md` (replace the stale "Known: feature-builder.test.js …" bullet)

- [ ] **Step 1: Run all validation gates**

Run each; all must succeed:

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'        # expect: # fail 0
npm run lint:json                                     # expect: exit 0, no errors
npm run lint:scripts                                  # expect: exit 0 (node --check passes)
claude plugin validate . 2>&1 | tail -5               # expect: manifest valid (unchanged)
```

If any gate fails, STOP and fix before continuing.

- [ ] **Step 2: Update FORK-NOTES.md**

Edit `FORK-NOTES.md`. `old_string`:

```markdown
- Known: `tests/unit/feature-builder.test.js` has ~5 assertions expecting
  `plugin.json` to list `agents`/`skills` as arrays. These predate this fork
  (failing at upstream baseline) and encode an outdated manifest convention;
  deferred to the Plan 2 content-quality review. The plugin itself is fully
  functional (components load via auto-discovery).
```

`new_string`:

```markdown
- Plan 2A: the 5 `tests/unit/feature-builder.test.js` plugin-registration
  assertions (which expected `plugin.json` to list `agents`/`skills` arrays —
  an outdated convention removed in Plan 1) were rewritten into a structural
  loadability guard that scans `agents/`, `skills/`, and `commands/` and
  asserts per-file frontmatter validity. Three agents lacking frontmatter
  (`mobile-verifier`, `mobile-compactor`, `mobile-pattern-extractor`) were
  fixed in the same cycle. `npm test` is fully green. (`agents/network-impl.md`
  was already valid — an earlier note claiming a YAML parse error was wrong.)
```

- [ ] **Step 3: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add FORK-NOTES.md
git commit -m "docs: record Plan 2A resolution in FORK-NOTES

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 4: Branch + merge handoff (ask the user)**

Plan 2A commits currently sit on `plan2/content-quality-review`. Per the spec, the branch-split decision is made with the user now. Present, via AskUserQuestion:
- **Branch:** (a) keep these 3 commits on `plan2/content-quality-review`; or (b) move them to a dedicated `plan2a/mechanical-fixes` branch cut from `main`, leaving `plan2/content-quality-review` pristine for Plan 2B/2C (recommended — matches the "split A out" decision).
- **Merge:** whether to merge to `main` + push now (Plan 1 pattern; the push to `main` requires explicit user consent) or hold.

Do NOT push to `main` without explicit user approval. Report final state (branch, commits, `npm test` green) when done.

---

## Self-Review

**Spec coverage:**
- Spec §3 Component 1 (3 agent frontmatters) → Task 2 (exact blocks, derived from spec table). ✅
- Spec §3 Component 2 (rewrite 5 assertions, items 1–5) → Task 1 new block: item 1 = "metadata-only" it; item 2 = "27 agents valid frontmatter" it; item 3 = "name match + unique" it; item 4 = "8 feature agents" it; item 5 = "skills + commands dirs" it. ✅
- Spec §4 TDD order (tests first RED → agents GREEN) → Task 1 (RED, verified Step 2) then Task 2 (GREEN). ✅
- Spec §4 validation gates (npm test/lint:json/lint:scripts/claude plugin validate) → Task 3 Step 1. ✅
- Spec §4 side task (correct `ecc-mobile-fork-project` memory) → already done before plan write (memory file corrected). FORK-NOTES update → Task 3 Step 2. ✅
- Spec §4 branch/merge decision deferred to this transition → Task 3 Step 4. ✅
- Spec §5 out-of-scope (no manifest/hook/MCP/body edits, package.json version untouched) → stated in header; no task touches them. ✅

**Placeholder scan:** No TBD/TODO. Every code step shows complete content. Commands have expected output. No "similar to Task N". ✅

**Type consistency:** `parseFrontmatter` destructured as `{ meta }`/`{ body }` matching the helper's real return (`{ meta, body }`, line 40). Constants `AGENTS_DIR/SKILLS_DIR/COMMANDS_DIR/PLUGIN_FILE/ROOT_DIR` match the file's definitions (lines 25–29). Agent `name` values equal filename slugs (invariant pre-verified). ✅

No gaps found.
