const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CMD = path.join(__dirname, '..', '..', 'commands');
const DISCIPLINE = 'ecc-operating-discipline';

function read(name) {
  const p = path.join(CMD, name);
  assert.ok(fs.existsSync(p), `${name} must exist`);
  return fs.readFileSync(p, 'utf8');
}
function assertCommon(c, name) {
  assert.ok(c.startsWith('---'), `${name}: frontmatter`);
  assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, `${name}: description`);
  assert.ok(c.includes(DISCIPLINE), `${name}: operating-discipline ref`);
  assert.match(c, /not detected|skip/i, `${name}: soft-degrade wording`);
}

describe('Feature B — jira-feature-build', () => {
  it('exists, valid, soft-detect, references Jira tools + feature-build', () => {
    const c = read('jira-feature-build.md');
    assertCommon(c, 'jira-feature-build.md');
    assert.ok(c.includes('getJiraIssue'), 'references getJiraIssue');
    assert.ok(c.includes('/feature-build'), 'invokes /feature-build');
  });
});

describe('Feature B — github-pr-feature', () => {
  it('exists, valid, soft-detect, references GitHub PR tools', () => {
    const c = read('github-pr-feature.md');
    assertCommon(c, 'github-pr-feature.md');
    assert.ok(c.includes('create_pull_request'), 'references create_pull_request');
    assert.ok(c.includes('update_pull_request') || c.includes('pull_request_read'),
      'references PR read/update');
  });
});
