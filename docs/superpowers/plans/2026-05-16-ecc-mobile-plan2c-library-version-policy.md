# Plan 2C — Library-Version Policy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** State the version-pinning policy once in `gradle-patterns` and convert the owner core-stack skills' inline pinned dependency coordinates to the `libs.*` catalog-accessor idiom that `gradle-patterns` already teaches.

**Architecture:** One policy/annotation prose edit (C1), then five verbatim block replacements (C2–C5) swapping `implementation("group:art:VER")` → `implementation(libs.alias)` (and plugin `id(...) version` → `alias(libs.plugins.x)`). All edits are inside fenced code blocks in skill markdown. No behavioural change; `npm test`/lint stay green.

**Tech Stack:** markdown skills, Gradle Kotlin DSL examples, `npm test`, `npm run lint:json`, `npm run lint:scripts`, `claude plugin validate`.

**Spec:** `docs/superpowers/specs/2026-05-16-ecc-mobile-plan2c-library-version-policy-design.md`

**Verified facts (do not re-derive):** Branch `plan2/content-quality-review` @ `05852e6`. All accessor mappings are 1:1-obvious (no `// coordinate` comments needed — the alias convention is documented by C1). In-scope skills ONLY: gradle-patterns (policy), kmp-networking, sqldelight-patterns, navigation-compose, shared-coroutines, shared-models. Non-stack skills, agents/commands, `(C)` catalog teaching blocks (annotated, not de-versioned), `(P)` prose = OUT (spec §5). No real `libs.versions.toml` exists in this repo (skills are standalone docs).

**Per-task acceptance:** after C2–C5, `grep -nE ':[0-9]+\.[0-9]+["()]' <edited-skill>` over the changed block returns nothing (no inline version literal remains). C1 deliberately KEEPS the annotated illustrative `[versions]` block, so its check is "policy paragraph present + toml fence intact + suite green" instead.

---

### Task 1: C1 — Version policy + illustrative annotation in gradle-patterns

**Files:** Modify `skills/gradle-patterns/SKILL.md`.

- [ ] **Step 1: Insert the policy paragraph between the heading and the toml fence**

Edit `skills/gradle-patterns/SKILL.md`.

`old_string`:
```
## Version Catalog

```toml
# gradle/libs.versions.toml
```

`new_string`:
```
## Version Catalog

> **Version-pinning policy (this plugin's skills):** Skill examples must NOT
> contain inline dependency version literals. They reference the consuming
> project's version catalog via the `libs.*` accessor form shown here (the
> Gradle convention maps `io.ktor:ktor-client-core` to `libs.ktor.client.core`,
> and a plugin id to `libs.plugins.<alias>`). The `[versions]`/`[libraries]`
> blocks below are an **illustrative snapshot** — the version numbers are
> examples, not authoritative pins; resolve actual versions from the consuming
> project's `gradle/libs.versions.toml`.

```toml
# gradle/libs.versions.toml
```

- [ ] **Step 2: Verify fence intact + suite green**

Run:
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'
sed -n '10,26p' skills/gradle-patterns/SKILL.md
```
Expected: `# fail 0`; printed region shows the new blockquote then an intact ```` ```toml ```` fence then `# gradle/libs.versions.toml` and the `[versions]` table unchanged. If the fence is broken or the table changed, STOP and report BLOCKED.

- [ ] **Step 3: Commit**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add skills/gradle-patterns/SKILL.md
git commit -m "docs: state version-pinning policy in gradle-patterns (Plan 2C C1)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: C2 — kmp-networking deps → catalog accessors

**Files:** Modify `skills/kmp-networking/SKILL.md`.

- [ ] **Step 1: Replace the kotlin sourceSets block**

Edit `skills/kmp-networking/SKILL.md`.

`old_string`:
```
kotlin {
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-core:2.3.7")
                implementation("io.ktor:ktor-client-content-negotiation:2.3.7")
                implementation("io.ktor:ktor-serialization-kotlinx-json:2.3.7")
                implementation("io.ktor:ktor-client-logging:2.3.7")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
            }
        }
        val androidMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-okhttp:2.3.7")
            }
        }
        val iosMain by getting {
            dependencies {
                implementation("io.ktor:ktor-client-darwin:2.3.7")
            }
        }
    }
}
```

`new_string`:
```
kotlin {
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(libs.ktor.client.core)
                implementation(libs.ktor.client.content.negotiation)
                implementation(libs.ktor.serialization.kotlinx.json)
                implementation(libs.ktor.client.logging)
                implementation(libs.kotlinx.serialization.json)
            }
        }
        val androidMain by getting {
            dependencies {
                implementation(libs.ktor.client.okhttp)
            }
        }
        val iosMain by getting {
            dependencies {
                implementation(libs.ktor.client.darwin)
            }
        }
    }
}
```

- [ ] **Step 2: Verify**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
grep -nE ':[0-9]+\.[0-9]+["()]' skills/kmp-networking/SKILL.md || echo "no inline pins"
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git status --porcelain
```
Expected: `no inline pins`; `# fail 0`; git status only ` M skills/kmp-networking/SKILL.md`. If a pin remains or another file is dirty, STOP and report BLOCKED.

- [ ] **Step 3: Commit**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add skills/kmp-networking/SKILL.md
git commit -m "docs: kmp-networking deps via version catalog (Plan 2C C2)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: C3 — sqldelight-patterns plugin + deps → catalog

**Files:** Modify `skills/sqldelight-patterns/SKILL.md` (two edits).

- [ ] **Step 1: Plugin block**

Edit. `old_string`:
```
plugins {
    id("app.cash.sqldelight") version "2.0.2"
}
```
`new_string`:
```
plugins {
    alias(libs.plugins.sqldelight)
}
```

- [ ] **Step 2: Dependency lines**

Edit. `old_string`:
```
        commonMain.dependencies {
            implementation("app.cash.sqldelight:coroutines-extensions:2.0.2")
            implementation("app.cash.sqldelight:primitive-adapters:2.0.2")
        }
        androidMain.dependencies {
            implementation("app.cash.sqldelight:android-driver:2.0.2")
        }
        iosMain.dependencies {
            implementation("app.cash.sqldelight:native-driver:2.0.2")
```
`new_string`:
```
        commonMain.dependencies {
            implementation(libs.sqldelight.coroutines.extensions)
            implementation(libs.sqldelight.primitive.adapters)
        }
        androidMain.dependencies {
            implementation(libs.sqldelight.android.driver)
        }
        iosMain.dependencies {
            implementation(libs.sqldelight.native.driver)
```

- [ ] **Step 3: Verify**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
grep -nE ':[0-9]+\.[0-9]+["()]' skills/sqldelight-patterns/SKILL.md || echo "no inline pins"
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git status --porcelain
```
Expected: `no inline pins`; `# fail 0`; git status only ` M skills/sqldelight-patterns/SKILL.md`. Else STOP/BLOCKED.

- [ ] **Step 4: Commit**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add skills/sqldelight-patterns/SKILL.md
git commit -m "docs: sqldelight-patterns deps via version catalog (Plan 2C C3)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: C4 — navigation-compose deps → catalog

**Files:** Modify `skills/navigation-compose/SKILL.md`.

- [ ] **Step 1: Replace the dependencies block**

Edit. `old_string`:
```
dependencies {
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
```
`new_string`:
```
dependencies {
    implementation(libs.androidx.navigation.compose)
    implementation(libs.kotlinx.serialization.json)
}
```

- [ ] **Step 2: Verify**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
grep -nE ':[0-9]+\.[0-9]+["()]' skills/navigation-compose/SKILL.md || echo "no inline pins"
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git status --porcelain
```
Expected: `no inline pins`; `# fail 0`; only ` M skills/navigation-compose/SKILL.md`. Else STOP/BLOCKED.

- [ ] **Step 3: Commit**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add skills/navigation-compose/SKILL.md
git commit -m "docs: navigation-compose deps via version catalog (Plan 2C C4)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: C5 — shared-coroutines + shared-models → catalog

**Files:** Modify `skills/shared-coroutines/SKILL.md` and `skills/shared-models/SKILL.md` (three edits total).

- [ ] **Step 1: shared-coroutines sourceSets block**

Edit `skills/shared-coroutines/SKILL.md`. `old_string`:
```
sourceSets {
    val commonMain by getting {
        dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:1.6.0")
        }
    }
    val androidMain by getting {
        dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
        }
    }
}
```
`new_string`:
```
sourceSets {
    val commonMain by getting {
        dependencies {
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.datetime)
        }
    }
    val androidMain by getting {
        dependencies {
            implementation(libs.kotlinx.coroutines.android)
        }
    }
}
```

- [ ] **Step 2: shared-models dependencies**

Edit `skills/shared-models/SKILL.md`. `old_string`:
```
    val commonMain by getting {
        dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
            implementation("org.jetbrains.kotlinx:kotlinx-datetime:1.6.0")
        }
    }
```
`new_string`:
```
    val commonMain by getting {
        dependencies {
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.datetime)
        }
    }
```

- [ ] **Step 3: shared-models plugin block**

Edit `skills/shared-models/SKILL.md`. `old_string`:
```
plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization") version "1.9.20"
}
```
`new_string`:
```
plugins {
    kotlin("multiplatform")
    alias(libs.plugins.kotlin.serialization)
}
```

- [ ] **Step 4: Verify**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
grep -nE ':[0-9]+\.[0-9]+["()]' skills/shared-coroutines/SKILL.md skills/shared-models/SKILL.md || echo "no inline pins"
npm test 2>&1 | grep -E '# (pass|fail|tests)'
git status --porcelain
```
Expected: `no inline pins`; `# fail 0`; git status only the two SKILL.md files. Else STOP/BLOCKED.

- [ ] **Step 5: Commit**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add skills/shared-coroutines/SKILL.md skills/shared-models/SKILL.md
git commit -m "docs: shared-coroutines/shared-models deps via version catalog (Plan 2C C5)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Finalize — gates + FORK-NOTES

**Files:** Modify `FORK-NOTES.md`.

- [ ] **Step 1: Validation gates**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
npm test 2>&1 | grep -E '# (pass|fail|tests)'   # expect: # fail 0
npm run lint:json; echo "exit=$?"               # expect: exit=0
npm run lint:scripts; echo "exit=$?"            # expect: exit=0
claude plugin validate . 2>&1 | tail -3         # expect: passed (or env note if claude absent — manifest untouched)
```
If a real gate fails, STOP/BLOCKED.

- [ ] **Step 2: Append the Plan 2C bullet to FORK-NOTES.md**

Read `FORK-NOTES.md`. The Plan 2B bullet's last line is the unique anchor: `  Library-version policy is Plan 2C.`

Edit `FORK-NOTES.md`. `old_string`:
```
  Library-version policy is Plan 2C.
```
`new_string`:
```
  Library-version policy is Plan 2C.
- Plan 2C: library-version policy. `gradle-patterns` now states the policy
  (skill examples reference the project's version catalog via `libs.*`; never
  inline pins; its `[versions]` block is an illustrative snapshot). Inline
  pinned coordinates were converted to `libs.*` accessors in the owner
  core-stack skills: `kmp-networking` (Ktor), `sqldelight-patterns`,
  `navigation-compose`, `shared-coroutines`, `shared-models`. Non-stack skills,
  all agents/commands, the pedagogical catalog blocks, and prose mentions were
  left as-is (out of scope by design). `npm test` green.
```
If the anchor is not found verbatim, STOP/BLOCKED with the actual FORK-NOTES lines around the Plan 2B bullet.

- [ ] **Step 3: Commit**
```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add FORK-NOTES.md
git commit -m "docs: record Plan 2C resolution in FORK-NOTES

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

- [ ] **Step 4: Controller handoff (do NOT push/merge)** — report final state; the controller presents the consolidated 2A/2B/2C report + single merge/push decision to the user.

---

## Self-Review

**Spec coverage:** policy+annotation §3 C1→Task1; C2→Task2; C3→Task3; C4→Task4; C5 (shared-coroutines+shared-models)→Task5; validation/delivery §4→Task6; §5 out-of-scope honored (no non-stack skill, no agent, (C) annotated not de-versioned, no real catalog file/CI). ✅

**Placeholder scan:** No TBD/TODO; every edit verbatim old/new; commands have expected output; acceptance grep defined. ✅

**Consistency:** all `old_string`s are the recon-extracted verbatim text at `05852e6`; accessor names use the documented `libs.<group-ish>.<artifact>` convention consistently; C1 keeps (annotates) the (C) block so its grep deliberately differs (noted). FORK-NOTES anchor is the verified Plan 2B bullet tail. ✅

No gaps.
