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

  it('detects kmp via a shared/ dir even with non-kts build.gradle', () => {
    const root = tmpdir('ecc-root-');
    const k2 = tmpdir('p-k2-');
    fs.writeFileSync(path.join(k2, 'build.gradle'), '');
    fs.writeFileSync(path.join(k2, 'settings.gradle'), '');
    fs.mkdirSync(path.join(k2, 'shared'), { recursive: true });
    assert.strictEqual(setup.detectState({ pluginRoot: root, projectDir: k2 }).platform, 'kmp');
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
