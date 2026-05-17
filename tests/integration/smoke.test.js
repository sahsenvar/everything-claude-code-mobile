const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const REPO = path.join(__dirname, '..', '..');
const FIX = path.join(REPO, 'examples', 'android-smoke');
const { detectState } = require('../../scripts/lib/setup');

describe('Feature A — committed fixture', () => {
  it('examples/android-smoke exists and is android-detected', () => {
    assert.ok(fs.existsSync(FIX), 'fixture dir must exist');
    for (const f of ['settings.gradle.kts', 'build.gradle.kts', 'app/build.gradle.kts',
      'app/src/main/AndroidManifest.xml',
      'app/src/main/java/com/example/smoke/HomeViewModel.kt',
      'app/src/main/java/com/example/smoke/HomeScreen.kt', 'README.md']) {
      assert.ok(fs.existsSync(path.join(FIX, f)), `missing ${f}`);
    }
    assert.strictEqual(
      detectState({ pluginRoot: REPO, projectDir: FIX }).platform, 'android');
  });
});
