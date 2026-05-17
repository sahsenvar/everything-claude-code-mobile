const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DISC = 'ecc-operating-discipline';

describe('Feature C — android-ci-generator agent', () => {
  it('exists with valid frontmatter, discipline ref, real GH Actions body', () => {
    const p = path.join(ROOT, 'agents', 'android-ci-generator.md');
    assert.ok(fs.existsSync(p), 'agent file must exist');
    const c = fs.readFileSync(p, 'utf8');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block');
    assert.match(m[1], /name:\s*android-ci-generator/);
    assert.match(m[1], /description:\s*\S/);
    assert.match(m[1], /model:\s*opus/);
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('actions/setup-java'), 'real GH Actions: setup-java');
    assert.ok(c.includes('runs-on:'), 'real GH Actions: runs-on');
    assert.ok(c.includes('./gradlew'), 'gradle build steps');
  });
});

describe('Feature C — android-ci command', () => {
  it('exists, valid frontmatter, discipline ref, invokes the agent, generate+fix', () => {
    const p = path.join(ROOT, 'commands', 'android-ci.md');
    assert.ok(fs.existsSync(p), 'command file must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, 'frontmatter description');
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('android-ci-generator'), 'invokes the agent');
    assert.match(c, /generate/i, 'documents generate mode');
    assert.match(c, /fix/i, 'documents fix mode');
  });
});
