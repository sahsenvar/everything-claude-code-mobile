# ECC-Mobile Plugin Portability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the forked `everything-claude-code-mobile` plugin actually load and run its hooks + MCP servers when installed as a Claude Code plugin from `sahsenvar`'s GitHub.

**Architecture:** The repo currently registers only skills/agents/commands; hooks use a legacy non-plugin JSON schema with hardcoded `/Users/ah3sh/...` paths, four referenced hook scripts are missing, and the three MCP servers are never wired. This plan replaces hooks with a single event-keyed `hooks/hooks.json` that routes PostToolUse through one stdin-aware dispatcher, adds the four missing scripts, wires the three MCP servers via a root `.mcp.json` using `${CLAUDE_PLUGIN_ROOT}`, hardens path resolution, then installs and smoke-tests from the fork.

**Tech Stack:** Node.js ≥18 (CommonJS), `node:test`, Claude Code plugin schema (`hooks/hooks.json`, `.mcp.json`, `${CLAUDE_PLUGIN_ROOT}`/`${CLAUDE_PROJECT_DIR}`), `@modelcontextprotocol/sdk`.

**Scope:** This is Plan 1 of 2. Plan 2 (deep content-quality review of stack-relevant skills/agents/commands) is a separate spec→plan cycle, started only after this plan produces a verified working plugin.

**Working branch:** `fix/portability-and-quality` (already created off canonical `main` v1.1.5). Remotes: `origin` = `sahsenvar/everything-claude-code-mobile`, `upstream` = `ahmed3elshaer/everything-claude-code-mobile`.

---

## File Structure

**Create:**
- `scripts/lib/paths.js` — resolves plugin root and user project dir from env with fallbacks. One responsibility: path resolution.
- `scripts/lib/hook-input.js` — reads + parses the hook JSON event from stdin; extracts target file and project dir. One responsibility: hook stdin parsing.
- `scripts/hooks/post-tool-use.js` — single PostToolUse dispatcher: reads stdin, routes to capture/extract/track scripts, prints reminders.
- `scripts/hooks/evaluate-ios-session.js` — Stop-event Swift pattern extractor (iOS analogue of `evaluate-session.js`).
- `scripts/hooks/pre-compact-ios.js` — PreCompact iOS checkpoint (iOS analogue of `pre-compact.js`).
- `scripts/hooks/track-build.js` — PostToolUse Gradle build/test outcome tracker.
- `scripts/hooks/track-focus.js` — PostToolUse repeated-read focus tracker.
- `.mcp.json` (repo root) — wires the 3 MCP servers with `${CLAUDE_PLUGIN_ROOT}`.
- `scripts/install-mcp-deps.js` — installs `npm` deps for each bundled MCP server.
- `FORK-NOTES.md` — divergence + upstream-merge procedure.
- `tests/unit/paths.test.js`, `tests/unit/hook-input.test.js`, `tests/unit/missing-hooks.test.js` — tests for the new code.

**Modify:**
- `scripts/lib/utils.js` — `getProjectRoot()` honors `CLAUDE_PROJECT_DIR`.
- `hooks/hooks.json` — replaced with consolidated event-keyed plugin schema.
- `mcp-configs/mobile-memory.json`, `mcp-configs/ios.json`, `mcp-configs/kmp-memory.json` — fix hardcoded paths; fix kmp server name/path/env mismatch.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` — author/repo → `sahsenvar`, version bump.
- `package.json` — add `mcp:install` script.
- `docs/installation.md` — fork install instructions.

**Delete (after consolidation into `hooks/hooks.json`):**
- `hooks/hooks-ios.json`, `hooks/checkpoint-hooks.json`, `hooks/extended/instinct-hooks.json` — superseded; their behavior folded into the new `hooks/hooks.json` + `post-tool-use.js`.

---

## Task 1: Path resolution library

**Files:**
- Create: `scripts/lib/paths.js`
- Test: `tests/unit/paths.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/paths.test.js`:

```javascript
const path = require('path');
const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');

const paths = require('../../scripts/lib/paths');

describe('scripts/lib/paths.js', () => {
  const origPlugin = process.env.CLAUDE_PLUGIN_ROOT;
  const origProject = process.env.CLAUDE_PROJECT_DIR;

  afterEach(() => {
    if (origPlugin === undefined) delete process.env.CLAUDE_PLUGIN_ROOT;
    else process.env.CLAUDE_PLUGIN_ROOT = origPlugin;
    if (origProject === undefined) delete process.env.CLAUDE_PROJECT_DIR;
    else process.env.CLAUDE_PROJECT_DIR = origProject;
  });

  it('pluginRoot() uses CLAUDE_PLUGIN_ROOT when set', () => {
    process.env.CLAUDE_PLUGIN_ROOT = '/tmp/some-plugin';
    assert.strictEqual(paths.pluginRoot(), '/tmp/some-plugin');
  });

  it('pluginRoot() falls back to the repo root (two levels above scripts/lib)', () => {
    delete process.env.CLAUDE_PLUGIN_ROOT;
    const expected = path.resolve(__dirname, '../../');
    assert.strictEqual(paths.pluginRoot(), expected);
  });

  it('projectDir() uses CLAUDE_PROJECT_DIR when set', () => {
    process.env.CLAUDE_PROJECT_DIR = '/tmp/user-project';
    assert.strictEqual(paths.projectDir(), '/tmp/user-project');
  });

  it('projectDir() falls back to process.cwd()', () => {
    delete process.env.CLAUDE_PROJECT_DIR;
    assert.strictEqual(paths.projectDir(), process.cwd());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/paths.test.js`
Expected: FAIL — `Cannot find module '../../scripts/lib/paths'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/lib/paths.js`:

```javascript
/**
 * Path resolution for plugin-bundled scripts.
 *
 * pluginRoot() — absolute path to the installed plugin directory.
 *   Prefers ${CLAUDE_PLUGIN_ROOT} (set by Claude Code when running plugin
 *   hooks/MCP); falls back to the repo root relative to this file.
 *
 * projectDir() — absolute path to the user's project.
 *   Prefers ${CLAUDE_PROJECT_DIR} (set by Claude Code); falls back to cwd.
 */

const path = require('path');

function pluginRoot() {
    if (process.env.CLAUDE_PLUGIN_ROOT) {
        return process.env.CLAUDE_PLUGIN_ROOT;
    }
    // this file lives at <root>/scripts/lib/paths.js
    return path.resolve(__dirname, '../../');
}

function projectDir() {
    if (process.env.CLAUDE_PROJECT_DIR) {
        return process.env.CLAUDE_PROJECT_DIR;
    }
    return process.cwd();
}

module.exports = { pluginRoot, projectDir };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/paths.test.js`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/lib/paths.js`
Expected: no output, exit 0.

```bash
git add scripts/lib/paths.js tests/unit/paths.test.js
git commit -m "feat: add plugin/project path resolution library"
```

## Task 2: Harden getProjectRoot() to honor CLAUDE_PROJECT_DIR

**Files:**
- Modify: `scripts/lib/utils.js:27-37`
- Test: `tests/unit/scripts.test.js` (existing `getProjectRoot` describe block — add a case)

- [ ] **Step 1: Write the failing test**

In `tests/unit/scripts.test.js`, inside the existing `describe('getProjectRoot', ...)` block (currently around line 63), add this test after the existing `it('returns a string that is an absolute path', ...)`:

```javascript
    it('returns CLAUDE_PROJECT_DIR when set', () => {
      const orig = process.env.CLAUDE_PROJECT_DIR;
      process.env.CLAUDE_PROJECT_DIR = '/tmp/forced-project-root';
      try {
        assert.strictEqual(utils.getProjectRoot(), '/tmp/forced-project-root');
      } finally {
        if (orig === undefined) delete process.env.CLAUDE_PROJECT_DIR;
        else process.env.CLAUDE_PROJECT_DIR = orig;
      }
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="returns CLAUDE_PROJECT_DIR when set" tests/unit/scripts.test.js`
Expected: FAIL — returns cwd-derived path, not `/tmp/forced-project-root`.

- [ ] **Step 3: Write minimal implementation**

Replace `scripts/lib/utils.js` lines 24-37 (the `getProjectRoot` function) with:

```javascript
/**
 * Get the project root directory.
 * Honors CLAUDE_PROJECT_DIR (set by Claude Code plugin runtime) first,
 * then walks up from cwd looking for CLAUDE.md or .claude.
 */
function getProjectRoot() {
    if (process.env.CLAUDE_PROJECT_DIR) {
        return process.env.CLAUDE_PROJECT_DIR;
    }
    let dir = process.cwd();
    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, 'CLAUDE.md')) ||
            fs.existsSync(path.join(dir, '.claude'))) {
            return dir;
        }
        dir = path.dirname(dir);
    }
    return process.cwd();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="returns CLAUDE_PROJECT_DIR when set" tests/unit/scripts.test.js`
Expected: PASS. Then run the full file: `node --test tests/unit/scripts.test.js` — all pass (no regressions).

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/lib/utils.js`
Expected: exit 0.

```bash
git add scripts/lib/utils.js tests/unit/scripts.test.js
git commit -m "fix: getProjectRoot honors CLAUDE_PROJECT_DIR"
```

## Task 3: Hook stdin-input library

**Files:**
- Create: `scripts/lib/hook-input.js`
- Test: `tests/unit/hook-input.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/hook-input.test.js`:

```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert');

const { parseHookInput, resolveTargetFile } = require('../../scripts/lib/hook-input');

describe('scripts/lib/hook-input.js', () => {
  it('parseHookInput returns {} for empty string', () => {
    assert.deepStrictEqual(parseHookInput(''), {});
  });

  it('parseHookInput returns {} for invalid JSON', () => {
    assert.deepStrictEqual(parseHookInput('not json'), {});
  });

  it('parseHookInput parses a valid hook event', () => {
    const raw = JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '/p/A.kt' } });
    assert.deepStrictEqual(parseHookInput(raw), { tool_name: 'Edit', tool_input: { file_path: '/p/A.kt' } });
  });

  it('resolveTargetFile reads tool_input.file_path', () => {
    assert.strictEqual(resolveTargetFile({ tool_input: { file_path: '/p/A.kt' } }), '/p/A.kt');
  });

  it('resolveTargetFile returns null when absent', () => {
    assert.strictEqual(resolveTargetFile({}), null);
    assert.strictEqual(resolveTargetFile({ tool_input: {} }), null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/hook-input.test.js`
Expected: FAIL — `Cannot find module '../../scripts/lib/hook-input'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/lib/hook-input.js`:

```javascript
/**
 * Hook stdin parsing.
 *
 * Claude Code passes the hook event as a JSON object on stdin. These helpers
 * read and parse it defensively (a hook must never crash the session).
 */

const fs = require('fs');

/** Parse a raw hook-event JSON string. Returns {} on empty/invalid input. */
function parseHookInput(raw) {
    if (!raw || !raw.trim()) return {};
    try {
        return JSON.parse(raw);
    } catch (_) {
        return {};
    }
}

/** Synchronously read the hook event from stdin (fd 0). Returns {} if none. */
function readHookInput() {
    try {
        const raw = fs.readFileSync(0, 'utf8');
        return parseHookInput(raw);
    } catch (_) {
        return {};
    }
}

/** Extract the target file path from a parsed hook event, or null. */
function resolveTargetFile(input) {
    if (input && input.tool_input && input.tool_input.file_path) {
        return input.tool_input.file_path;
    }
    return null;
}

module.exports = { parseHookInput, readHookInput, resolveTargetFile };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/hook-input.test.js`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/lib/hook-input.js`
Expected: exit 0.

```bash
git add scripts/lib/hook-input.js tests/unit/hook-input.test.js
git commit -m "feat: add hook stdin-input parsing library"
```

## Task 4: PostToolUse dispatcher

**Files:**
- Create: `scripts/hooks/post-tool-use.js`
- Test: `tests/unit/missing-hooks.test.js` (created here; extended by later tasks)

The dispatcher reads the hook event from stdin, and based on tool + file path:
spawns the matching capture/extract/track script (with the resolved file path as
argv) and prints any reminder messages to stdout. It always exits 0 — a hook
must never block the session.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/missing-hooks.test.js`:

```javascript
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it } = require('node:test');
const assert = require('node:assert');

const HOOKS = path.join(__dirname, '../../scripts/hooks');

function runHook(script, stdin) {
  return execFileSync('node', [path.join(HOOKS, script)], {
    input: stdin, encoding: 'utf8', timeout: 15000
  });
}

describe('post-tool-use.js dispatcher', () => {
  it('exits 0 and prints a ViewModel reminder for a ViewModel.kt write', () => {
    const event = JSON.stringify({
      tool_name: 'Write',
      tool_input: { file_path: '/tmp/does-not-exist/HomeViewModel.kt' }
    });
    const out = runHook('post-tool-use.js', event);
    assert.match(out, /test file/i);
  });

  it('exits 0 on empty stdin (no tool data)', () => {
    const out = runHook('post-tool-use.js', '');
    assert.strictEqual(typeof out, 'string');
  });

  it('exits 0 for an unrelated tool', () => {
    const event = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } });
    assert.doesNotThrow(() => runHook('post-tool-use.js', event));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/unit/missing-hooks.test.js`
Expected: FAIL — `post-tool-use.js` does not exist (execFileSync throws ENOENT).

- [ ] **Step 3: Write minimal implementation**

Create `scripts/hooks/post-tool-use.js`:

```javascript
#!/usr/bin/env node
/**
 * Single PostToolUse dispatcher.
 *
 * Replaces the legacy per-pattern PostToolUse hooks. Reads the hook event
 * from stdin, then for Write/Edit on Kotlin/Gradle files: spawns the matching
 * capture/extract/track script with the resolved file path, and prints
 * reminder messages. Always exits 0 — hooks must not block the session.
 */

const path = require('path');
const { spawnSync } = require('child_process');
const { readHookInput, resolveTargetFile } = require('../lib/hook-input');
const { projectDir } = require('../lib/paths');

const HOOKS_DIR = __dirname;

function run(script, file) {
    try {
        spawnSync('node', [path.join(HOOKS_DIR, script), file], {
            cwd: projectDir(),
            stdio: 'inherit',
            timeout: 30000
        });
    } catch (_) {
        // Never fail the session because of a learning hook.
    }
}

function main() {
    const input = readHookInput();
    const tool = input.tool_name || '';
    const file = resolveTargetFile(input);

    if ((tool !== 'Write' && tool !== 'Edit') || !file) {
        process.exit(0);
    }

    const base = path.basename(file);

    if (base.endsWith('ViewModel.kt')) {
        run('capture-viewmodel.js', file);
        console.log('📝 Reminder: add a matching ViewModel test (TDD).');
    } else if (base.endsWith('Screen.kt')) {
        run('capture-compose.js', file);
        console.log('🧠 Compose screen pattern captured.');
    } else if (base.endsWith('Module.kt')) {
        run('capture-koin.js', file);
    } else if (base.endsWith('.kt')) {
        run('extract-pattern.js', file);
    }

    if (base === 'build.gradle.kts') {
        run('track-dependency.js', file);
    }

    if (base.endsWith('ViewModel.swift')) {
        console.log('📝 Reminder: add an XCTest for this ViewModel; consider a SwiftUI preview.');
    } else if (base === 'Podfile') {
        console.log('📦 Podfile changed: remember to run `pod install`.');
    } else if (base === 'Package.swift') {
        console.log('📦 Package.swift changed: resolve packages in Xcode.');
    }

    process.exit(0);
}

main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/unit/missing-hooks.test.js`
Expected: PASS — 3 tests pass. (Spawned capture scripts may print errors for the
non-existent file; that is fine — the dispatcher swallows failures and exits 0.)

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/hooks/post-tool-use.js`
Expected: exit 0.

```bash
git add scripts/hooks/post-tool-use.js tests/unit/missing-hooks.test.js
git commit -m "feat: add single stdin-aware PostToolUse dispatcher"
```

## Task 5: Missing script — evaluate-ios-session.js

**Files:**
- Create: `scripts/hooks/evaluate-ios-session.js`
- Test: `tests/unit/missing-hooks.test.js` (append a describe block)

iOS analogue of `evaluate-session.js`: on Stop, scans recent `*.swift` git
changes for SwiftUI/Combine/MVVM patterns and reinforces instincts. Must
no-op gracefully outside an iOS project.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/missing-hooks.test.js`:

```javascript
describe('evaluate-ios-session.js', () => {
  it('runs and exits 0 in a non-iOS dir', () => {
    const out = execFileSync('node', [path.join(HOOKS, 'evaluate-ios-session.js')], {
      cwd: require('os').tmpdir(), encoding: 'utf8', timeout: 15000
    });
    assert.match(out, /iOS|skip|Swift/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="evaluate-ios-session" tests/unit/missing-hooks.test.js`
Expected: FAIL — script missing (ENOENT).

- [ ] **Step 3: Write minimal implementation**

Create `scripts/hooks/evaluate-ios-session.js`:

```javascript
#!/usr/bin/env node
/**
 * Session evaluation hook (iOS) - extracts Swift patterns from completed
 * sessions. Runs on Stop. iOS analogue of evaluate-session.js.
 */

const fs = require('fs');
const path = require('path');
const { log, getProjectRoot, runCommand } = require('../lib/utils');
const { addInstinct, loadInstincts } = require('../lib/instincts');

const SWIFT_PATTERNS = [
    { id: 'swiftui-state-object', pattern: /@StateObject\s+(?:private\s+)?var\s+\w+/, context: 'swiftui-patterns', description: 'SwiftUI @StateObject ownership' },
    { id: 'swiftui-observed-object', pattern: /@ObservedObject\s+(?:private\s+)?var\s+\w+/, context: 'swiftui-patterns', description: 'SwiftUI @ObservedObject injection' },
    { id: 'mvvm-observable-object', pattern: /class\s+\w+(?:ViewModel)?\s*:\s*ObservableObject/, context: 'swift-patterns', description: 'MVVM ObservableObject view model' },
    { id: 'combine-sink', pattern: /\.sink\s*\(/, context: 'combine-framework', description: 'Combine subscription via sink' },
    { id: 'combine-publisher', pattern: /AnyPublisher\s*<[^>]+>/, context: 'combine-framework', description: 'Combine AnyPublisher type erasure' },
    { id: 'swift-async-task', pattern: /Task\s*\{[\s\S]*?await\s+/, context: 'swift-patterns', description: 'Structured concurrency with Task/await' },
    { id: 'swift-mainactor', pattern: /@MainActor/, context: 'swift-patterns', description: '@MainActor isolation' },
    { id: 'core-data-fetchrequest', pattern: /@FetchRequest\s*\(/, context: 'core-data', description: 'Core Data @FetchRequest in SwiftUI' }
];

function isIosProject(dir) {
    try {
        if (fs.existsSync(path.join(dir, 'Package.swift'))) return true;
        if (fs.existsSync(path.join(dir, 'Podfile'))) return true;
        return fs.readdirSync(dir).some(f => f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'));
    } catch (_) {
        return false;
    }
}

function main() {
    const projectRoot = getProjectRoot();

    if (!isIosProject(projectRoot)) {
        log('Not an iOS project, skipping Swift pattern extraction', 'info');
        return;
    }

    log('Evaluating session for Swift patterns...', 'info');

    const diff = runCommand('git diff HEAD~5 --name-only -- "*.swift"', { cwd: projectRoot });
    if (!diff.success || !diff.output) {
        log('No recent Swift changes to analyze', 'info');
        return;
    }

    const changedFiles = diff.output.split('\n').filter(f => f.endsWith('.swift'));
    log(`Analyzing ${changedFiles.length} changed Swift files`, 'info');

    const detected = new Set();
    for (const file of changedFiles) {
        const filePath = path.join(projectRoot, file);
        try {
            if (!fs.existsSync(filePath)) continue;
            const content = fs.readFileSync(filePath, 'utf-8');
            for (const def of SWIFT_PATTERNS) {
                if (def.pattern.test(content)) {
                    detected.add(def.id);
                    addInstinct({
                        id: def.id, type: 'pattern', description: def.description,
                        context: def.context, confidence: 0.4
                    });
                    log(`Detected: ${def.description}`, 'success');
                }
            }
        } catch (_) { /* skip unreadable files */ }
    }

    if (detected.size > 0) {
        log(`Session evaluation complete: ${detected.size} Swift patterns reinforced`, 'success');
    } else {
        log('No new Swift patterns detected in this session', 'info');
    }

    const instincts = loadInstincts();
    const high = instincts.instincts.filter(i => i.confidence >= 0.7);
    log(`Total instincts: ${instincts.instincts.length} (${high.length} high confidence)`, 'info');
}

main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="evaluate-ios-session" tests/unit/missing-hooks.test.js`
Expected: PASS — prints "Not an iOS project, skipping Swift pattern extraction".

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/hooks/evaluate-ios-session.js`
Expected: exit 0.

```bash
git add scripts/hooks/evaluate-ios-session.js tests/unit/missing-hooks.test.js
git commit -m "feat: add evaluate-ios-session Stop hook (Swift patterns)"
```

## Task 6: Missing script — pre-compact-ios.js

**Files:**
- Create: `scripts/hooks/pre-compact-ios.js`
- Test: `tests/unit/missing-hooks.test.js` (append)

iOS analogue of `pre-compact.js`: on PreCompact, writes an iOS-focused
checkpoint (git branch + recent `*.swift` files + instincts snapshot) to
`<project>/.claude/checkpoints/ios-checkpoint-<ts>.json`, keeps last 10.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/missing-hooks.test.js`:

```javascript
describe('pre-compact-ios.js', () => {
  it('runs and exits 0, writing an ios checkpoint', () => {
    const os = require('os'); const fs = require('fs');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ios-precompact-'));
    execFileSync('node', [path.join(HOOKS, 'pre-compact-ios.js')], {
      cwd: tmp, env: { ...process.env, CLAUDE_PROJECT_DIR: tmp },
      encoding: 'utf8', timeout: 15000
    });
    const dir = path.join(tmp, '.claude/checkpoints');
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    assert.ok(files.some(f => f.startsWith('ios-checkpoint-')), 'ios checkpoint written');
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="pre-compact-ios" tests/unit/missing-hooks.test.js`
Expected: FAIL — script missing.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/hooks/pre-compact-ios.js`:

```javascript
#!/usr/bin/env node
/**
 * Pre-compact hook (iOS) - saves an iOS-focused session checkpoint before
 * context compaction. iOS analogue of pre-compact.js.
 */

const fs = require('fs');
const path = require('path');
const { log, getProjectRoot, ensureDir, getTimestamp, runCommand } = require('../lib/utils');
const { loadInstincts } = require('../lib/instincts');

function gitBranch(dir) {
    const r = runCommand('git rev-parse --abbrev-ref HEAD', { cwd: dir });
    return r.success ? r.output : 'unknown';
}

function recentSwiftFiles(dir) {
    const r = runCommand('git diff --name-only HEAD~3 -- "*.swift"', { cwd: dir });
    return r.success && r.output ? r.output.split('\n').filter(Boolean).slice(0, 20) : [];
}

function cleanOld(dir, keep) {
    try {
        const files = fs.readdirSync(dir).filter(f => f.startsWith('ios-checkpoint-')).sort().reverse();
        for (let i = keep; i < files.length; i++) fs.unlinkSync(path.join(dir, files[i]));
    } catch (_) { /* ignore */ }
}

function main() {
    const projectRoot = getProjectRoot();
    const checkpointDir = ensureDir(path.join(projectRoot, '.claude', 'checkpoints'));
    const file = path.join(checkpointDir, `ios-checkpoint-${getTimestamp()}.json`);

    const checkpoint = {
        timestamp: new Date().toISOString(),
        platform: 'ios',
        projectRoot,
        gitBranch: gitBranch(projectRoot),
        recentSwiftFiles: recentSwiftFiles(projectRoot),
        instincts: loadInstincts()
    };

    fs.writeFileSync(file, JSON.stringify(checkpoint, null, 2));
    log(`iOS checkpoint saved: ${path.basename(file)}`, 'success');
    cleanOld(checkpointDir, 10);
}

main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="pre-compact-ios" tests/unit/missing-hooks.test.js`
Expected: PASS.

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/hooks/pre-compact-ios.js`
Expected: exit 0.

```bash
git add scripts/hooks/pre-compact-ios.js tests/unit/missing-hooks.test.js
git commit -m "feat: add pre-compact-ios PreCompact hook"
```

## Task 7: Missing script — track-build.js

**Files:**
- Create: `scripts/hooks/track-build.js`
- Test: `tests/unit/missing-hooks.test.js` (append)

Records Gradle build/test events to `<project>/.claude/instincts/build-history.json`.
Receives no file arg; reads optional stdin hook event for the bash command, but
must work with empty stdin (records a generic build event). Always exits 0.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/missing-hooks.test.js`:

```javascript
describe('track-build.js', () => {
  it('records a build event and exits 0', () => {
    const os = require('os'); const fs = require('fs');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trackbuild-'));
    const event = JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'gradle test' } });
    execFileSync('node', [path.join(HOOKS, 'track-build.js')], {
      cwd: tmp, env: { ...process.env, CLAUDE_PROJECT_DIR: tmp },
      input: event, encoding: 'utf8', timeout: 15000
    });
    const f = path.join(tmp, '.claude/instincts/build-history.json');
    assert.ok(fs.existsSync(f), 'build-history.json created');
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    assert.ok(Array.isArray(data.events) && data.events.length >= 1);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="track-build" tests/unit/missing-hooks.test.js`
Expected: FAIL — script missing.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/hooks/track-build.js`:

```javascript
#!/usr/bin/env node
/**
 * V2 Instinct: track Gradle build/test events.
 * Appends a build event to <project>/.claude/instincts/build-history.json.
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot, ensureDir, runCommand } = require('../lib/utils');
const { readHookInput } = require('../lib/hook-input');

function main() {
    const input = readHookInput();
    const command = (input.tool_input && input.tool_input.command) || '';

    let kind = 'build';
    if (/\btest\b/.test(command)) kind = 'test';
    else if (/\bassemble\b/.test(command)) kind = 'assemble';

    const projectRoot = getProjectRoot();
    const dir = ensureDir(path.join(projectRoot, '.claude', 'instincts'));
    const file = path.join(dir, 'build-history.json');

    let history = { events: [] };
    if (fs.existsSync(file)) {
        try { history = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { history = { events: [] }; }
    }
    if (!Array.isArray(history.events)) history.events = [];

    const branch = runCommand('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot });

    history.events.push({
        timestamp: new Date().toISOString(),
        kind,
        command: command.slice(0, 200),
        gitBranch: branch.success ? branch.output : 'unknown'
    });
    history.events = history.events.slice(-100);

    fs.writeFileSync(file, JSON.stringify(history, null, 2));
    console.log(`📊 Build event tracked (${kind}).`);
}

main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="track-build" tests/unit/missing-hooks.test.js`
Expected: PASS.

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/hooks/track-build.js`
Expected: exit 0.

```bash
git add scripts/hooks/track-build.js tests/unit/missing-hooks.test.js
git commit -m "feat: add track-build PostToolUse hook"
```

## Task 8: Missing script — track-focus.js

**Files:**
- Create: `scripts/hooks/track-focus.js`
- Test: `tests/unit/missing-hooks.test.js` (append)

Records repeated-read focus files to `<project>/.claude/instincts/focus-history.json`.
Takes the file path from argv[2] (passed by the dispatcher / hook command);
falls back to stdin hook event. No-op (exit 0) if no file resolved.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/missing-hooks.test.js`:

```javascript
describe('track-focus.js', () => {
  it('increments focus count for a file and exits 0', () => {
    const os = require('os'); const fs = require('fs');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'trackfocus-'));
    const args = [path.join(HOOKS, 'track-focus.js'), '/repo/src/Main.kt'];
    const env = { ...process.env, CLAUDE_PROJECT_DIR: tmp };
    execFileSync('node', args, { cwd: tmp, env, encoding: 'utf8', timeout: 15000 });
    execFileSync('node', args, { cwd: tmp, env, encoding: 'utf8', timeout: 15000 });
    const f = path.join(tmp, '.claude/instincts/focus-history.json');
    const data = JSON.parse(fs.readFileSync(f, 'utf8'));
    assert.strictEqual(data['/repo/src/Main.kt'].count, 2);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('exits 0 with no file argument', () => {
    assert.doesNotThrow(() => execFileSync('node', [path.join(HOOKS, 'track-focus.js')], {
      input: '', encoding: 'utf8', timeout: 15000
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="track-focus" tests/unit/missing-hooks.test.js`
Expected: FAIL — script missing.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/hooks/track-focus.js`:

```javascript
#!/usr/bin/env node
/**
 * V2 Instinct: track repeated-read focus files.
 * Repeated reads of the same file indicate problem-solving; record a count.
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot, ensureDir } = require('../lib/utils');
const { readHookInput, resolveTargetFile } = require('../lib/hook-input');

function main() {
    let file = process.argv[2];
    if (!file || file.startsWith('$')) {
        file = resolveTargetFile(readHookInput());
    }
    if (!file) {
        process.exit(0);
    }

    const dir = ensureDir(path.join(getProjectRoot(), '.claude', 'instincts'));
    const f = path.join(dir, 'focus-history.json');

    let history = {};
    if (fs.existsSync(f)) {
        try { history = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { history = {}; }
    }

    const entry = history[file] || { count: 0, firstSeen: new Date().toISOString() };
    entry.count += 1;
    entry.lastSeen = new Date().toISOString();
    history[file] = entry;

    fs.writeFileSync(f, JSON.stringify(history, null, 2));
    console.log(`🔁 Focus tracked: ${path.basename(file)} (x${entry.count}).`);
}

main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern="track-focus" tests/unit/missing-hooks.test.js`
Expected: PASS — 2 tests.

- [ ] **Step 5: Lint and commit**

Run: `node --check scripts/hooks/track-focus.js`
Expected: exit 0.

```bash
git add scripts/hooks/track-focus.js tests/unit/missing-hooks.test.js
git commit -m "feat: add track-focus PostToolUse hook"
```

## Task 9: Consolidated event-keyed hooks/hooks.json

**Files:**
- Modify: `hooks/hooks.json` (replace entirely)
- Delete: `hooks/hooks-ios.json`, `hooks/checkpoint-hooks.json`, `hooks/extended/instinct-hooks.json`
- Test: `tests/unit/missing-hooks.test.js` (append a schema test)

Converts the legacy array+`event` schema into the current event-keyed plugin
schema. Matchers use the supported tool-name form (`Write|Edit`, `Bash`).
File-type precision lives in `post-tool-use.js`. All script paths use
`${CLAUDE_PLUGIN_ROOT}`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/missing-hooks.test.js`:

```javascript
describe('hooks/hooks.json schema', () => {
  it('is event-keyed and references CLAUDE_PLUGIN_ROOT, not hardcoded paths', () => {
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../hooks/hooks.json'), 'utf8'));
    assert.ok(cfg.hooks && !Array.isArray(cfg.hooks), 'hooks must be an object keyed by event');
    for (const evt of ['Stop', 'PreCompact', 'PostToolUse']) {
      assert.ok(Array.isArray(cfg.hooks[evt]), `${evt} must be an array`);
    }
    const raw = fs.readFileSync(path.join(__dirname, '../../hooks/hooks.json'), 'utf8');
    assert.ok(!raw.includes('/Users/ah3sh/'), 'no hardcoded author paths');
    assert.ok(raw.includes('${CLAUDE_PLUGIN_ROOT}'), 'uses plugin root variable');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="hooks.json schema" tests/unit/missing-hooks.test.js`
Expected: FAIL — current `hooks.json` has `hooks` as an array.

- [ ] **Step 3: Write minimal implementation**

Replace the entire contents of `hooks/hooks.json` with:

```json
{
  "hooks": {
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

- [ ] **Step 4: Delete superseded hook files**

```bash
git rm hooks/hooks-ios.json hooks/checkpoint-hooks.json hooks/extended/instinct-hooks.json
```

Note: `track-build.js` reads the bash command from stdin and only records
Gradle-related events meaningfully; non-Gradle Bash calls still record a generic
event (acceptable, capped at 100). `track-focus.js` records every Read; this is
intentional and bounded (one JSON keyed by path).

- [ ] **Step 5: Run test + JSON lint to verify it passes**

Run: `node --test --test-name-pattern="hooks.json schema" tests/unit/missing-hooks.test.js`
Expected: PASS.
Run: `npm run lint:json`
Expected: exit 0, no invalid-JSON errors.

- [ ] **Step 6: Commit**

```bash
git add hooks/hooks.json tests/unit/missing-hooks.test.js
git commit -m "refactor: consolidate hooks into event-keyed plugin schema"
```

## Task 10: Root .mcp.json + fix mcp-configs

**Files:**
- Create: `.mcp.json` (repo root)
- Modify: `mcp-configs/mobile-memory.json:5-7`, `mcp-configs/ios.json:5-7`, `mcp-configs/kmp-memory.json:2-13`
- Test: `tests/unit/missing-hooks.test.js` (append)

The KMP config is fully mismatched: it names server `kmp-memory` at
`mcp-servers/kmp-memory/index.js` with env `KMP_MEMORY_DIR`, but the actual
server is `mcp-servers/kmp-context/index.js` reading `KMP_CONTEXT_DIR`. The new
`.mcp.json` is the source of truth; the legacy `mcp-configs/*.json` are fixed
for consistency. MCP servers store memory under `process.cwd()` — left to
default so memory lands in the user's project.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/missing-hooks.test.js`:

```javascript
describe('.mcp.json', () => {
  it('wires 3 servers with CLAUDE_PLUGIN_ROOT and correct kmp-context', () => {
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../.mcp.json'), 'utf8'));
    const s = cfg.mcpServers;
    assert.ok(s['mobile-memory'] && s['ios-memory'] && s['kmp-context'], 'all 3 servers present');
    const raw = fs.readFileSync(path.join(__dirname, '../../.mcp.json'), 'utf8');
    assert.ok(!raw.includes('/Users/ah3sh/'), 'no hardcoded paths');
    assert.ok(raw.includes('${CLAUDE_PLUGIN_ROOT}'), 'uses plugin root');
    assert.ok(s['kmp-context'].args.some(a => a.includes('kmp-context/index.js')), 'points at real kmp-context server');
    assert.ok(s['kmp-context'].env.KMP_CONTEXT_DIR, 'uses KMP_CONTEXT_DIR');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern="\.mcp\.json" tests/unit/missing-hooks.test.js`
Expected: FAIL — `.mcp.json` does not exist.

- [ ] **Step 3: Create `.mcp.json`**

Create `.mcp.json` at the repo root:

```json
{
  "mcpServers": {
    "mobile-memory": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-servers/mobile-memory/index.js"],
      "env": {
        "MOBILE_MEMORY_DIR": ".claude/mobile-memory",
        "MOBILE_MEMORY_MAX_SIZE": "10MB",
        "MOBILE_MEMORY_RETENTION": "90days"
      }
    },
    "ios-memory": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-servers/ios-memory/index.js"],
      "env": {
        "IOS_MEMORY_DIR": ".claude/ios-memory",
        "IOS_MEMORY_MAX_SIZE": "10MB",
        "IOS_MEMORY_RETENTION": "90days"
      }
    },
    "kmp-context": {
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-servers/kmp-context/index.js"],
      "env": {
        "KMP_CONTEXT_DIR": ".claude/kmp-context"
      }
    }
  }
}
```

- [ ] **Step 4: Fix legacy mcp-configs**

In `mcp-configs/mobile-memory.json`, replace the `args` array (lines 5-7) value
`/Users/ah3sh/Developer/everything-claude-code-mobile/mcp-servers/mobile-memory/index.js`
with `${CLAUDE_PLUGIN_ROOT}/mcp-servers/mobile-memory/index.js`.

In `mcp-configs/ios.json`, same change for the `ios-memory` path →
`${CLAUDE_PLUGIN_ROOT}/mcp-servers/ios-memory/index.js`.

In `mcp-configs/kmp-memory.json`, replace lines 2-13 (the `mcpServers` block) with:

```json
    "mcpServers": {
        "kmp-context": {
            "command": "node",
            "args": [
                "${CLAUDE_PLUGIN_ROOT}/mcp-servers/kmp-context/index.js"
            ],
            "env": {
                "KMP_CONTEXT_DIR": ".claude/kmp-context"
            }
        }
    },
```

- [ ] **Step 5: Mark legacy mcp-configs as superseded (spec intent)**

The spec calls for moving the non-standard `capabilities`/`memoryTypes`/embedded
`hooks` keys out of the real config. `.mcp.json` is now the source of truth, so
rather than a full migration, add this top-level key to each of
`mcp-configs/mobile-memory.json`, `mcp-configs/ios.json`,
`mcp-configs/kmp-memory.json` (as the first key after `{`):

```json
    "_deprecated": "Superseded by /.mcp.json. Kept for reference only; the capabilities/memoryTypes fields document server schema and are NOT read by Claude Code.",
```

Then append a line to `mcp-configs/README.md`: "These files are reference-only;
the plugin loads MCP servers from the repo-root `.mcp.json`."

- [ ] **Step 6: Run test + JSON lint**

Run: `node --test --test-name-pattern="\.mcp\.json" tests/unit/missing-hooks.test.js`
Expected: PASS.
Run: `npm run lint:json`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add .mcp.json mcp-configs/mobile-memory.json mcp-configs/ios.json mcp-configs/kmp-memory.json mcp-configs/README.md tests/unit/missing-hooks.test.js
git commit -m "feat: wire MCP servers via root .mcp.json; fix kmp-context mismatch"
```

## Task 11: Rebrand plugin manifest + FORK-NOTES + install docs

**Files:**
- Modify: `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`
- Create: `FORK-NOTES.md`
- Modify: `docs/installation.md` (Quick Start section)

- [ ] **Step 1: Update `.claude-plugin/plugin.json`**

Set `"version": "1.2.0"`. Replace the `author` object and `homepage`/`repository`:

```json
  "version": "1.2.0",
  "author": {
    "name": "sahsenvar",
    "url": "https://github.com/sahsenvar"
  },
  "homepage": "https://github.com/sahsenvar/everything-claude-code-mobile",
  "repository": "https://github.com/sahsenvar/everything-claude-code-mobile",
```

Leave `skills`/`agents`/`commands` keys unchanged. Do NOT add `hooks`/`mcpServers`
keys — `hooks/hooks.json` and `.mcp.json` auto-discover at the plugin root.

- [ ] **Step 2: Update `.claude-plugin/marketplace.json`**

Set the plugin entry `"version": "1.2.0"`, `owner.name` → `sahsenvar`, and
`source.repo` → `sahsenvar/everything-claude-code-mobile`.

- [ ] **Step 3: Create `FORK-NOTES.md`**

```markdown
# Fork Notes

Personal fork of [ahmed3elshaer/everything-claude-code-mobile](https://github.com/ahmed3elshaer/everything-claude-code-mobile).

## Divergence from upstream
- Hooks consolidated into a single event-keyed `hooks/hooks.json` (plugin schema)
  routed through `scripts/hooks/post-tool-use.js`.
- Added missing hook scripts: `evaluate-ios-session.js`, `pre-compact-ios.js`,
  `track-build.js`, `track-focus.js`.
- All hardcoded `/Users/ah3sh/...` paths replaced with `${CLAUDE_PLUGIN_ROOT}`.
- MCP servers wired via root `.mcp.json`; fixed `kmp-context` server mismatch.
- Path resolution hardened (`scripts/lib/paths.js`, `CLAUDE_PROJECT_DIR`).

## Pulling upstream updates
```bash
git fetch upstream
git checkout main
git merge upstream/main      # main mirrors upstream; resolve as needed
git checkout fix/portability-and-quality
git rebase main              # replay fork changes on top
npm test && npm run lint:json
```
Re-run the smoke test (Task 15) after any upstream merge.
```

- [ ] **Step 4: Update `docs/installation.md`**

Replace the `## Quick Start` install commands so they reference the fork:

```bash
/plugin marketplace add sahsenvar/everything-claude-code-mobile
/plugin install everything-claude-code-mobile@sahsenvar
```

- [ ] **Step 5: Validate + commit**

Run: `npm run lint:json`
Expected: exit 0.

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json FORK-NOTES.md docs/installation.md
git commit -m "chore: rebrand manifest to sahsenvar fork; add FORK-NOTES"
```

## Task 12: MCP server dependency install

**Files:**
- Create: `scripts/install-mcp-deps.js`
- Modify: `package.json:5-13` (scripts block)

The 3 MCP servers each have their own `package.json` (dependency
`@modelcontextprotocol/sdk`) and `package-lock.json`, but no installed
`node_modules`. They cannot start until deps are installed.

- [ ] **Step 1: Create `scripts/install-mcp-deps.js`**

```javascript
#!/usr/bin/env node
/**
 * Install npm dependencies for each bundled MCP server.
 * Run after cloning / before first plugin use.
 */

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const SERVERS = ['mobile-memory', 'ios-memory', 'kmp-context'];
const root = path.resolve(__dirname, '..');

for (const name of SERVERS) {
    const dir = path.join(root, 'mcp-servers', name);
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
        console.log(`skip ${name}: no package.json`);
        continue;
    }
    const hasLock = fs.existsSync(path.join(dir, 'package-lock.json'));
    console.log(`installing deps for ${name} (${hasLock ? 'npm ci' : 'npm install'})...`);
    execFileSync('npm', [hasLock ? 'ci' : 'install', '--omit=dev'], {
        cwd: dir, stdio: 'inherit'
    });
}
console.log('MCP server dependencies installed.');
```

- [ ] **Step 2: Add npm script**

In `package.json`, add to the `scripts` block:

```json
    "mcp:install": "node scripts/install-mcp-deps.js",
```

- [ ] **Step 3: Run it**

Run: `node --check scripts/install-mcp-deps.js && npm run mcp:install`
Expected: exit 0; `mcp-servers/mobile-memory/node_modules`,
`mcp-servers/ios-memory/node_modules`, `mcp-servers/kmp-context/node_modules`
created.

- [ ] **Step 4: Verify each server starts then exits cleanly**

A stdio MCP server waits on stdin, so we spawn each, give it 3s, then kill it —
confirming it does not crash on startup. `timeout(1)` is not on stock macOS, so
use this portable node one-liner:
```bash
for s in mobile-memory ios-memory kmp-context; do
  node -e 'const{spawn}=require("child_process");const c=spawn("node",[process.argv[1]],{stdio:["ignore","ignore","inherit"]});let bad=false;c.on("exit",code=>{if(code&&code!==0)bad=true;});setTimeout(()=>{c.kill();console.log(process.argv[1]+(bad?" CRASHED":" ok"));process.exit(bad?1:0);},3000);' "mcp-servers/$s/index.js";
done
```
Expected: each prints `... ok` with no stack trace on stderr. Any `CRASHED` or
stderr stack trace is a FAIL — fix before proceeding.

- [ ] **Step 5: Commit**

`mcp-servers/*/node_modules` is build output; confirm it is git-ignored
(`git check-ignore mcp-servers/mobile-memory/node_modules` prints the path). If
not ignored, add `mcp-servers/*/node_modules/` to `.gitignore` and stage it.

```bash
git add scripts/install-mcp-deps.js package.json .gitignore
git commit -m "feat: add mcp:install for bundled MCP server dependencies"
```

## Task 13: Full validation gate

**Files:** none (verification only)

- [ ] **Step 1: Lint all scripts**

Run: `npm run lint:scripts`
Expected: exit 0 (this also runs as `pretest`). It runs
`node --check scripts/hooks/*.js scripts/lib/*.js` — every new script must parse.

- [ ] **Step 2: Lint all JSON**

Run: `npm run lint:json`
Expected: exit 0; no invalid JSON reported.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS — all unit + integration tests pass, including the new
`paths.test.js`, `hook-input.test.js`, `missing-hooks.test.js`, and the added
`getProjectRoot` case. Zero failing tests.

- [ ] **Step 4: Run the repo verify script**

Run: `node tests/verify.js`
Expected: every phase reports "All checks passed" (the four previously-missing
scripts now exist; hook/MCP JSON parse as valid).

- [ ] **Step 5: Commit (only if verify revealed and you fixed anything)**

```bash
git status --porcelain
# if changes were needed:
git add -A && git commit -m "fix: address validation-gate findings"
```

## Task 14: Push branch and update main mirror

**Files:** none (git only)

- [ ] **Step 1: Push the working branch**

Run: `git push -u origin fix/portability-and-quality`
Expected: branch published to `sahsenvar/everything-claude-code-mobile`.

- [ ] **Step 2: Fast-forward main to mirror upstream, then merge the fix branch**

```bash
git checkout main
git fetch upstream
git merge --ff-only upstream/main   # main stays a clean upstream mirror
git merge --no-ff fix/portability-and-quality -m "merge: portability + plugin wiring"
git push origin main
git checkout fix/portability-and-quality
```
Expected: `main` now contains the fork changes; `origin/main` updated. If
`merge --ff-only upstream/main` fails (main already has commits), STOP and
reconcile manually — do not force.

## Task 15: Install from the fork and smoke-test in Claude Code

**Files:** none (manual verification in Claude Code)

These steps run in an interactive Claude Code session, not the shell. Prefix
slash commands by typing them in the Claude Code prompt.

- [ ] **Step 1: Add the marketplace + install**

In Claude Code:
```
/plugin marketplace add sahsenvar/everything-claude-code-mobile
/plugin install everything-claude-code-mobile@sahsenvar
```
Expected: install succeeds; `/plugin` shows `everything-claude-code-mobile@sahsenvar` v1.2.0 enabled.

- [ ] **Step 2: Verify skills/agents/commands loaded**

Run `/plugin` (or `/help`) and confirm mobile skills/commands appear (e.g.
`/feature-build`, `kmp-networking` skill). Expected: present.

- [ ] **Step 3: Verify MCP servers connected**

Run `/mcp`. Expected: `mobile-memory`, `ios-memory`, `kmp-context` listed as
connected (not "failed"). If failed: re-check `npm run mcp:install` ran and
`.mcp.json` paths; fix and reinstall.

- [ ] **Step 4: Verify a hook fires**

In a throwaway git repo containing a `.claude/` dir, use Claude Code to `Write`
a file named `HomeViewModel.kt`. Expected: the PostToolUse dispatcher prints the
"add a matching ViewModel test" reminder. Trigger a compaction or end the
session and confirm no hook error appears.

- [ ] **Step 5: Record the result**

If all four steps pass, the plugin is verified working. If any fail, return to
the relevant task (hooks → Task 9, MCP → Task 10/12), fix, re-run Task 13–14,
reinstall, repeat.

## Task 16: Finalize

**Files:**
- Modify: `docs/superpowers/specs/2026-05-16-ecc-mobile-fork-portability-quality-design.md` (mark Phase 1–3 done)

- [ ] **Step 1: Tag the working version**

```bash
git checkout main
git tag -a v1.2.0-fork.1 -m "Working plugin: portability + wiring"
git push origin v1.2.0-fork.1
git checkout fix/portability-and-quality
```

- [ ] **Step 2: Update the spec status**

In the design spec, append a line under `Status:` noting "Phases 1–3 + working-plugin finalize: DONE on <date>; Phase 4 (content review) deferred to its own plan."

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-05-16-ecc-mobile-fork-portability-quality-design.md
git commit -m "docs: mark portability plan complete"
git push origin fix/portability-and-quality
```

- [ ] **Step 4: Hand off to Plan 2**

State to the user: the plugin is installed and verified; the deep content-quality
review (the user's stack: Koin/Ktor/MVI/SQLDelight + Compose/SwiftUI) is a
separate brainstorming→spec→plan cycle, to start when the user is ready.

---

## Notes for the implementer

- A hook must never crash the session: every new script swallows its own errors
  and exits 0. Do not "improve" this into throwing.
- `${CLAUDE_PLUGIN_ROOT}` / `${CLAUDE_PROJECT_DIR}` are substituted by Claude
  Code at hook/MCP launch; in plain shell tests they are NOT set, which is why
  `paths.js` has fallbacks and tests set the env vars explicitly.
- MCP servers persist memory under `process.cwd()`; cwd defaults to the user's
  project, which is the desired per-project behavior — do not add a `cwd`
  override to `.mcp.json`.
- The legacy expression matchers (`tool == "Edit" && ...`) were never valid
  Claude Code matchers; precision now lives in `post-tool-use.js`. This is
  intentional, not a regression.
- `git rm` in Task 9 must run before Task 13 (verify.js checks hook JSON parse;
  it does not require the deleted files).
