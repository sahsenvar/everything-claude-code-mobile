const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DISC = 'ecc-operating-discipline';

describe('Feature E — mobile-dependency-upgrader agent', () => {
  it('exists, valid frontmatter, discipline ref, 3 ecosystems + coordinated set', () => {
    const p = path.join(ROOT, 'agents', 'mobile-dependency-upgrader.md');
    assert.ok(fs.existsSync(p), 'agent file must exist');
    const c = fs.readFileSync(p, 'utf8');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block');
    assert.match(m[1], /name:\s*mobile-dependency-upgrader/);
    assert.match(m[1], /description:\s*\S/);
    assert.match(m[1], /model:\s*opus/);
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(/AGP|Gradle/.test(c), 'covers Android/Gradle');
    assert.ok(/SwiftPM|Package\.swift/.test(c), 'covers iOS SwiftPM');
    assert.ok(/KMP|multiplatform/i.test(c), 'covers KMP');
    assert.ok(/KSP|Compose compiler|coordinated/i.test(c), 'coordinated version set');
  });
});

describe('Feature E — dependency-upgrade command', () => {
  it('exists, valid frontmatter, discipline ref, invokes the agent, --check', () => {
    const p = path.join(ROOT, 'commands', 'dependency-upgrade.md');
    assert.ok(fs.existsSync(p), 'command file must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, 'frontmatter description');
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('mobile-dependency-upgrader'), 'invokes the agent');
    assert.match(c, /--check/, 'documents read-only --check mode');
  });
});
