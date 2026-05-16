const { describe, it } = require('node:test');
const assert = require('node:assert');

const { parseHookInput, resolveTargetFile } = require('../../scripts/lib/hook-input');

describe('scripts/lib/hook-input.js', () => {
  it('parseHookInput returns {} for empty string', () => {
    assert.deepStrictEqual(parseHookInput(''), {});
  });

  it('parseHookInput returns {} for invalid JSON', () => {
    assert.deepStrictEqual(parseHookInput('not json'), {});
  });

  it('parseHookInput parses a valid hook event', () => {
    const raw = JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: '/p/A.kt' } });
    assert.deepStrictEqual(parseHookInput(raw), { tool_name: 'Edit', tool_input: { file_path: '/p/A.kt' } });
  });

  it('resolveTargetFile reads tool_input.file_path', () => {
    assert.strictEqual(resolveTargetFile({ tool_input: { file_path: '/p/A.kt' } }), '/p/A.kt');
  });

  it('resolveTargetFile returns null when absent', () => {
    assert.strictEqual(resolveTargetFile({}), null);
    assert.strictEqual(resolveTargetFile({ tool_input: {} }), null);
  });
});
