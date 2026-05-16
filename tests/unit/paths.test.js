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
