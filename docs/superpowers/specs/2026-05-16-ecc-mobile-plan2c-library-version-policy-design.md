# Design: Plan 2C — Library-Version Policy

**Date:** 2026-05-16
**Status:** Approved-by-delegation (user waived interactive approval; autonomous execution, single final report; no `main` push without explicit consent)
**Repo:** `sahsenvar/everything-claude-code-mobile` (fork of `ahmed3elshaer/everything-claude-code-mobile`)
**Local:** `~/Developer/everything-claude-code-mobile`, branch `plan2/content-quality-review` (Plan 2A merged to `main`; Plan 2B committed here)
**Relationship:** Final cycle of the Plan 2 decomposition. 2A (mechanical — merged to `main`), 2B (content review — done, this branch), **2C** (this — version policy).

## 1. Goal

Stop the stack-relevant skills from teaching agents to hardcode rot-prone library version literals. Establish ONE documented version-pinning policy (in `gradle-patterns`, the canonical build skill, which already teaches version catalogs) and apply it to the **owner's core-stack** skill examples by converting inline pinned coordinates to the version-catalog accessor idiom that `gradle-patterns` itself advocates. Success = no inline version literals remain in the in-scope skills' dependency examples, the policy is stated once and cross-referenced, `npm test`/lint stay green, and the change set is bounded and consistent.

## 2. Context & Constraints

- **Reconnaissance (read-only sweep, 2026-05-16) established** ~38 `(D)` dependency-coordinate-with-inline-version occurrences across ~13 skills, plus more in agents/commands, plus `(C)` pedagogical version-catalog content (the `[versions]` / `[libraries]` blocks in `gradle-patterns`) and `(P)` harmless prose mentions. `gradle-patterns/SKILL.md` **already advocates** version catalogs (its first section is "Version Catalog"; it uses `libs.bundles.*` / `libs.koin.compose` etc. throughout). So the inconsistency is: the canonical build skill says "never hardcode inline; use the catalog," yet sibling skills hardcode.
- **There is no real `gradle/libs.versions.toml` in this plugin repo** — skills are standalone teaching documents an agent reads while working in the *user's* KMP project (which does use catalogs per `gradle-patterns`). The fix is therefore a documentation/idiom fix in the skill examples, not a build refactor.
- **Owner's core stack** (the only skills in scope): Ktor (`kmp-networking`), SQLDelight (`sqldelight-patterns`), Jetpack Navigation Compose (`navigation-compose`), KMP coroutines (`shared-coroutines`), KMP shared models / kotlinx-serialization (`shared-models`). These are the skills the owner's Koin/Ktor/MVI/SQLDelight + KMP stack actually loads.
- **Scope decision (delegated authority; YAGNI; consistent with Plan 2B's owner-stack scoping):** Plan 2C touches ONLY the 5 in-scope skills' dependency examples plus a single normative policy subsection + annotation in `gradle-patterns/SKILL.md`. It does **not** rewrite the ~8 non-stack skills' pins (push-notifications, image-loading, pagination-patterns, localization-patterns, kmp-navigation, m3-expressive), does **not** touch any agent/command (out of scope per the 2B precedent — a sweeping agent rewrite is unwarranted), does **not** de-version the `(C)` pedagogical catalog blocks (they are the teaching content; they get an "illustrative snapshot" annotation instead), and ignores `(P)` prose. Nothing is pushed to `main` without explicit consent.

## 3. Policy (the normative decision) & Components

**Policy:** *Skill dependency examples must not contain inline version literals. They reference the project's version catalog using the `libs.*` accessor form taught by `gradle-patterns`. The `[versions]` table shown in `gradle-patterns` is an illustrative snapshot, not an authoritative pin set — agents resolve actual versions from the consuming project's `libs.versions.toml`.*

### C1 — Policy statement + (C)-block annotation in `gradle-patterns/SKILL.md`
Add a short normative subsection (a few sentences) stating the policy above, placed with the existing Version Catalog section. Annotate the pedagogical `[versions]` block (and the `[libraries]` testing entries) with a one-line "illustrative snapshot — versions are examples, verify current; do not copy as pins" note. The `(C)` content itself is **kept** (it teaches what a catalog looks like) — only annotated.

### C2 — `kmp-networking/SKILL.md`: Ktor + kotlinx-serialization block → catalog accessors
Convert the `commonMain`/`androidMain`/`iosMain` `implementation("io.ktor:...:2.3.7")` / `implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")` lines to the `libs.*` accessor form (e.g. `implementation(libs.ktor.client.core)`), preserving the per-source-set structure. Where an accessor name is not a 1:1-obvious mapping to its Maven coordinate, retain the coordinate in a trailing `// io.ktor:ktor-client-core` comment so the agent can populate `libs.versions.toml`.

### C3 — `sqldelight-patterns/SKILL.md`: plugin id + driver/extension deps → catalog
Convert `id("app.cash.sqldelight") version "2.0.2"` to the catalog plugin-alias form (`alias(libs.plugins.sqldelight)`) and the `app.cash.sqldelight:*` `implementation(...)` coordinates to `libs.*` accessors, same coordinate-comment rule as C2.

### C4 — `navigation-compose/SKILL.md`: navigation-compose + serialization → catalog
Convert `androidx.navigation:navigation-compose:2.8.5` and `org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3` `implementation(...)` lines to `libs.*` accessors (coordinate comment where non-obvious).

### C5 — `shared-coroutines/SKILL.md` + `shared-models/SKILL.md`: kotlinx deps + plugin → catalog
`shared-coroutines`: `kotlinx-coroutines-core`/`-android`/`kotlinx-datetime` lines → accessors. `shared-models`: `kotlinx-serialization-json`/`kotlinx-datetime` lines and `kotlin("plugin.serialization") version "1.9.20"` → catalog accessor / `alias(libs.plugins.kotlin.serialization)`. Coordinate comment where non-obvious.

## 4. Sequencing, Validation, Delivery

- **Order:** C1 (policy first — it is the reference the other tasks point to) → C2 → C3 → C4 → C5. Each is an independent skill-doc edit; the plan sequences them as discrete tasks.
- **No behavioural test exists for skill prose.** Validation per task = `npm test` stays `# fail 0` (the suite incl. Plan 2A/2B guards), `npm run lint:json` / `lint:scripts` exit 0, `claude plugin validate` still passes (manifest untouched), plus SDD per-task verification (verbatim match + scope + no broken code-fence / no remaining inline version literal in the edited skill) and a final holistic review.
- **Acceptance check (C2–C5):** after each task, `grep -nE ':[0-9]+\.[0-9]+' <skill>` over the edited dependency block returns no inline-pinned coordinate (allowing for the retained `// coordinate` comments which carry no version).
- **Delivery:** all commits on `plan2/content-quality-review`. After 2C completes, the controller presents ONE consolidated final report covering Plan 2A (merged), 2B, 2C, with a single merge/push-to-`main` handoff decision for the user (the Plan 2A push consent does NOT extend to 2B/2C — explicit consent required).

## 5. Out of Scope (YAGNI / deferred)

- The ~8 non-owner-stack skills' version pins (push-notifications, image-loading, pagination-patterns, localization-patterns, kmp-navigation, m3-expressive) — not the owner's stack; consistent with Plan 2B scoping.
- All `agents/*.md` / `commands/*.md` version pins — agents are out of scope (Plan 2B precedent); a sweeping agent rewrite is unwarranted and high-churn.
- De-versioning the `(C)` pedagogical `[versions]`/`[libraries]` catalog blocks — they are teaching content; annotation only.
- `(P)` prose version mentions — harmless, not copyable coordinates.
- Introducing a real `libs.versions.toml` into the plugin repo, any CI lint rule, or any manifest/hook/MCP/`package.json` change.
- Choosing/upgrading "correct" library versions — the policy removes inline pins; it does not adjudicate version numbers.
