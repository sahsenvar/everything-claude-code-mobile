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
