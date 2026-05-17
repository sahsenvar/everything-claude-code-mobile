# ECC-Mobile Setup & Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the plugin installable in one command (`/ecc-setup`), self-diagnosable (`/ecc-doctor`), with a SessionStart nudge, mobile-dev discipline shipped as a plugin-native skill (zero copy, clean uninstall), and companion-plugin detection — all without breaking the existing 402-test suite.

**Architecture:** All logic lives in one pure, unit-tested module `scripts/lib/setup.js`. Thin consumers (two `commands/*.md`, one `scripts/hooks/check-setup.js`, the refactored `scripts/install-mcp-deps.js`) call into it. Discipline `rules/*.md` content is consolidated into `skills/ecc-operating-discipline/SKILL.md`; every ECC agent/command references it via one body line, enforced by a lint test.

**Tech Stack:** Node.js (CommonJS), `node:test` + `node:assert`, existing `scripts/lib/{paths,utils,hook-input}.js`, `${CLAUDE_PLUGIN_ROOT}` path portability.

**Branch:** `feature/ecc-setup-health` (already created). **Do NOT push** (no main/remote push without explicit user consent).

**Verified invariants (from recon — do not re-investigate):**
- `scripts/lib/paths.js` exports `{ pluginRoot(), projectDir() }` (env-var first, sane fallbacks).
- `scripts/lib/utils.js` exports include `getClaudeConfigDir()` (→ `~/.claude`), `log(msg,type)`, `readJsonFile(p)→obj|null`, `ensureDir(d)`.
- Only ONE exact-count test exists: `tests/unit/feature-builder.test.js:308-314` asserts exactly **27 agents** (we add none → stays valid). No exact COMMANDS/SKILLS count test. No doc-count test. No "hooks.json script exists" test. `NEW_COMMANDS`/`NEW_SKILLS` arrays are iterate-only-known — do NOT edit them.
- `missing-hooks.test.js:97-109` only requires `hooks` to be a non-array object with `Stop`/`PreCompact`/`PostToolUse` arrays present, no `/Users/ah3sh/`, and `${CLAUDE_PLUGIN_ROOT}` present. Adding a `SessionStart` key is compatible.
- `pretest` runs `npm run lint:scripts` = `node --check scripts/hooks/*.js scripts/lib/*.js`. New `scripts/lib/setup.js` and `scripts/hooks/check-setup.js` MUST be syntactically valid or `npm test` fails before any test.
- `lint:json` JSON-parses every `.json` under `hooks/`, `mcp-configs/`, `.claude-plugin/` → `hooks/hooks.json` must stay valid JSON.
- `feature-builder.test.js:355-376` iterates every `skills/*/` dir and requires a `SKILL.md` with `---` frontmatter containing `name:` and `description:`. New skill must comply.

---

### Task 1: `setup.js` — `detectState` + `setupNudge`

**Files:**
- Create: `scripts/lib/setup.js`
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/setup.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const setup = require('../../scripts/lib/setup');

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('scripts/lib/setup.js — detectState', () => {
  it('reports mcpDeps false when node_modules absent, true when present', () => {
    const root = tmpdir('ecc-root-');
    for (const s of setup.SERVERS) {
      fs.mkdirSync(path.join(root, 'mcp-servers', s), { recursive: true });
    }
    fs.mkdirSync(path.join(root, 'mcp-servers', 'mobile-memory', 'node_modules'), { recursive: true });
    const proj = tmpdir('ecc-proj-');
    const state = setup.detectState({ pluginRoot: root, projectDir: proj });
    assert.strictEqual(state.mcpDeps['mobile-memory'], true);
    assert.strictEqual(state.mcpDeps['ios-memory'], false);
    assert.strictEqual(state.mcpDeps['kmp-context'], false);
  });

  it('detects android / ios / kmp / unknown platform', () => {
    const root = tmpdir('ecc-root-');
    const a = tmpdir('p-a-'); fs.writeFileSync(path.join(a, 'build.gradle.kts'), '');
    const i = tmpdir('p-i-'); fs.writeFileSync(path.join(i, 'Package.swift'), '');
    const k = tmpdir('p-k-'); fs.writeFileSync(path.join(k, 'build.gradle.kts'), 'kotlin("multiplatform")');
    const u = tmpdir('p-u-');
    assert.strictEqual(setup.detectState({ pluginRoot: root, projectDir: a }).platform, 'android');
    assert.strictEqual(setup.detectState({ pluginRoot: root, projectDir: i }).platform, 'ios');
    assert.strictEqual(setup.detectState({ pluginRoot: root, projectDir: k }).platform, 'kmp');
    assert.strictEqual(setup.detectState({ pluginRoot: root, projectDir: u }).platform, 'unknown');
  });

  it('disciplineSkillPresent + sessionStartHookRegistered reflect files', () => {
    const root = tmpdir('ecc-root-');
    let state = setup.detectState({ pluginRoot: root, projectDir: root });
    assert.strictEqual(state.disciplineSkillPresent, false);
    assert.strictEqual(state.sessionStartHookRegistered, false);
    fs.mkdirSync(path.join(root, 'skills', 'ecc-operating-discipline'), { recursive: true });
    fs.writeFileSync(path.join(root, 'skills', 'ecc-operating-discipline', 'SKILL.md'), 'x');
    fs.mkdirSync(path.join(root, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check-setup.js"' }] }] }
    }));
    state = setup.detectState({ pluginRoot: root, projectDir: root });
    assert.strictEqual(state.disciplineSkillPresent, true);
    assert.strictEqual(state.sessionStartHookRegistered, true);
  });
});

describe('scripts/lib/setup.js — setupNudge', () => {
  it('returns the nudge string when any dep missing, null otherwise', () => {
    assert.strictEqual(
      setup.setupNudge({ mcpDeps: { 'mobile-memory': false, 'ios-memory': true, 'kmp-context': true } }),
      '⚠ ECC: MCP server dependencies missing — run /ecc-setup to install'
    );
    assert.strictEqual(
      setup.setupNudge({ mcpDeps: { 'mobile-memory': true, 'ios-memory': true, 'kmp-context': true } }),
      null
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/setup.test.js`
Expected: FAIL — `Cannot find module '../../scripts/lib/setup'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/lib/setup.js`:

```js
/**
 * Setup & health primitives. Pure: no side effects at require time.
 * Single source of truth for /ecc-setup, /ecc-doctor, check-setup.js,
 * and the install-mcp-deps.js CLI shim.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { getClaudeConfigDir, readJsonFile } = require('./utils');

const SERVERS = ['mobile-memory', 'ios-memory', 'kmp-context'];

const NUDGE = '⚠ ECC: MCP server dependencies missing — run /ecc-setup to install';

function detectPlatform(projectDir) {
  try {
    const has = (f) => fs.existsSync(path.join(projectDir, f));
    const gradleKts = path.join(projectDir, 'build.gradle.kts');
    if (fs.existsSync(gradleKts)) {
      const txt = fs.readFileSync(gradleKts, 'utf8');
      if (txt.includes('kotlin("multiplatform")') || fs.existsSync(path.join(projectDir, 'shared'))) {
        return 'kmp';
      }
    }
    if (has('build.gradle') || has('build.gradle.kts') || has('settings.gradle') || has('settings.gradle.kts')) {
      return 'android';
    }
    const entries = fs.existsSync(projectDir) ? fs.readdirSync(projectDir) : [];
    if (has('Package.swift') || entries.some((e) => e.endsWith('.xcodeproj') || e.endsWith('.xcworkspace'))) {
      return 'ios';
    }
  } catch (_) { /* fall through */ }
  return 'unknown';
}

function detectState({ pluginRoot, projectDir }) {
  const mcpDeps = {};
  for (const s of SERVERS) {
    mcpDeps[s] = fs.existsSync(path.join(pluginRoot, 'mcp-servers', s, 'node_modules'));
  }
  const disciplineSkillPresent = fs.existsSync(
    path.join(pluginRoot, 'skills', 'ecc-operating-discipline', 'SKILL.md')
  );
  let sessionStartHookRegistered = false;
  const cfg = readJsonFile(path.join(pluginRoot, 'hooks', 'hooks.json'));
  if (cfg && cfg.hooks && Array.isArray(cfg.hooks.SessionStart)) {
    sessionStartHookRegistered = JSON.stringify(cfg.hooks.SessionStart).includes('check-setup.js');
  }
  return {
    mcpDeps,
    platform: detectPlatform(projectDir),
    sessionStartHookRegistered,
    disciplineSkillPresent,
  };
}

function setupNudge(state) {
  const missing = Object.values(state.mcpDeps).some((v) => v === false);
  return missing ? NUDGE : null;
}

module.exports = { SERVERS, NUDGE, detectState, setupNudge, getClaudeConfigDir };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/setup.test.js`
Expected: PASS — all `detectState` + `setupNudge` tests green.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/lib/setup.js tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(setup): detectState + setupNudge core

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: `setup.js` — `installMcpDeps`

**Files:**
- Modify: `scripts/lib/setup.js`
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('scripts/lib/setup.js — installMcpDeps', () => {
  it('skips servers without package.json, installs/falls back, aggregates failures', () => {
    const root = tmpdir('ecc-inst-');
    fs.mkdirSync(path.join(root, 'mcp-servers', 'mobile-memory'), { recursive: true });
    fs.writeFileSync(path.join(root, 'mcp-servers', 'mobile-memory', 'package.json'), '{}');
    fs.writeFileSync(path.join(root, 'mcp-servers', 'mobile-memory', 'package-lock.json'), '{}');
    fs.mkdirSync(path.join(root, 'mcp-servers', 'ios-memory'), { recursive: true });
    fs.writeFileSync(path.join(root, 'mcp-servers', 'ios-memory', 'package.json'), '{}');
    // kmp-context dir absent entirely -> skipped

    const calls = [];
    const runInstall = (dir, hasLock) => {
      calls.push({ dir, hasLock });
      if (dir.includes('ios-memory')) throw new Error('boom');
    };
    const { perServer } = setup.installMcpDeps({ pluginRoot: root, runInstall });

    assert.strictEqual(perServer['mobile-memory'].status, 'installed');
    assert.strictEqual(perServer['ios-memory'].status, 'failed');
    assert.match(perServer['ios-memory'].error, /boom/);
    assert.strictEqual(perServer['kmp-context'].status, 'skipped');
    assert.strictEqual(calls.find((c) => c.dir.includes('mobile-memory')).hasLock, true);
  });

  it('never throws even if runInstall throws for all', () => {
    const root = tmpdir('ecc-inst2-');
    fs.mkdirSync(path.join(root, 'mcp-servers', 'mobile-memory'), { recursive: true });
    fs.writeFileSync(path.join(root, 'mcp-servers', 'mobile-memory', 'package.json'), '{}');
    assert.doesNotThrow(() =>
      setup.installMcpDeps({ pluginRoot: root, runInstall: () => { throw new Error('x'); } })
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — `setup.installMcpDeps is not a function`.

- [ ] **Step 3: Write minimal implementation** (edit `scripts/lib/setup.js`)

Add before `module.exports`:

```js
function defaultRunInstall(dir, hasLock) {
  execFileSync('npm', [hasLock ? 'ci' : 'install', '--omit=dev'], { cwd: dir, stdio: 'inherit' });
}

function installMcpDeps({ pluginRoot, servers = SERVERS, runInstall = defaultRunInstall }) {
  const perServer = {};
  for (const name of servers) {
    const dir = path.join(pluginRoot, 'mcp-servers', name);
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
      perServer[name] = { status: 'skipped' };
      continue;
    }
    const hasLock = fs.existsSync(path.join(dir, 'package-lock.json'));
    try {
      runInstall(dir, hasLock);
      perServer[name] = { status: 'installed' };
    } catch (e) {
      perServer[name] = { status: 'failed', error: String((e && e.message) || e) };
    }
  }
  return { perServer };
}
```

Update the exports line to:

```js
module.exports = { SERVERS, NUDGE, detectState, setupNudge, installMcpDeps, getClaudeConfigDir };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/setup.test.js`
Expected: PASS — all `installMcpDeps` tests green.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/lib/setup.js tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(setup): installMcpDeps with injectable runner + failure aggregation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: `setup.js` — `detectCompanions`

**Files:**
- Modify: `scripts/lib/setup.js`
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('scripts/lib/setup.js — detectCompanions', () => {
  it('maps known prefixes present/absent, tolerant of @marketplace + version', () => {
    const f = path.join(tmpdir('ecc-pl-'), 'installed_plugins.json');
    fs.writeFileSync(f, JSON.stringify({
      plugins: {
        'figma@claude-plugins-official': [{ version: '2.1.30' }],
        'github-mcp@some-market': [{ version: '1.0.0' }],
        'everything-claude-code-mobile@everything-claude-code-mobile': [{ version: '1.2.1' }]
      }
    }));
    const c = setup.detectCompanions({ pluginsFile: f });
    assert.strictEqual(c.figma, 'present');
    assert.strictEqual(c.github, 'present');
    assert.strictEqual(c.atlassian, 'absent');
  });

  it('returns all unknown when file missing or unparseable', () => {
    const miss = setup.detectCompanions({ pluginsFile: '/no/such/file.json' });
    assert.deepStrictEqual(miss, { figma: 'unknown', atlassian: 'unknown', github: 'unknown' });
    const bad = path.join(tmpdir('ecc-bad-'), 'installed_plugins.json');
    fs.writeFileSync(bad, 'not json');
    assert.deepStrictEqual(setup.detectCompanions({ pluginsFile: bad }),
      { figma: 'unknown', atlassian: 'unknown', github: 'unknown' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — `setup.detectCompanions is not a function`.

- [ ] **Step 3: Write minimal implementation** (edit `scripts/lib/setup.js`)

Add before `module.exports`:

```js
const COMPANION_PREFIXES = { figma: 'figma', atlassian: 'atlassian', github: 'github' };

function defaultPluginsFile() {
  return path.join(getClaudeConfigDir(), 'plugins', 'installed_plugins.json');
}

function detectCompanions({ pluginsFile = defaultPluginsFile() } = {}) {
  const result = { figma: 'unknown', atlassian: 'unknown', github: 'unknown' };
  let json;
  try {
    json = JSON.parse(fs.readFileSync(pluginsFile, 'utf8'));
  } catch (_) {
    return result;
  }
  const keys = Object.keys((json && json.plugins) || {});
  const names = keys.map((k) => k.split('@')[0]);
  for (const [companion, prefix] of Object.entries(COMPANION_PREFIXES)) {
    result[companion] = names.some((n) => n.startsWith(prefix)) ? 'present' : 'absent';
  }
  return result;
}
```

Update the exports line to:

```js
module.exports = { SERVERS, NUDGE, detectState, setupNudge, installMcpDeps, detectCompanions, getClaudeConfigDir };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/setup.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/lib/setup.js tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(setup): detectCompanions via installed_plugins.json (prefix match)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: `setup.js` — `doctorReport`

**Files:**
- Modify: `scripts/lib/setup.js`
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('scripts/lib/setup.js — doctorReport', () => {
  it('composes a structured report with ok=false when deps missing', () => {
    const root = tmpdir('ecc-doc-');
    const proj = tmpdir('ecc-docp-');
    const f = path.join(tmpdir('ecc-docpl-'), 'installed_plugins.json');
    fs.writeFileSync(f, JSON.stringify({ plugins: {} }));
    const r = setup.doctorReport({ pluginRoot: root, projectDir: proj, pluginsFile: f });
    assert.deepStrictEqual(Object.keys(r.mcp).sort(), [...setup.SERVERS].sort());
    assert.strictEqual(r.mcp['mobile-memory'].depsInstalled, false);
    assert.strictEqual(r.platform, 'unknown');
    assert.strictEqual(r.disciplineSkillPresent, false);
    assert.strictEqual(r.sessionStartHookRegistered, false);
    assert.deepStrictEqual(r.companions, { figma: 'absent', atlassian: 'absent', github: 'absent' });
    assert.ok(Array.isArray(r.projectDataDirs) && r.projectDataDirs.includes('.claude/mobile-memory'));
    assert.strictEqual(r.ok, false);
  });

  it('ok=true when all deps installed + skill + hook registered', () => {
    const root = tmpdir('ecc-doc2-');
    for (const s of setup.SERVERS) {
      fs.mkdirSync(path.join(root, 'mcp-servers', s, 'node_modules'), { recursive: true });
    }
    fs.mkdirSync(path.join(root, 'skills', 'ecc-operating-discipline'), { recursive: true });
    fs.writeFileSync(path.join(root, 'skills', 'ecc-operating-discipline', 'SKILL.md'), 'x');
    fs.mkdirSync(path.join(root, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(root, 'hooks', 'hooks.json'), JSON.stringify({
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'node "x/scripts/hooks/check-setup.js"' }] }] }
    }));
    const f = path.join(tmpdir('ecc-doc2pl-'), 'p.json');
    fs.writeFileSync(f, JSON.stringify({ plugins: {} }));
    const r = setup.doctorReport({ pluginRoot: root, projectDir: root, pluginsFile: f });
    assert.strictEqual(r.ok, true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — `setup.doctorReport is not a function`.

- [ ] **Step 3: Write minimal implementation** (edit `scripts/lib/setup.js`)

Add before `module.exports`:

```js
const PROJECT_DATA_DIRS = [
  '.claude/mobile-memory', '.claude/ios-memory', '.claude/kmp-context', '.claude/checkpoints',
];

function doctorReport({ pluginRoot, projectDir, pluginsFile }) {
  const state = detectState({ pluginRoot, projectDir });
  const companions = detectCompanions(pluginsFile ? { pluginsFile } : {});
  const mcp = {};
  for (const s of SERVERS) mcp[s] = { depsInstalled: state.mcpDeps[s] };
  const ok =
    Object.values(state.mcpDeps).every(Boolean) &&
    state.disciplineSkillPresent &&
    state.sessionStartHookRegistered;
  return {
    mcp,
    platform: state.platform,
    disciplineSkillPresent: state.disciplineSkillPresent,
    sessionStartHookRegistered: state.sessionStartHookRegistered,
    companions,
    projectDataDirs: PROJECT_DATA_DIRS.slice(),
    ok,
  };
}
```

Update the exports line to:

```js
module.exports = { SERVERS, NUDGE, detectState, setupNudge, installMcpDeps, detectCompanions, doctorReport, getClaudeConfigDir };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/setup.test.js`
Expected: PASS — full `setup.test.js` green.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/lib/setup.js tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(setup): doctorReport composes state + companions + ok flag

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: Refactor `install-mcp-deps.js` into a CLI shim (DRY, behavior-preserving)

**Files:**
- Modify: `scripts/install-mcp-deps.js` (full replace)
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('scripts/install-mcp-deps.js — CLI shim', () => {
  it('require() exposes installMcpDeps and does NOT run the loop at require time', () => {
    const before = require('module')._cache; // sanity: requiring must not throw or spawn
    const shim = require('../../scripts/install-mcp-deps.js');
    assert.strictEqual(typeof shim.installMcpDeps, 'function');
    assert.strictEqual(shim.installMcpDeps, setup.installMcpDeps);
    assert.ok(before);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — current `install-mcp-deps.js` has no exports (`shim.installMcpDeps` is `undefined`) and runs its loop on require.

- [ ] **Step 3: Write minimal implementation** — replace the ENTIRE contents of `scripts/install-mcp-deps.js` with:

```js
#!/usr/bin/env node
/**
 * Install npm dependencies for each bundled MCP server.
 * Thin CLI shim — logic lives in scripts/lib/setup.js (single source of truth).
 */
const { installMcpDeps } = require('./lib/setup');
const { pluginRoot } = require('./lib/paths');

if (require.main === module) {
  const { perServer } = installMcpDeps({ pluginRoot: pluginRoot() });
  let failed = false;
  for (const [name, r] of Object.entries(perServer)) {
    console.log(`${name}: ${r.status}${r.error ? ' — ' + r.error : ''}`);
    if (r.status === 'failed') failed = true;
  }
  console.log('MCP server dependencies install complete.');
  if (failed) process.exitCode = 1;
}

module.exports = { installMcpDeps };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/setup.test.js`
Expected: PASS.

- [ ] **Step 5: Verify CLI behavior is preserved (no real install)**

Run: `node -e "const m=require('./scripts/install-mcp-deps.js'); console.log(typeof m.installMcpDeps)"`
Expected: prints `function` and exits 0 with NO npm output (loop did not run because `require.main !== module`).

- [ ] **Step 6: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/install-mcp-deps.js tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "refactor(mcp): install-mcp-deps.js -> CLI shim over setup.installMcpDeps

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: `check-setup.js` SessionStart hook + register in `hooks.json`

**Files:**
- Create: `scripts/hooks/check-setup.js`
- Modify: `hooks/hooks.json` (add `SessionStart` block)
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('hooks/hooks.json — SessionStart registration', () => {
  it('registers check-setup.js under SessionStart with plugin-root var', () => {
    const cfg = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../hooks/hooks.json'), 'utf8'));
    assert.ok(Array.isArray(cfg.hooks.SessionStart), 'SessionStart must be an array');
    const flat = JSON.stringify(cfg.hooks.SessionStart);
    assert.ok(flat.includes('check-setup.js'), 'must reference check-setup.js');
    assert.ok(flat.includes('${CLAUDE_PLUGIN_ROOT}'), 'must use plugin-root variable');
    // existing events stay intact
    for (const e of ['Stop', 'PreCompact', 'PostToolUse']) {
      assert.ok(Array.isArray(cfg.hooks[e]), `${e} still present`);
    }
  });

  it('check-setup.js is syntactically valid and requires only lib modules', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../scripts/hooks/check-setup.js'), 'utf8');
    assert.ok(src.includes("require('../lib/setup')"));
    assert.ok(src.includes("require('../lib/paths')"));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — `SessionStart` not in hooks.json; `check-setup.js` does not exist.

- [ ] **Step 3a: Create `scripts/hooks/check-setup.js`**

```js
#!/usr/bin/env node
/**
 * SessionStart: detection-only nudge if MCP server deps are missing.
 * Never installs, no network, never fails the session.
 */
const { pluginRoot, projectDir } = require('../lib/paths');
const { detectState, setupNudge } = require('../lib/setup');

function main() {
  try {
    const state = detectState({ pluginRoot: pluginRoot(), projectDir: projectDir() });
    const nudge = setupNudge(state);
    if (nudge) console.log(nudge);
  } catch (_) {
    /* never disrupt the session */
  }
}

main();
```

- [ ] **Step 3b: Edit `hooks/hooks.json`** — add a `SessionStart` key as the FIRST entry inside `"hooks": {`. The exact resulting file is:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/check-setup.js\"" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/evaluate-session.js\"" },
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/v2-analysis.js\"" },
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/evaluate-ios-session.js\"" },
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/session-checkpoint-prompt.js\"" }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/pre-compact.js\"" },
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/pre-compact-ios.js\"" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/post-tool-use.js\"" }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/track-build.js\"" }
        ]
      },
      {
        "matcher": "Read",
        "hooks": [
          { "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/track-focus.js\"" }
        ]
      }
    ]
  }
}
```

- [ ] **Step 4: Run the tests + JSON lint + the impacted existing test**

Run: `node --test tests/unit/setup.test.js && node scripts/lint-json.js && node --test tests/unit/missing-hooks.test.js`
Expected: PASS — setup tests green; `lint-json` exits 0; `missing-hooks.test.js` green (SessionStart addition is compatible).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add scripts/hooks/check-setup.js hooks/hooks.json tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(hooks): SessionStart check-setup.js detection-only nudge

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: `skills/ecc-operating-discipline/SKILL.md` (consolidate `rules/*.md`, zero copy)

**Files:**
- Create: `skills/ecc-operating-discipline/SKILL.md`
- Test: `tests/unit/setup.test.js`

This consolidates the 5 existing `rules/*.md` files (`agents.md`, `android-style.md`, `ios-style.md`, `mobile-security.md`, `mobile-testing.md`) into one plugin-native skill. No file is copied anywhere; the raw `rules/` dir stays as optional reference.

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('skills/ecc-operating-discipline/SKILL.md', () => {
  it('exists with valid frontmatter (name + description)', () => {
    const p = path.join(__dirname, '../../skills/ecc-operating-discipline/SKILL.md');
    assert.ok(fs.existsSync(p), 'SKILL.md must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.ok(c.startsWith('---'), 'must start with frontmatter');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block must parse');
    assert.match(m[1], /name:\s*ecc-operating-discipline/);
    assert.match(m[1], /description:\s*\S/);
    for (const kw of ['Agent Delegation', 'Android', 'iOS', 'Security', 'Testing']) {
      assert.ok(c.includes(kw), `body must cover ${kw}`);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — SKILL.md does not exist.

- [ ] **Step 3: Create `skills/ecc-operating-discipline/SKILL.md`** with EXACTLY:

```markdown
---
name: ecc-operating-discipline
description: Operating discipline for everything-claude-code-mobile — agent delegation, Android/iOS style, mobile security, and testing/TDD. Apply whenever an ECC agent or command runs.
---

# ECC Operating Discipline

Consolidated, always-applicable discipline for ECC's mobile agents and commands. (Source of truth; the `rules/*.md` files remain as optional human reference.)

## Agent Delegation

Use `/feature-build` to orchestrate the 7-phase pipeline: Plan → Implement → Test → Build Fix → Quality Gate → Verify → Learn.

Delegate by situation:
- **Review:** Android/Kotlin → `android-reviewer`; iOS/Swift → `ios-reviewer`; security → `mobile-security-reviewer`; performance → `mobile-performance-reviewer`.
- **Build & fix:** Gradle/AGP/R8 → `android-build-resolver`; Xcode/SPM/CocoaPods → `xcode-build-resolver`; Gradle tuning → `gradle-expert`.
- **Architecture/planning:** `mobile-architect`, `kmp-architect`, `feature-planner`, `shared-model-designer`.
- **UI:** `compose-guide`, `swiftui-guide`, `m3-expressive-guide`, `liquid-glass-guide`.
- **Implementation layers (dependency order: architecture → network + UI → data → wiring):** `architecture-impl`, `network-impl`, `data-impl`, `ui-impl`, `wiring-impl`.
- **Testing:** `mobile-tdd-guide` (mandatory TDD), `mobile-e2e-runner`, `unit-test-writer`, `ui-test-writer`, `mobile-verifier`.
- **Learning/quality:** `mobile-pattern-extractor`, `mobile-compactor`.

Guidelines: delegate complex specialized tasks with context and constraints; always review agent output.

## Android Kotlin Style

- Immutability: prefer `val`; immutable collections; data classes with `copy()`.
- Null safety: `?.`, `?:`; minimize `!!`.
- Organization: files < 400 lines, functions < 50 lines, nesting < 4.
- Compose: state hoisting (stateless composables); `Modifier` as first optional param; `@Preview` with themes/devices; no side effects in composition.

## iOS Swift Style

- Naming: camelCase vars, PascalCase types; explicit access control.
- Value semantics: `let` over `var`; structs over classes.
- Optionals: `guard let` / `if let` / `??` / `?.`; minimize force-unwrap `!`.
- SwiftUI: state hoisting; `@StateObject` ownership, `@ObservedObject` observation, `@EnvironmentObject` app-wide; previews for all views; no side effects in `body`.
- Concurrency: `async/await` over completion handlers; `MainActor` for UI; `Task` for cancellable work; no `DispatchQueue.main.async`.
- Organization: files < 400 lines, functions < 50 lines, nesting < 4.

## Mobile Security

- Secrets: no hardcoded API keys/passwords; use `BuildConfig` / `local.properties`.
- Storage: `EncryptedSharedPreferences` for tokens; Android Keystore for keys; no sensitive data in plain SharedPrefs.
- Network: HTTPS only; certificate pinning in production; no cleartext traffic.
- Logging: no sensitive data in logs; Timber with a release tree.

## Mobile Testing

- Coverage: 80% minimum.
- TDD (mandatory): write failing test (RED) → run, must fail → minimal implementation (GREEN) → refactor → verify 80%+ coverage.
- Test types: unit (ViewModels, UseCases), integration (repositories, flows), UI (Compose with Espresso).
- Agents: `mobile-tdd-guide` (enforcement), `mobile-e2e-runner` (E2E).
```

- [ ] **Step 4: Run the test + the skill-dir structural test to verify they pass**

Run: `node --test tests/unit/setup.test.js && node --test tests/unit/feature-builder.test.js`
Expected: PASS — new SKILL.md test green; `feature-builder.test.js` skill-dir iteration (355-376) still green (valid frontmatter); 27-agent assertion unaffected.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add skills/ecc-operating-discipline/SKILL.md tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(skill): ecc-operating-discipline (consolidated rules, zero copy)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: `commands/ecc-setup.md` + `commands/ecc-doctor.md`

**Files:**
- Create: `commands/ecc-setup.md`
- Create: `commands/ecc-doctor.md`
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('commands/ecc-setup.md + ecc-doctor.md', () => {
  for (const name of ['ecc-setup', 'ecc-doctor']) {
    it(`${name}.md exists with valid frontmatter and references setup lib`, () => {
      const p = path.join(__dirname, `../../commands/${name}.md`);
      assert.ok(fs.existsSync(p), `${name}.md must exist`);
      const c = fs.readFileSync(p, 'utf8');
      assert.ok(c.startsWith('---'), 'must start with frontmatter');
      assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/);
      assert.ok(c.includes('scripts/lib/setup'), 'must drive the tested setup lib');
    });
  }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — command files do not exist.

- [ ] **Step 3a: Create `commands/ecc-setup.md`** with EXACTLY:

```markdown
---
description: One-command setup for everything-claude-code-mobile — installs the bundled MCP server dependencies and verifies plugin health. Idempotent; safe to re-run.
---

# ECC Setup Command

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

One command to make the plugin fully operational after `/plugin install`. Replaces the manual `cd … && npm run mcp:install` dance.

## What It Does

1. Resolves the plugin root from `$CLAUDE_PLUGIN_ROOT` (no glob `cd` needed).
2. Previews current state.
3. Installs the 3 bundled MCP server dependencies.
4. Re-checks and prints a green/red summary; on failure shows the exact retry command per server.

Idempotent: if deps are already present it reports "already set up" and does nothing.

## Steps (run these)

1. Preview + verify-after via the doctor report:

   ```bash
   node -e "const{doctorReport}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/setup');const{pluginRoot,projectDir}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/paths');console.log(JSON.stringify(doctorReport({pluginRoot:pluginRoot(),projectDir:projectDir()}),null,2))"
   ```

2. If any `mcp.<server>.depsInstalled` is `false`, install:

   ```bash
   node "$CLAUDE_PLUGIN_ROOT/scripts/install-mcp-deps.js"
   ```

3. Re-run the command in step 1 to verify. Present the result as a green/red checklist (MCP deps per server, platform, discipline skill, SessionStart hook). For any server still failing, tell the user to re-run step 2 or, for one server, `cd "$CLAUDE_PLUGIN_ROOT/mcp-servers/<server>" && npm ci --omit=dev`.

## Invokes

- `scripts/lib/setup.js` (`doctorReport`, `installMcpDeps` via the `install-mcp-deps.js` CLI)
```

- [ ] **Step 3b: Create `commands/ecc-doctor.md`** with EXACTLY:

```markdown
---
description: Health check for everything-claude-code-mobile — MCP server deps, platform, discipline skill, SessionStart hook, and detected companion plugins (Figma/Atlassian/GitHub). Read-only.
---

# ECC Doctor Command

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

A read-only green/red status report. Mutates nothing.

## Steps (run these)

1. Produce the structured report:

   ```bash
   node -e "const{doctorReport}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/setup');const{pluginRoot,projectDir}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/paths');console.log(JSON.stringify(doctorReport({pluginRoot:pluginRoot(),projectDir:projectDir()}),null,2))"
   ```

2. Render it as a checklist:
   - **MCP servers** — for each of `mobile-memory`, `ios-memory`, `kmp-context`: ✓ if `depsInstalled`, else ✗ with fix `Run /ecc-setup`.
   - **Platform** — detected `platform`.
   - **Discipline skill** — ✓/✗ `disciplineSkillPresent`.
   - **SessionStart hook** — ✓/✗ `sessionStartHookRegistered`.
   - **Companion integrations** — Figma / Atlassian (Jira) / GitHub from `companions`; for each `absent`, show `/plugin install` is available (these are independent official plugins; ECC runs alongside, does not bundle them).
   - **Note** — list `projectDataDirs`: `/plugin uninstall` will not remove these; they are user data, delete manually only if desired.

## Invokes

- `scripts/lib/setup.js` (`doctorReport`)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/unit/setup.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/ecc-setup.md commands/ecc-doctor.md tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(commands): /ecc-setup and /ecc-doctor

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: Operating-discipline reference line in every agent + command + lint test

The exact reference line (a Markdown blockquote, inserted as the first body line right after the frontmatter `---`, followed by a blank line):

```
> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).
```

`ecc-setup.md` / `ecc-doctor.md` already contain this line (Task 8); the insert script below is idempotent and skips any file already containing `ecc-operating-discipline`.

**Files:**
- Modify: every `agents/*.md` (27) and `commands/*.md` (37 incl. the 2 new)
- Test: `tests/unit/setup.test.js`

- [ ] **Step 1: Write the failing test** (append to `tests/unit/setup.test.js`)

```js
describe('operating-discipline reference convention', () => {
  const dirs = ['agents', 'commands'];
  it('every agents/*.md and commands/*.md references ecc-operating-discipline', () => {
    const offenders = [];
    for (const d of dirs) {
      const base = path.join(__dirname, '../../', d);
      for (const f of fs.readdirSync(base).filter((x) => x.endsWith('.md'))) {
        const c = fs.readFileSync(path.join(base, f), 'utf8');
        if (!c.includes('ecc-operating-discipline')) offenders.push(`${d}/${f}`);
      }
    }
    assert.deepStrictEqual(offenders, [], `missing reference: ${offenders.join(', ')}`);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/unit/setup.test.js`
Expected: FAIL — most `agents/*.md` and `commands/*.md` lack the reference (offenders list non-empty).

- [ ] **Step 3: Run the idempotent insertion script**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
cat > /tmp/add-discipline-ref.js <<'EOF'
const fs = require('fs');
const path = require('path');
const LINE = '> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).';
let changed = 0;
for (const d of ['agents', 'commands']) {
  const base = path.join(process.cwd(), d);
  for (const f of fs.readdirSync(base).filter((x) => x.endsWith('.md'))) {
    const p = path.join(base, f);
    let c = fs.readFileSync(p, 'utf8');
    if (c.includes('ecc-operating-discipline')) continue;
    const m = c.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
    if (!m) { console.log('NO FRONTMATTER (skipped): ' + d + '/' + f); continue; }
    c = m[1] + '\n' + LINE + '\n' + m[2].replace(/^\n+/, '\n');
    fs.writeFileSync(p, c);
    changed++;
  }
}
console.log('inserted into ' + changed + ' files');
EOF
node /tmp/add-discipline-ref.js
rm /tmp/add-discipline-ref.js
```

Expected: `inserted into N files` (N ≈ 60; the 2 ecc commands are skipped as already-containing). No `NO FRONTMATTER` lines.

- [ ] **Step 4: Run the test + full suite to verify it passes and nothing broke**

Run: `npm test`
Expected: PASS — the new convention test green; `feature-builder.test.js` 27-agent + skill-dir tests still green; full baseline (was 402) + new `setup.test.js` tests all green. (`pretest` `lint:scripts` also runs and must pass — new JS files are valid.)

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add agents/ commands/ tests/unit/setup.test.js
git -c commit.gpgsign=false commit -m "feat(discipline): reference ecc-operating-discipline in all agents+commands

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Documentation (README EN/TR + docs/* EN/TR)

No test gates here (verified: no doc-count assertions). Edits are additive; keep existing content intact.

**Files:**
- Modify: `README.md`, `README.tr.md`
- Modify: `docs/COMMANDS.md`, `docs/tr/COMMANDS.md`
- Modify: `docs/SKILLS.md`, `docs/tr/SKILLS.md`
- Modify: `docs/HOOKS-AND-MCP.md`, `docs/tr/HOOKS-AND-MCP.md`

- [ ] **Step 1: README install section (both files)**

In `README.md`, find the install step that currently instructs `cd ~/.claude/plugins/cache/*/everything-claude-code-mobile/*/` + `npm run mcp:install`. Replace those two manual steps with a single step:

```
3. Run setup (installs MCP server deps + verifies):

   /ecc-setup

   Check health anytime with /ecc-doctor.
```

Add an **Uninstall** subsection right after install:

```
### Uninstall

/plugin uninstall everything-claude-code-mobile@sahsenvar

Clean — nothing is copied into your global config. Project data dirs
(.claude/mobile-memory, .claude/ios-memory, .claude/kmp-context,
.claude/checkpoints) are your data; delete them manually only if you want.
```

Add a **Recommended companion plugins** subsection:

```
### Recommended companion plugins

ECC works alongside (does not bundle) the official plugins — install whichever you use:
Figma, Atlassian (Jira/Confluence), GitHub. Run /ecc-doctor to see which are detected.
```

Apply the Turkish equivalents to `README.tr.md` in the matching locations:
- Step 3: `3. Kurulumu çalıştır (MCP bağımlılıkları + doğrulama): /ecc-setup — sağlığı istediğin zaman /ecc-doctor ile kontrol et.`
- `### Kaldırma`: `/plugin uninstall everything-claude-code-mobile@sahsenvar` + "Temiz — global config'e hiçbir şey kopyalanmaz. Proje veri dizinleri (.claude/mobile-memory, .claude/ios-memory, .claude/kmp-context, .claude/checkpoints) senin verin; istersen elle sil."
- `### Önerilen tamamlayıcı eklentiler`: "ECC, official eklentilerle birlikte çalışır (içermez): Figma, Atlassian (Jira/Confluence), GitHub. Hangileri tespit edildi görmek için /ecc-doctor çalıştır."

- [ ] **Step 2: `docs/COMMANDS.md` + `docs/tr/COMMANDS.md`**

Add a new section (place near the top, after the intro, before platform-specific commands):

EN (`docs/COMMANDS.md`):
```
## Setup & health

| Command | What it does | Example |
|---|---|---|
| `/ecc-setup` | One-command setup: installs the 3 bundled MCP server deps, verifies health. Idempotent. | `/ecc-setup` |
| `/ecc-doctor` | Read-only health report: MCP deps, platform, discipline skill, SessionStart hook, detected companion plugins. | `/ecc-doctor` |
```

TR (`docs/tr/COMMANDS.md`) — same table, header `## Kurulum & sağlık`, "Ne yapar" / "Örnek" columns, descriptions translated.

- [ ] **Step 3: `docs/SKILLS.md` + `docs/tr/SKILLS.md`**

Add a row/entry for the new skill in the appropriate list:

EN: `ecc-operating-discipline` — Operating discipline ECC agents/commands follow: agent delegation, Android/iOS style, mobile security, testing/TDD. Consolidated from `rules/`, shipped in-plugin (zero copy).
TR: same, translated.

- [ ] **Step 4: `docs/HOOKS-AND-MCP.md` + `docs/tr/HOOKS-AND-MCP.md`**

In the hooks section, add the new event/handler:

EN: under a `SessionStart` heading — `check-setup.js` — detection-only: on session start, if any bundled MCP server's deps are missing, prints a one-line nudge to run `/ecc-setup`. Never installs, no network, never fails the session.
TR: same, translated, heading `SessionStart`.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add README.md README.tr.md docs/
git -c commit.gpgsign=false commit -m "docs: setup 4->2 steps, uninstall, companions, /ecc-* + SessionStart (EN+TR)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 11: Final full verification (no push)

**Files:** none (verification only).

- [ ] **Step 1: Full test suite**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && npm test`
Expected: PASS — all suites green (prior baseline 402 + the new `setup.test.js` cases). `pretest` `lint:scripts` passes.

- [ ] **Step 2: JSON + verify**

Run: `node scripts/lint-json.js && npm run verify`
Expected: `lint-json` exits 0; `verify` completes (it never fails by design) with no errors.

- [ ] **Step 3: Confirm clean tree on the feature branch, do NOT push**

Run: `git status --porcelain && git branch --show-current && git --no-pager log --oneline -n 10`
Expected: empty status (all committed); branch `feature/ecc-setup-health`; ~10 feature commits present. **Do not run `git push`** — pushing requires explicit user consent.

- [ ] **Step 4: Report**

Summarize to the user (Turkish): commits made, suite green count, that install is now `/plugin install` → `/ecc-setup`, uninstall is `/plugin uninstall` (zero residue), and that nothing was pushed.

---

## Self-Review

**1. Spec coverage:**
- Frictionless `/ecc-setup` → Tasks 2,5,8. `/ecc-doctor` → Tasks 4,8. SessionStart detection-only nudge → Tasks 1,6. Rules-as-skill, zero copy → Task 7. Reference convention + lint → Task 9. Companion detect+report → Tasks 3,4,8,10. `install-mcp-deps.js` DRY refactor → Task 5. Docs (install 4→2, uninstall, companions, EN+TR) → Task 10. Tests stay green / invariants respected → Tasks 9,11 + per-task gates. Bridge orchestration explicitly out of scope (spec §3,§10) → no task. **No gaps.**

**2. Placeholder scan:** No "TBD/TODO/handle edge cases/similar to". Every code/JSON/markdown artifact is given in full; every command has expected output. Doc edits specify exact anchor text + exact inserted content. Clean.

**3. Type consistency:** `installMcpDeps` returns `{ perServer: { name: { status, error? } } }` — used identically in Tasks 2, 5. `detectState` shape (`mcpDeps`, `platform`, `sessionStartHookRegistered`, `disciplineSkillPresent`) consistent across Tasks 1, 4, 6. `detectCompanions` → `{figma,atlassian,github}` of `present|absent|unknown` consistent in Tasks 3, 4. `doctorReport` shape consistent across Task 4 + commands (Task 8) + docs (Task 10). `setupNudge(state)` signature consistent Tasks 1, 6. Exports line grows monotonically (Tasks 1→2→3→4) with the final superset. Consistent.

No issues found.

