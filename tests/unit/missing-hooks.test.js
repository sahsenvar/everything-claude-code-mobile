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
    assert.match(out, /ViewModel test/i);
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

describe('evaluate-ios-session.js', () => {
  it('runs and exits 0 in a non-iOS dir', () => {
    const out = execFileSync('node', [path.join(HOOKS, 'evaluate-ios-session.js')], {
      cwd: require('os').tmpdir(), encoding: 'utf8', timeout: 15000
    });
    assert.match(out, /iOS|skip|Swift/i);
  });
});

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
