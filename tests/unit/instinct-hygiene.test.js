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

const os = require('os');
const fs = require('fs');
const path = require('path');
const setup = require('../../scripts/lib/setup');

describe('Feature F — doctorReport.instincts (injectable)', () => {
  it('missing instinctsFile → instincts all-zero, existing keys intact', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'f-root-'));
    const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'f-proj-'));
    const pf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f-pl-')), 'p.json');
    fs.writeFileSync(pf, JSON.stringify({ plugins: {} }));
    const r = setup.doctorReport({ pluginRoot: root, projectDir: proj, pluginsFile: pf,
      instinctsFile: '/no/such/instincts.json' });
    assert.deepStrictEqual(r.instincts, { total: 0, confident: 0, stale: 0, lowConfidence: 0, prunable: 0 });
    for (const k of ['mcp', 'platform', 'companions', 'projectDataDirs', 'ok']) assert.ok(k in r);
  });
  it('populated instinctsFile → health reflects it', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'f-root2-'));
    const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'f-proj2-'));
    const pf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f-pl2-')), 'p.json');
    fs.writeFileSync(pf, JSON.stringify({ plugins: {} }));
    const inf = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'f-in-')), 'mobile-instincts.json');
    fs.writeFileSync(inf, JSON.stringify({ instincts: [
      { id: 'a', confidence: 0.9, lastUsed: new Date().toISOString() },
      { id: 'b', confidence: 0.1, lastUsed: new Date(Date.now() - 120 * 86400000).toISOString() },
    ] }));
    const r = setup.doctorReport({ pluginRoot: root, projectDir: proj, pluginsFile: pf, instinctsFile: inf });
    assert.strictEqual(r.instincts.total, 2);
    assert.strictEqual(r.instincts.prunable, 1);
  });
});
