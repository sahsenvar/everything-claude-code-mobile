const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DISC = 'ecc-operating-discipline';

describe('Feature G — accessibility-reviewer agent', () => {
  it('exists, valid read-only frontmatter, discipline ref, a11y scope + skill ref', () => {
    const p = path.join(ROOT, 'agents', 'accessibility-reviewer.md');
    assert.ok(fs.existsSync(p), 'agent file must exist');
    const c = fs.readFileSync(p, 'utf8');
    const m = c.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(m, 'frontmatter block');
    assert.match(m[1], /name:\s*accessibility-reviewer/);
    assert.match(m[1], /description:\s*\S/);
    assert.match(m[1], /model:\s*opus/);
    assert.ok(!/"Write"|"Edit"/.test(m[1]), 'read-only: no Write/Edit tool');
    assert.ok(c.includes(DISC), 'operating-discipline ref');
    assert.ok(/contentDescription/.test(c), 'Compose a11y scope');
    assert.ok(/accessibilityLabel/.test(c), 'SwiftUI a11y scope');
    assert.ok(/48dp|44pt/.test(c), 'touch-target scope');
    assert.ok(c.includes('accessibility-patterns'), 'references the sibling skill');
  });
});
