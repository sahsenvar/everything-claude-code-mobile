const { describe, it } = require('node:test');
const assert = require('node:assert');
const inst = require('../../scripts/lib/instincts');

const DAY = 86400000;
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();

function sample() {
  return {
    instincts: [
      { id: 'a', confidence: 0.9, lastUsed: iso(1 * DAY) },
      { id: 'b', confidence: 0.2, lastUsed: iso(1 * DAY) },
      { id: 'c', confidence: 0.8, lastUsed: iso(90 * DAY) },
      { id: 'd', confidence: 0.5, lastUsed: iso(2 * DAY) },
      { id: 'e', confidence: 0.1, lastUsed: iso(120 * DAY) },
    ],
  };
}

describe('Feature F — instinctHealth', () => {
  it('counts total/confident/stale/lowConfidence/prunable', () => {
    const h = inst.instinctHealth(sample());
    assert.strictEqual(h.total, 5);
    assert.strictEqual(h.confident, 2);
    assert.strictEqual(h.stale, 2);
    assert.strictEqual(h.lowConfidence, 2);
    assert.strictEqual(h.prunable, 3);
  });
  it('tolerates null / empty / missing fields → zeros', () => {
    for (const d of [null, undefined, {}, { instincts: [] }, { instincts: [{ id: 'x' }] }]) {
      const h = inst.instinctHealth(d);
      assert.strictEqual(typeof h.total, 'number');
      assert.ok(h.prunable >= 0 && h.confident >= 0);
    }
    assert.strictEqual(inst.instinctHealth({ instincts: [{ id: 'x' }] }).prunable, 0);
  });
});

describe('Feature F — selectPrunable', () => {
  it('returns exactly the low-confidence OR stale instincts, input unmutated', () => {
    const data = sample();
    const snapshot = JSON.stringify(data);
    const ids = inst.selectPrunable(data).map((i) => i.id).sort();
    assert.deepStrictEqual(ids, ['b', 'c', 'e']);
    assert.strictEqual(JSON.stringify(data), snapshot, 'must not mutate input');
  });
  it('honors threshold params', () => {
    const data = sample();
    assert.deepStrictEqual(
      inst.selectPrunable(data, { maxConfidence: 0.05, staleDays: 999 }).map((i) => i.id), []);
  });
});
