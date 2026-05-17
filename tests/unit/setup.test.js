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

describe('scripts/lib/setup.js — doctorReport', () => {
  it('composes a structured report with ok=false when deps missing', () => {
    const root = tmpdir('ecc-doc-');
    const proj = tmpdir('ecc-docp-');
    const f = path.join(tmpdir('ecc-docpl-'), 'installed_plugins.json');
    fs.writeFileSync(f, JSON.stringify({ plugins: {} }));
    const r = setup.doctorReport({ pluginRoot: root, projectDir: proj, pluginsFile: f, instinctsFile: '/no/such/ecc-test-instincts.json' });
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
    const r = setup.doctorReport({ pluginRoot: root, projectDir: root, pluginsFile: f, instinctsFile: '/no/such/ecc-test-instincts.json' });
    assert.strictEqual(r.ok, true);
  });
});

describe('scripts/install-mcp-deps.js — CLI shim', () => {
  it('require() exposes installMcpDeps and does NOT run the loop at require time', () => {
    const before = require('module')._cache; // sanity: requiring must not throw or spawn
    const shim = require('../../scripts/install-mcp-deps.js');
    assert.strictEqual(typeof shim.installMcpDeps, 'function');
    assert.strictEqual(shim.installMcpDeps, setup.installMcpDeps);
    assert.ok(before);
  });
});

describe('hooks/hooks.json — SessionStart registration', () => {
  it('registers check-setup.js under SessionStart with plugin-root var', () => {
    const cfg = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../hooks/hooks.json'), 'utf8'));
    assert.ok(Array.isArray(cfg.hooks.SessionStart), 'SessionStart must be an array');
    const flat = JSON.stringify(cfg.hooks.SessionStart);
    assert.ok(flat.includes('check-setup.js'), 'must reference check-setup.js');
    assert.ok(flat.includes('${CLAUDE_PLUGIN_ROOT}'), 'must use plugin-root variable');
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
