# Feature A — E2E Smoke Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Add a deterministic E2E smoke layer (committed Android fixture + integration test driving the JS runtime + bilingual manual checklist) without breaking the 420-test suite.

**Architecture:** Committed `examples/android-smoke/` real fixture; `tests/integration/smoke.test.js` (node:test) drives hooks/doctor/MCP against a temp scaffold via existing `tests/helpers/test-utils.js`; `docs/smoke-checklist.md` (+tr).

**Tech Stack:** Node `node:test`/`node:assert`, child_process for hook/MCP spawn, existing helpers.

**Branch:** `feature/roadmap-abcd` (do NOT push; consent at the very end).

**Verified invariants:** `npm test` glob includes `tests/integration/*.test.js`; `pretest`=`node --check scripts/hooks/*.js scripts/lib/*.js` (no new scripts/*.js). `tests/helpers/test-utils.js` exports `createMockAndroidProject(dir)`, `cleanupDir(dir)`, `writeFiles(base,map)`. Hook invocation pattern (from `missing-hooks.test.js`): `execFileSync('node',[hookPath],{input: JSON.stringify(event), encoding:'utf8', timeout:15000, env:{...process.env, CLAUDE_PROJECT_DIR, CLAUDE_PLUGIN_ROOT}})`. `setup.js` exports `doctorReport({pluginRoot,projectDir})` & `detectState`. MCP servers `mcp-servers/<n>/index.js` are stdio JSON-RPC, guarded by `require.main===module`, node_modules already present. No agents added → 27-agent test untouched.

---

### Task 1: Committed Android fixture `examples/android-smoke/`

**Files:** Create `examples/android-smoke/{settings.gradle.kts,build.gradle.kts,app/build.gradle.kts,app/src/main/AndroidManifest.xml,app/src/main/java/com/example/smoke/HomeViewModel.kt,app/src/main/java/com/example/smoke/HomeScreen.kt,README.md}`; Test: `tests/integration/smoke.test.js`.

- [ ] **Step 1: Write the failing test** — create `tests/integration/smoke.test.js`:

```js
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
```

- [ ] **Step 2: Run, verify fail** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/integration/smoke.test.js` → FAIL (fixture missing).

- [ ] **Step 3: Create the fixture files** exactly:

`examples/android-smoke/settings.gradle.kts`:
```kotlin
rootProject.name = "android-smoke"
include(":app")
```

`examples/android-smoke/build.gradle.kts`:
```kotlin
// ECC smoke fixture — minimal Android root build script (not a shipped app).
plugins {
    id("com.android.application") version "8.5.0" apply false
    id("org.jetbrains.kotlin.android") version "2.0.0" apply false
}
```

`examples/android-smoke/app/build.gradle.kts`:
```kotlin
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.example.smoke"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.example.smoke"
        minSdk = 24
        targetSdk = 34
    }
}
```

`examples/android-smoke/app/src/main/AndroidManifest.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:label="android-smoke" />
</manifest>
```

`examples/android-smoke/app/src/main/java/com/example/smoke/HomeViewModel.kt`:
```kotlin
package com.example.smoke

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class HomeState(val count: Int = 0)

sealed interface HomeIntent {
    data object Increment : HomeIntent
}

class HomeViewModel : ViewModel() {
    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state.asStateFlow()

    fun onIntent(intent: HomeIntent) {
        when (intent) {
            HomeIntent.Increment -> _state.value = _state.value.copy(count = _state.value.count + 1)
        }
    }
}
```

`examples/android-smoke/app/src/main/java/com/example/smoke/HomeScreen.kt`:
```kotlin
package com.example.smoke

import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue

@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val state by viewModel.state.collectAsState()
    Button(onClick = { viewModel.onIntent(HomeIntent.Increment) }) {
        Text("Count: ${state.count}")
    }
}
```

`examples/android-smoke/README.md`:
```markdown
# android-smoke (test fixture)

Minimal real Android/Gradle project used by the ECC smoke layer
(`tests/integration/smoke.test.js`) and the manual smoke checklist
(`docs/smoke-checklist.md`). **Not a shipped application** — it exists so the
plugin's JS runtime (hooks, doctor, MCP servers) can be exercised against a
real project structure. No gradle wrapper binary is included (the JS surface
only reads files).
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/integration/smoke.test.js` → the fixture test PASSES.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add examples/android-smoke tests/integration/smoke.test.js
git -c commit.gpgsign=false commit -m "test(smoke): committed minimal Android fixture + contract test

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: JS-runtime smoke (hooks + doctor + MCP)

**Files:** Modify `tests/integration/smoke.test.js` (append describes).

- [ ] **Step 1: Append the failing tests** to `tests/integration/smoke.test.js`:

```js
const { execFileSync, spawnSync } = require('child_process');
const os = require('os');
const { createMockAndroidProject, cleanupDir } = require('../helpers/test-utils');
const { doctorReport } = require('../../scripts/lib/setup');

const HOOKS = path.join(REPO, 'scripts', 'hooks');
const SERVERS = ['mobile-memory', 'ios-memory', 'kmp-context'];

function runHook(name, event, projectDir) {
  return execFileSync('node', [path.join(HOOKS, name)], {
    input: JSON.stringify(event || {}),
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir, CLAUDE_PLUGIN_ROOT: REPO },
  });
}

describe('Feature A — hook runtime smoke', () => {
  const proj = path.join(os.tmpdir(), 'ecc-smoke-' + process.pid);
  it('setup: scaffold a temp android project', () => {
    createMockAndroidProject(proj);
    assert.ok(fs.existsSync(proj));
  });

  it('post-tool-use.js (Write ViewModel) exits 0 + emits TDD reminder', () => {
    const out = runHook('post-tool-use.js', {
      tool_name: 'Write',
      tool_input: { file_path: path.join(proj, 'app/src/main/java/com/example/ui/HomeViewModel.kt') },
    }, proj);
    assert.match(out, /TDD|test/i);
  });

  it('track-build.js (Bash gradle) writes build-history.json', () => {
    runHook('track-build.js', {
      tool_name: 'Bash', tool_input: { command: './gradlew assembleDebug' },
    }, proj);
    const f = path.join(proj, '.claude', 'instincts', 'build-history.json');
    assert.ok(fs.existsSync(f), 'build-history.json created');
    const h = JSON.parse(fs.readFileSync(f, 'utf8'));
    assert.ok(Array.isArray(h.events) && h.events.length >= 1);
  });

  it('check-setup.js (SessionStart) never throws, exits 0', () => {
    assert.doesNotThrow(() => runHook('check-setup.js', {}, proj));
  });

  it('pre-compact.js (PreCompact) writes a checkpoint', () => {
    runHook('pre-compact.js', {}, proj);
    const cp = path.join(proj, '.claude', 'checkpoints');
    assert.ok(fs.existsSync(cp) && fs.readdirSync(cp).length >= 1, 'checkpoint written');
  });

  it('teardown', () => { cleanupDir(proj); assert.ok(!fs.existsSync(proj)); });
});

describe('Feature A — doctorReport runtime', () => {
  it('reports android + expected shape against the fixture', () => {
    const r = doctorReport({ pluginRoot: REPO, projectDir: FIX });
    assert.strictEqual(r.platform, 'android');
    assert.ok(r.projectDataDirs.includes('.claude/mobile-memory'));
    for (const k of ['mcp', 'companions', 'ok', 'sessionStartHookRegistered']) {
      assert.ok(k in r, `report missing ${k}`);
    }
  });
});

describe('Feature A — MCP server smoke (spawn + initialize)', () => {
  for (const s of SERVERS) {
    it(`${s} responds to JSON-RPC initialize (or skips if no node_modules)`, () => {
      const dir = path.join(REPO, 'mcp-servers', s);
      if (!fs.existsSync(path.join(dir, 'node_modules'))) {
        // contract path: file requires/loads without throwing at parse
        const chk = spawnSync('node', ['--check', path.join(dir, 'index.js')]);
        assert.strictEqual(chk.status, 0, `${s}/index.js must be valid JS`);
        return;
      }
      const req = JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '1.0.0' } },
      }) + '\n';
      const res = spawnSync('node', [path.join(dir, 'index.js')], {
        input: req, encoding: 'utf8', timeout: 5000,
      });
      const stdout = res.stdout || '';
      const line = stdout.split('\n').find((l) => l.trim().startsWith('{'));
      assert.ok(line, `${s}: expected a JSON-RPC response on stdout`);
      const msg = JSON.parse(line);
      assert.ok(msg.result && msg.result.capabilities, `${s}: initialize result.capabilities`);
    });
  }
});

describe('Feature A — install-mcp-deps shim', () => {
  it('require exposes installMcpDeps and does not spawn', () => {
    const m = require('../../scripts/install-mcp-deps.js');
    assert.strictEqual(typeof m.installMcpDeps, 'function');
  });
});
```

- [ ] **Step 2: Run, verify** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/integration/smoke.test.js 2>&1 | tail -6`. Expected: all green. If the MCP `initialize` handshake shape differs (no `result.capabilities` on stdout), the implementer must inspect one server's actual `initialize` response (run it manually, capture stdout) and adjust the assertion to match the REAL response shape — the test must assert the server's actual successful initialize, not a guessed shape. Document the real shape in the test as a comment. Do not weaken to a trivial assertion.

- [ ] **Step 3: Determinism check** — run twice: `node --test tests/integration/smoke.test.js >/tmp/s1 2>&1; node --test tests/integration/smoke.test.js >/tmp/s2 2>&1; grep -c "pass" /tmp/s1 /tmp/s2`. Both runs identical pass counts, no leftover temp dirs (`ls /tmp | grep -c ecc-smoke- || true` → 0 after).

- [ ] **Step 4: Full suite** — `npm test 2>&1 | tail -4` → all green (prior 420 + new smoke tests; pretest lint passes).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add tests/integration/smoke.test.js
git -c commit.gpgsign=false commit -m "test(smoke): JS-runtime E2E — hooks, doctorReport, MCP initialize

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Manual smoke checklist doc (EN + TR)

**Files:** Create `docs/smoke-checklist.md`, `docs/tr/smoke-checklist.md`.

- [ ] **Step 1: Create `docs/smoke-checklist.md`** exactly:

```markdown
# Smoke checklist (pre-release)

Manual checks before tagging a release. The automated layer
(`tests/integration/smoke.test.js`) covers the JS runtime; this covers what
only a human can verify.

- [ ] `npm test` green (incl. `tests/integration/smoke.test.js`); `npm run verify` ok.
- [ ] Fresh install in Claude Code: `/plugin install …` then `/ecc-setup` → all 3 MCP servers install, `/ecc-doctor` shows green.
- [ ] Open `examples/android-smoke/` as a project: `/ecc-doctor` reports `platform: android`.
- [ ] Trigger a hook in a real session (edit a `*ViewModel.kt`): the TDD reminder appears; the session is not disrupted.
- [ ] `/feature-build "tiny change"` reaches the plan phase without error (spot check, not full run).
- [ ] All agents/commands list in Claude Code (no discovery breakage); `docs/COMMANDS.md` count matches `commands/`.
- [ ] `/plugin uninstall` leaves no global-config residue.
```

- [ ] **Step 2: Create `docs/tr/smoke-checklist.md`** exactly:

```markdown
# Smoke kontrol listesi (yayın öncesi)

Sürüm etiketlemeden önceki elle kontroller. Otomatik katman
(`tests/integration/smoke.test.js`) JS çalışma yüzeyini kapsar; bu liste
yalnızca bir insanın doğrulayabileceğini kapsar.

- [ ] `npm test` yeşil (`tests/integration/smoke.test.js` dahil); `npm run verify` sorunsuz.
- [ ] Claude Code'da temiz kurulum: `/plugin install …` sonra `/ecc-setup` → 3 MCP sunucusu kurulur, `/ecc-doctor` yeşil.
- [ ] `examples/android-smoke/` projesini aç: `/ecc-doctor` `platform: android` raporlar.
- [ ] Gerçek oturumda bir hook tetikle (`*ViewModel.kt` düzenle): TDD hatırlatması çıkar; oturum bozulmaz.
- [ ] `/feature-build "küçük değişiklik"` plan fazına hatasız ulaşır (nokta kontrol, tam koşu değil).
- [ ] Tüm agent/komutlar Claude Code'da listelenir (keşif bozulmaz); `docs/COMMANDS.md` sayısı `commands/` ile uyumlu.
- [ ] `/plugin uninstall` global-config'te kalıntı bırakmaz.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add docs/smoke-checklist.md docs/tr/smoke-checklist.md
git -c commit.gpgsign=false commit -m "docs: bilingual pre-release smoke checklist

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review
- **Spec coverage:** committed Android fixture → T1; JS-runtime smoke (hooks/doctor/MCP/shim/fixture-contract) → T1+T2; bilingual checklist → T3. No gaps.
- **Placeholders:** none — all file contents and commands literal. The one conditional (MCP initialize shape) has explicit instruction to verify against the real server response, not a placeholder.
- **Consistency:** `REPO`/`FIX`/`runHook`/`SERVERS` defined in T1/T2 and used consistently; helper names (`createMockAndroidProject`,`cleanupDir`) match recon; `doctorReport` shape keys match the shipped setup.js.
- **Safety:** additive only; no agents/hooks.json/.mcp.json/plugin changes → 27-agent + structural tests untouched; MCP smoke skips-not-fails without node_modules; temp dirs cleaned.

