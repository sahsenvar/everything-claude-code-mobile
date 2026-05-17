const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DISC = 'ecc-operating-discipline';

describe('Feature D — mobile-crash-resolver agent', () => {
  it('exists, valid frontmatter, discipline ref, all input sources + output', () => {
    const p = path.join(ROOT, 'agents', 'mobile-crash-resolver.md');
    assert.ok(fs.existsSync(p), 'agent file must exist');
    const c = fs.readFileSync(p, 'utf8');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block');
    assert.match(m[1], /name:\s*mobile-crash-resolver/);
    assert.match(m[1], /description:\s*\S/);
    assert.match(m[1], /model:\s*opus/);
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(/Crashlytics/.test(c), 'documents Crashlytics input');
    assert.ok(/Sentry/.test(c), 'documents Sentry input');
    assert.ok(/logcat/i.test(c), 'documents logcat/raw input');
    assert.ok(/Caused by/.test(c), 'normalization mentions root-cause chain');
    assert.ok(/Root cause/i.test(c), 'structured output: root cause');
  });
});

describe('Feature D — crash-triage command', () => {
  it('exists, valid frontmatter, discipline ref, invokes the agent', () => {
    const p = path.join(ROOT, 'commands', 'crash-triage.md');
    assert.ok(fs.existsSync(p), 'command file must exist');
    const c = fs.readFileSync(p, 'utf8');
    assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, 'frontmatter description');
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(c.includes('mobile-crash-resolver'), 'invokes the agent');
    assert.match(c, /paste|stacktrace|crash/i, 'documents pasting a crash');
  });
});
