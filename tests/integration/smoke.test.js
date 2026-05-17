const { describe, it, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const FIX = path.join(REPO, 'examples', 'android-smoke');
const { detectState } = require('../../scripts/lib/setup');

describe('Feature A — committed fixture', () => {
  it('examples/android-smoke exists and is android-detected', () => {
    assert.ok(fs.existsSync(FIX), 'fixture dir must exist');
    for (const f of ['settings.gradle.kts', 'build.gradle.kts', 'app/build.gradle.kts',
      'app/src/main/AndroidManifest.xml',
      'app/src/main/java/com/example/smoke/HomeViewModel.kt',
      'app/src/main/java/com/example/smoke/HomeScreen.kt', 'README.md']) {
      assert.ok(fs.existsSync(path.join(FIX, f)), `missing ${f}`);
    }
    assert.strictEqual(
      detectState({ pluginRoot: REPO, projectDir: FIX }).platform, 'android');
  });
});

const { execFileSync, spawnSync } = require('child_process');
const os = require('os');
const { createMockAndroidProject, cleanupDir } = require('../helpers/test-utils');
const { doctorReport } = require('../../scripts/lib/setup');

const HOOKS = path.join(REPO, 'scripts', 'hooks');
const SERVERS = ['mobile-memory', 'ios-memory', 'kmp-context'];

function runHook(name, event, projectDir) {
  return execFileSync('node', [path.join(HOOKS, name)], {
    input: JSON.stringify(event || {}),
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir, CLAUDE_PLUGIN_ROOT: REPO },
  });
}

describe('Feature A — hook runtime smoke', () => {
  const proj = path.join(os.tmpdir(), `ecc-smoke-${process.pid}-${Date.now()}`);
  after(() => cleanupDir(proj));
  it('setup: scaffold a temp android project', () => {
    createMockAndroidProject(proj);
    assert.ok(fs.existsSync(proj));
  });

  it('post-tool-use.js (Write ViewModel) exits 0 + emits TDD reminder', () => {
    const out = runHook('post-tool-use.js', {
      tool_name: 'Write',
      tool_input: { file_path: path.join(proj, 'app/src/main/java/com/example/ui/HomeViewModel.kt') },
    }, proj);
    assert.match(out, /TDD|test/i);
  });

  it('track-build.js (Bash gradle) writes build-history.json', () => {
    runHook('track-build.js', {
      tool_name: 'Bash', tool_input: { command: './gradlew assembleDebug' },
    }, proj);
    const f = path.join(proj, '.claude', 'instincts', 'build-history.json');
    assert.ok(fs.existsSync(f), 'build-history.json created');
    const h = JSON.parse(fs.readFileSync(f, 'utf8'));
    assert.ok(Array.isArray(h.events) && h.events.length >= 1);
  });

  it('check-setup.js (SessionStart) never throws, exits 0', () => {
    assert.doesNotThrow(() => runHook('check-setup.js', {}, proj));
  });

  it('pre-compact.js (PreCompact) writes a checkpoint', () => {
    runHook('pre-compact.js', {}, proj);
    const cp = path.join(proj, '.claude', 'checkpoints');
    assert.ok(fs.existsSync(cp) && fs.readdirSync(cp).length >= 1, 'checkpoint written');
  });

});

describe('Feature A — doctorReport runtime', () => {
  it('reports android + expected shape against the fixture', () => {
    const r = doctorReport({ pluginRoot: REPO, projectDir: FIX });
    assert.strictEqual(r.platform, 'android');
    assert.ok(r.projectDataDirs.includes('.claude/mobile-memory'));
    for (const k of ['mcp', 'companions', 'ok', 'sessionStartHookRegistered']) {
      assert.ok(k in r, `report missing ${k}`);
    }
  });
});

describe('Feature A — MCP server smoke (spawn + initialize)', () => {
  for (const s of SERVERS) {
    it(`${s} responds to JSON-RPC initialize (or skips if no node_modules)`, () => {
      const dir = path.join(REPO, 'mcp-servers', s);
      if (!fs.existsSync(path.join(dir, 'node_modules'))) {
        const chk = spawnSync('node', ['--check', path.join(dir, 'index.js')]);
        assert.strictEqual(chk.status, 0, `${s}/index.js must be valid JS`);
        return;
      }
      const req = JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '1.0.0' } },
      }) + '\n';
      const res = spawnSync('node', [path.join(dir, 'index.js')], {
        input: req, encoding: 'utf8', timeout: 5000,
      });
      const stdout = res.stdout || '';
      const line = stdout.split('\n').find((l) => l.trim().startsWith('{'));
      assert.ok(line, `${s}: expected a JSON-RPC response on stdout`);
      const msg = JSON.parse(line);
      assert.ok(msg.result && msg.result.capabilities, `${s}: initialize result.capabilities`);
    });
  }
});

describe('Feature A — install-mcp-deps shim', () => {
  it('require exposes installMcpDeps and does not spawn', () => {
    const m = require('../../scripts/install-mcp-deps.js');
    assert.strictEqual(typeof m.installMcpDeps, 'function');
  });
});
