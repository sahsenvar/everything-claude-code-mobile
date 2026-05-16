# Plan 2B — Stack-Skill Content Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the stack-misalignment/content defects in stack-relevant skills+bound agents that degrade agent code-generation for the owner's stack (Koin/Ktor/MVI/SQLDelight, KMP+Android+SwiftUI) and resolve the two Plan 2A carry-forward findings.

**Architecture:** One behavioural change (C1: harden the skills auto-discovery test, TDD with a self-contained RED proof), then six small verbatim doc/example edits (C2–C6b). Every task ends with `npm test` green and a commit. No manifest/hook/version change.

**Tech Stack:** Node `node:test`/`node:assert`, markdown skill/agent files, `npm test`, `npm run lint:json`, `npm run lint:scripts`, `claude plugin validate`.

**Spec:** `docs/superpowers/specs/2026-05-16-ecc-mobile-plan2b-stack-skill-content-review-design.md`

**Plan-author descope (documented):** Spec bullet **C6a** (rewrite `kmp-networking` `object : Logger` to a SAM lambda `Logger { … }`) is **dropped**. Ktor's `io.ktor.client.plugins.logging.Logger` is a plain `interface`, not a Kotlin `fun interface`, so `Logger { … }` does **not** compile. The existing `object : Logger { override fun log(...) }` is the correct idiom; changing it would inject the exact kind of defect this plan removes. This is the lowest-value, only-risky bullet — descoped with rationale per writing-plans self-review. All other components proceed.

**Verified facts (do not re-derive):** Branch `plan2/content-quality-review` @ `c93b533`. `tests/unit/feature-builder.test.js` imports `fs`, `path`, `assert`; constants `SKILLS_DIR`/`COMMANDS_DIR` defined; `parseFrontmatter` returns `{ meta }`. 46/46 `skills/*` have `SKILL.md` today. `mobile-pattern-extractor` frontmatter `tools` MUST stay `["Read", "Grep", "Glob", "Bash"]` — instinct persistence is delegated to the PostToolUse hook chain (proven); adding `Write` is wrong.

---

### Task 1: C1 — Harden the skills auto-discovery test

**Files:** Modify `tests/unit/feature-builder.test.js` (the `should auto-discover skills and commands directories` it-block).

- [ ] **Step 1: Replace the it-block**

Edit `tests/unit/feature-builder.test.js`.

`old_string`:

```javascript
    it('should auto-discover skills and commands directories', () => {
        const skillFiles = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => path.join(SKILLS_DIR, d.name, 'SKILL.md'))
            .filter(p => fs.existsSync(p));
        assert.ok(skillFiles.length > 0, 'skills/ should contain at least one SKILL.md');
        for (const p of skillFiles) {
            const { meta } = parseFrontmatter(fs.readFileSync(p, 'utf8'));
            assert.ok(meta, `${p} should have parseable frontmatter`);
            assert.ok(meta.name, `${p} should have a name field`);
            assert.ok(meta.description, `${p} should have a description field`);
        }

        const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
        assert.ok(commandFiles.length > 0, 'commands/ should contain at least one .md command');
    });
```

`new_string`:

```javascript
    it('should auto-discover skills and commands directories', () => {
        const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);
        const missingSkillMd = skillDirs.filter(
            name => !fs.existsSync(path.join(SKILLS_DIR, name, 'SKILL.md'))
        );
        assert.strictEqual(
            missingSkillMd.length,
            0,
            `Every skills/ subdirectory must contain a SKILL.md; missing in: ${missingSkillMd.join(', ')}`
        );

        const skillFiles = skillDirs
            .map(name => path.join(SKILLS_DIR, name, 'SKILL.md'))
            .filter(p => fs.existsSync(p));
        assert.ok(skillFiles.length > 0, 'skills/ should contain at least one SKILL.md');
        for (const p of skillFiles) {
            const { meta } = parseFrontmatter(fs.readFileSync(p, 'utf8'));
            assert.ok(meta, `${p} should have parseable frontmatter`);
            assert.ok(meta.name, `${p} should have a name field`);
            assert.ok(meta.description, `${p} should have a description field`);
        }

        const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.md'));
        assert.ok(commandFiles.length > 0, 'commands/ should contain at least one .md command');
    });
```

- [ ] **Step 2: Verify GREEN now**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/feature-builder.test.js 2>&1 | grep -E '# (pass|fail|tests)'`
Expected: `# fail 0` (46/46 skill dirs have SKILL.md).

- [ ] **Step 3: Prove the new guard REDs on a missing SKILL.md (self-contained, cleaned up)**

Run:
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
mkdir skills/__tmp_guard_check__
node --test tests/unit/feature-builder.test.js 2>&1 | grep -E 'Every skills/ subdirectory|# (pass|fail|tests)' | head
rmdir skills/__tmp_guard_check__
node --test tests/unit/feature-builder.test.js 2>&1 | grep -E '# (pass|fail|tests)'
```
Expected: first run shows the failure message `Every skills/ subdirectory must contain a SKILL.md; missing in: __tmp_guard_check__` and `# fail 1`; after `rmdir`, the final run shows `# fail 0`. If the temp dir is not removed or the final run is not `# fail 0`, STOP and report BLOCKED. (Confirm `git status --porcelain` shows ONLY the test file modified — no stray dir.)

- [ ] **Step 4: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add tests/unit/feature-builder.test.js
git commit -m "test: assert every skills/ subdir has a SKILL.md (Plan 2B C1)

Converts the silent-skip in 'should auto-discover skills and commands
directories' into a hard failure (the structural guard Plan 2A review
requested). Green today (46/46); REDs if any skills/ dir lacks SKILL.md.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: C2 — Document instinct-persistence delegation (no frontmatter change)

**Files:** Modify `agents/mobile-pattern-extractor.md`. Do NOT change frontmatter / `tools`.

- [ ] **Step 1: Insert the delegation note**

Edit `agents/mobile-pattern-extractor.md`.

`old_string`:

```
### Step 4: Store as Instinct

Create instinct entries:
```

`new_string`:

```
### Step 4: Store as Instinct

> **Persistence is automatic and delegated — this agent does not write files.**
> Instinct JSON is persisted by the PostToolUse hook chain
> (`scripts/hooks/post-tool-use.js` → `scripts/hooks/extract-pattern.js` →
> `scripts/lib/instincts.js` → `.omc/instincts/mobile-instincts.json`).
> This agent is read-only by design (`tools: Read, Grep, Glob, Bash`); it only
> surfaces the pattern shapes below. Do NOT add a Write tool — it would
> duplicate/conflict with the hook system.

The instinct entries this agent surfaces look like:
```

- [ ] **Step 2: Verify suite green + frontmatter untouched**

Run:
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'
sed -n '1,6p' agents/mobile-pattern-extractor.md
```
Expected: `# fail 0`; the printed frontmatter still shows `tools: ["Read", "Grep", "Glob", "Bash"]` (unchanged). If `tools` changed, STOP — revert and report BLOCKED.

- [ ] **Step 3: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add agents/mobile-pattern-extractor.md
git commit -m "docs: clarify pattern-extractor is read-only, persistence via hooks (Plan 2B C2)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: C3 — feature-builder: commit to Ktor + Koin (Android row)

**Files:** Modify `skills/feature-builder/SKILL.md` (the per-platform tech table, Android row).

- [ ] **Step 1: Disambiguate the Android row**

Edit `skills/feature-builder/SKILL.md`.

`old_string`:

```
| Android | Kotlin data classes | Retrofit/Ktor | Compose + ViewModel | Room/DataStore | Koin/Hilt + Navigation |
```

`new_string`:

```
| Android | Kotlin data classes | Ktor | Compose + ViewModel | Room/DataStore | Koin + Navigation |
```

(Networking → Ktor only; DI → Koin only. `Room/DataStore` left as-is — Android-native persistence is out of C3 scope; the KMP row already specifies SQLDelight.)

- [ ] **Step 2: Verify no other Retrofit/Hilt co-equal mention remains**

Run: `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && grep -nE 'Retrofit|Hilt' skills/feature-builder/SKILL.md || echo "none"`
Expected: `none` (the JSON example at ~line 522 already uses `"diFramework": "Koin"`/`"networkClient": "Ktor"`; the DI/Network rows at ~line 432 already say Koin/Ktor — confirm grep returns `none`). If any Retrofit/Hilt remains, STOP and report it with line numbers (do NOT edit beyond the table row without escalating — spec C3 is scoped to the Android row).

- [ ] **Step 3: Verify suite green + commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git add skills/feature-builder/SKILL.md
git commit -m "docs: feature-builder commits to Ktor+Koin on Android (Plan 2B C3)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
Expected: `# fail 0` before commit.

---

### Task 4: C4 — koin-patterns: add KMP cross-reference notes

**Files:** Modify `skills/koin-patterns/SKILL.md` (two example sites).

- [ ] **Step 1: Annotate the Room example**

Edit `skills/koin-patterns/SKILL.md`.

`old_string`:

```
    single<AppDatabase> { Room.databaseBuilder(...).build() }
```

`new_string`:

```
    single<AppDatabase> { Room.databaseBuilder(...).build() } // Android-only; for KMP/shared code this project uses SQLDelight — see the sqldelight-patterns skill
```

- [ ] **Step 2: Annotate the HttpClient(OkHttp) example**

Edit `skills/koin-patterns/SKILL.md`.

`old_string`:

```
val networkModule = module {
    single<HttpClient> {
        HttpClient(OkHttp) {
```

`new_string`:

```
// Android-only example. For KMP/shared networking this project uses Ktor with
// platform engines (OkHttp on Android, Darwin on iOS) — see the kmp-networking skill.
val networkModule = module {
    single<HttpClient> {
        HttpClient(OkHttp) {
```

- [ ] **Step 3: Verify suite green + commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git add skills/koin-patterns/SKILL.md
git commit -m "docs: koin-patterns notes KMP uses SQLDelight/Ktor (Plan 2B C4)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
Expected: `# fail 0` before commit.

---

### Task 5: C5 — offline-first: name SQLDelight as shared persistence

**Files:** Modify `skills/offline-first/SKILL.md`.

- [ ] **Step 1: Insert the SQLDelight statement after the title**

Edit `skills/offline-first/SKILL.md`.

`old_string`:

```
# Offline-First Architecture Patterns

## NetworkBoundResource Pattern
```

`new_string`:

```
# Offline-First Architecture Patterns

> **Shared persistence in this project = SQLDelight.** The `dao` in the examples
> below is backed by SQLDelight (KMP shared `commonMain`), not Room or a generic
> store — see the `sqldelight-patterns` skill for the concrete setup. Keep
> offline-first cache/sync logic on SQLDelight for shared code.

## NetworkBoundResource Pattern
```

- [ ] **Step 2: Verify suite green + commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git add skills/offline-first/SKILL.md
git commit -m "docs: offline-first names SQLDelight for shared code (Plan 2B C5)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
Expected: `# fail 0` before commit.

---

### Task 6: C6b — coroutines-patterns ↔ shared-coroutines cross-reference

**Files:** Modify `skills/coroutines-patterns/SKILL.md` and `skills/shared-coroutines/SKILL.md`.

- [ ] **Step 1: Add the See-also note to coroutines-patterns**

Edit `skills/coroutines-patterns/SKILL.md`.

`old_string`:

```
# Coroutines Patterns
```

`new_string`:

```
# Coroutines Patterns

> **Scope:** Android-focused coroutine/Flow patterns. For Kotlin Multiplatform
> shared code (platform dispatchers, shared scopes, Flow sharing) use the
> `shared-coroutines` skill instead.
```

- [ ] **Step 2: Add the See-also note to shared-coroutines**

Edit `skills/shared-coroutines/SKILL.md`.

`old_string`:

```
# Shared Coroutines for KMP
```

`new_string`:

```
# Shared Coroutines for KMP

> **Scope:** KMP-shared coroutine configuration. For Android-only coroutine/Flow
> usage patterns see the `coroutines-patterns` skill.
```

- [ ] **Step 3: Verify suite green + commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git add skills/coroutines-patterns/SKILL.md skills/shared-coroutines/SKILL.md
git commit -m "docs: cross-reference coroutines-patterns and shared-coroutines (Plan 2B C6b)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```
Expected: `# fail 0` before commit.

---

### Task 7: Finalize — validation gates + FORK-NOTES

**Files:** Modify `FORK-NOTES.md`.

- [ ] **Step 1: Run all validation gates**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'   # expect: # fail 0
npm run lint:json; echo "exit=$?"               # expect: exit=0
npm run lint:scripts; echo "exit=$?"            # expect: exit=0
claude plugin validate . 2>&1 | tail -3         # expect: validation passed (manifest untouched)
```
If any genuine gate fails, STOP and report BLOCKED. (`claude` absent → environmental note, not a failure; manifest was never touched in 2B.)

- [ ] **Step 2: Add the Plan 2B bullet to FORK-NOTES.md**

First Read `FORK-NOTES.md` to confirm the Plan 2A bullet's exact last line. It ends with this line (the unique anchor):

`  was already valid — an earlier note claiming a YAML parse error was wrong.)`

Edit `FORK-NOTES.md`. `old_string`:

```
  was already valid — an earlier note claiming a YAML parse error was wrong.)
```

`new_string`:

```
  was already valid — an earlier note claiming a YAML parse error was wrong.)
- Plan 2B: targeted stack-skill content review. Resolved both Plan 2A
  carry-forwards — the skills auto-discovery test now hard-fails if any
  `skills/*` dir lacks `SKILL.md` (was a silent skip), and
  `agents/mobile-pattern-extractor.md` now documents that it is read-only by
  design (instinct persistence is delegated to the PostToolUse hook chain;
  adding `Write` would be wrong — investigation-confirmed). Plus stack
  alignment: `feature-builder` commits to Ktor+Koin on Android (was
  Retrofit/Ktor, Koin/Hilt); `koin-patterns` notes KMP uses SQLDelight/Ktor;
  `offline-first` names SQLDelight for shared code; `coroutines-patterns` and
  `shared-coroutines` cross-reference (Android vs KMP). Spec bullet C6a
  (Ktor `Logger` SAM lambda) was descoped: Ktor's `Logger` is not a Kotlin
  `fun interface`, so `Logger { … }` would not compile. `npm test` green.
  Library-version policy is Plan 2C.
```

If the anchor line is not found verbatim, STOP and report BLOCKED with the actual FORK-NOTES lines around the Plan 2A bullet.

- [ ] **Step 3: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add FORK-NOTES.md
git commit -m "docs: record Plan 2B resolution in FORK-NOTES

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 4: Controller handoff (do NOT push)**

Plan 2B commits sit on `plan2/content-quality-review`. Do NOT merge or push to `main` — the controller surfaces the 2B+2C merge/push decision to the user in the final report (Plan 2A push consent does NOT extend here). Report final state: branch, commit count, `npm test` green.

---

## Self-Review

**Spec coverage:** C1→Task1; C2→Task2; C3→Task3; C4→Task4; C5→Task5; C6b→Task6; C6a→explicitly descoped with rationale (header + Task7 FORK-NOTES); validation gates §4→Task7 Step1; FORK-NOTES→Task7 Step2; merge/push deferral §4→Task7 Step4. Version pins (§2 inventory) → Plan 2C, not a 2B task (correct). ✅

**Placeholder scan:** No TBD/TODO. Every edit step shows verbatim old_string/new_string. Commands have expected output. No "similar to". ✅

**Type/anchor consistency:** Task 1 reuses `skillDirs` consistently; `SKILLS_DIR`/`COMMANDS_DIR`/`parseFrontmatter` match the file. All `old_string`s are the verbatim snippets extracted from the current files on `c93b533`. Task 7 anchor is the verified last line of the amended Plan 2A FORK-NOTES bullet (`ed16e02`). ✅

No gaps.
