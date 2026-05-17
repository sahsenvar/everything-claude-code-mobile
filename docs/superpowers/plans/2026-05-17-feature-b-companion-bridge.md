# Feature B — Companion Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Three soft-detect bridge commands (`/jira-feature-build`, `/github-pr-feature`, `/figma-ui-impl`) connecting ECC to the official Atlassian/GitHub/Figma plugins without bundling them.

**Architecture:** Prompt-driven `commands/*.md` (frontmatter `description` only; mandatory operating-discipline blockquote; `## Soft-detect`/`## Steps`/`## Invokes`). Contract tests in `tests/unit/bridge-commands.test.js`. No agents, no source changes.

**Branch:** `feature/roadmap-abcd` (no push; consent at the very end).

**Verified invariants:** Commands need only `description` frontmatter. Every `commands/*.md` MUST contain the exact line `> **Operating discipline:** follow the \`ecc-operating-discipline\` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).` — enforced by the convention lint in `tests/unit/setup.test.js` (runs in `npm test`). No exact command-count test (adding commands safe). No `plugin.json` in repo (auto-discovery). `/feature-build` takes a prose description; `ui-impl` is an agent invoked with context. Companion MCPs are EXTERNAL (not in this repo's `.mcp.json`); bridges reference their tools only as "use if available". `npm test` runs `tests/unit/*.test.js`.

---

### Task 1: `/jira-feature-build` + contract test scaffold

**Files:** Create `commands/jira-feature-build.md`, `tests/unit/bridge-commands.test.js`.

- [ ] **Step 1: Write failing test** — create `tests/unit/bridge-commands.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CMD = path.join(__dirname, '..', '..', 'commands');
const DISCIPLINE = 'ecc-operating-discipline';

function read(name) {
  const p = path.join(CMD, name);
  assert.ok(fs.existsSync(p), `${name} must exist`);
  return fs.readFileSync(p, 'utf8');
}
function assertCommon(c, name) {
  assert.ok(c.startsWith('---'), `${name}: frontmatter`);
  assert.match(c, /^---\n[\s\S]*?description:\s*\S[\s\S]*?\n---\n/, `${name}: description`);
  assert.ok(c.includes(DISCIPLINE), `${name}: operating-discipline ref`);
  assert.match(c, /not detected|skip/i, `${name}: soft-degrade wording`);
}

describe('Feature B — jira-feature-build', () => {
  it('exists, valid, soft-detect, references Jira tools + feature-build', () => {
    const c = read('jira-feature-build.md');
    assertCommon(c, 'jira-feature-build.md');
    assert.ok(c.includes('getJiraIssue'), 'references getJiraIssue');
    assert.ok(c.includes('/feature-build'), 'invokes /feature-build');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && node --test tests/unit/bridge-commands.test.js` → FAIL (jira-feature-build.md missing).

- [ ] **Step 3: Create `commands/jira-feature-build.md`** EXACTLY:

```markdown
---
description: Bridge a Jira issue into the feature pipeline. Fetches the issue via the Atlassian companion MCP (if installed) and runs /feature-build with the issue as the feature description. Degrades gracefully if Atlassian is absent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Jira → Feature Build

Turn a Jira ticket into a built feature. Usage: `/jira-feature-build PROJ-123`

## Soft-detect

This command needs the official **Atlassian** companion plugin (independent of ECC; ECC does not bundle it). If its MCP tools are not available in this session, print:
`Atlassian companion not detected — install the official Atlassian plugin (see /ecc-doctor); skipping Jira fetch.`
…then stop without error. Never fail the session.

## Steps

1. If Atlassian MCP tools are unavailable → soft-degrade message above, stop.
2. Resolve the site cloudId via `getAccessibleAtlassianResources` (use the first resource, or ask the user if several).
3. Fetch the issue: `getJiraIssue` with `{ cloudId, issueIdOrKey: "<ISSUE-KEY from $ARGUMENTS>" }`.
4. Compose a feature description = issue summary + description + any acceptance criteria, trimmed to a concise paragraph.
5. Invoke `/feature-build "<composed description>"` and let the standard pipeline run.
6. Report the issue key, the composed description, and the feature build entry point.

## Invokes

- Atlassian companion MCP (`getAccessibleAtlassianResources`, `getJiraIssue`) — external, optional
- `/feature-build` command
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/bridge-commands.test.js` → PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/jira-feature-build.md tests/unit/bridge-commands.test.js
git -c commit.gpgsign=false commit -m "feat(bridge): /jira-feature-build (Atlassian -> feature-build, soft-detect)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: `/github-pr-feature`

**Files:** Modify `tests/unit/bridge-commands.test.js`; Create `commands/github-pr-feature.md`.

- [ ] **Step 1: Append failing test** to `tests/unit/bridge-commands.test.js`:

```js
describe('Feature B — github-pr-feature', () => {
  it('exists, valid, soft-detect, references GitHub PR tools', () => {
    const c = read('github-pr-feature.md');
    assertCommon(c, 'github-pr-feature.md');
    assert.ok(c.includes('create_pull_request'), 'references create_pull_request');
    assert.ok(c.includes('update_pull_request') || c.includes('pull_request_read'),
      'references PR read/update');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `node --test tests/unit/bridge-commands.test.js` → FAIL (github-pr-feature.md missing).

- [ ] **Step 3: Create `commands/github-pr-feature.md`** EXACTLY:

```markdown
---
description: Open or update a GitHub pull request for the current feature branch via the GitHub companion MCP (if installed). Links the feature/plan in the PR body. Degrades gracefully if GitHub MCP is absent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Feature → GitHub PR

Open/refresh a PR for the feature you just built. Usage: `/github-pr-feature [feature-name]`

## Soft-detect

Needs the official **GitHub** companion plugin (independent of ECC; not bundled). If its MCP tools are unavailable, print:
`GitHub companion not detected — install the official GitHub plugin (see /ecc-doctor); skipping PR step.`
…then stop without error. Never fail the session.

## Steps

1. If GitHub MCP tools are unavailable → soft-degrade message above, stop.
2. Determine `owner`/`repo` from `git remote get-url origin` and the current branch from `git rev-parse --abbrev-ref HEAD`. Do not push or change git state here.
3. Check for an existing PR for the branch via `pull_request_read` (list/get for `head = owner:branch`).
4. If none: `create_pull_request` with `{ owner, repo, head: branch, base: "main", title, body }` where the body links the feature name/plan and summarises the change. If one exists: `update_pull_request` to refresh the body.
5. Report the PR URL/number and whether it was created or updated.

## Invokes

- GitHub companion MCP (`pull_request_read`, `create_pull_request`, `update_pull_request`) — external, optional
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/bridge-commands.test.js` → PASS (2 describes green).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/github-pr-feature.md tests/unit/bridge-commands.test.js
git -c commit.gpgsign=false commit -m "feat(bridge): /github-pr-feature (GitHub PR, soft-detect)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: `/figma-ui-impl`

**Files:** Modify `tests/unit/bridge-commands.test.js`; Create `commands/figma-ui-impl.md`.

- [ ] **Step 1: Append failing test** to `tests/unit/bridge-commands.test.js`:

```js
describe('Feature B — figma-ui-impl', () => {
  it('exists, valid, soft-detect, references Figma + ui-impl', () => {
    const c = read('figma-ui-impl.md');
    assertCommon(c, 'figma-ui-impl.md');
    assert.ok(c.includes('get_design_context'), 'references get_design_context');
    assert.ok(c.includes('ui-impl'), 'hands off to ui-impl agent');
  });
});
```

- [ ] **Step 2: Run, verify fail** — `node --test tests/unit/bridge-commands.test.js` → FAIL (figma-ui-impl.md missing).

- [ ] **Step 3: Create `commands/figma-ui-impl.md`** EXACTLY:

```markdown
---
description: Bridge a Figma design into UI implementation. Fetches design context via the Figma companion MCP (if installed) and hands it to the ui-impl agent as the design reference. Degrades gracefully if Figma is absent.
---

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

# Figma → UI Impl

Implement a screen from a Figma design. Usage: `/figma-ui-impl <figma-url>` (or `fileKey nodeId`)

## Soft-detect

Needs the official **Figma** companion plugin (independent of ECC; not bundled). If its MCP tools are unavailable, print:
`Figma companion not detected — install the official Figma plugin (see /ecc-doctor); skipping design fetch.`
…then stop without error. Never fail the session.

## Steps

1. If Figma MCP tools are unavailable → soft-degrade message above, stop.
2. Parse the argument: a `figma.com/design/<fileKey>/...?node-id=<nodeId>` URL → extract `fileKey` and `nodeId` (convert `-` to `:` in node id), or accept explicit `fileKey nodeId`.
3. Fetch design context: `get_design_context` with `{ fileKey, nodeId }` (optionally `get_screenshot` for a visual reference).
4. Hand the returned design context (tokens, layout, component structure) to the `ui-impl` agent as the design reference, instructing it to implement the screen following the ECC Compose/MVI discipline.
5. Report which node was implemented and the files `ui-impl` produced.

## Invokes

- Figma companion MCP (`get_design_context`, `get_screenshot`) — external, optional
- `ui-impl` agent
```

- [ ] **Step 4: Run, verify pass** — `node --test tests/unit/bridge-commands.test.js` → PASS (3 describes green).

- [ ] **Step 5: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add commands/figma-ui-impl.md tests/unit/bridge-commands.test.js
git -c commit.gpgsign=false commit -m "feat(bridge): /figma-ui-impl (Figma -> ui-impl, soft-detect)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Document the 3 bridges (EN + TR) + full suite

**Files:** Modify `docs/COMMANDS.md`, `docs/tr/COMMANDS.md`.

- [ ] **Step 1: Add a section to `docs/COMMANDS.md`** — read the file, then add (place after the "Setup & health" section, before the platform groups; match the file's existing table style):

```
## Companion bridges

These connect ECC to the official Atlassian/GitHub/Figma plugins. They soft-detect: if the companion plugin is not installed they explain and skip — never fail. Run `/ecc-doctor` to see which companions are detected.

| Command | What it does | Example |
|---|---|---|
| `/jira-feature-build <KEY>` | Fetches a Jira issue (Atlassian MCP) and runs `/feature-build` with it as the description. | `/jira-feature-build PROJ-123` |
| `/github-pr-feature [name]` | Opens/updates a GitHub PR (GitHub MCP) for the current feature branch. | `/github-pr-feature auth` |
| `/figma-ui-impl <url>` | Fetches Figma design context (Figma MCP) and hands it to `ui-impl`. | `/figma-ui-impl https://figma.com/design/…` |
```

- [ ] **Step 2: Add the mirror to `docs/tr/COMMANDS.md`** — same placement, header `## Tamamlayıcı köprüler`, intro translated ("Bunlar ECC'yi resmi Atlassian/GitHub/Figma eklentilerine bağlar. Soft-detect: companion kurulu değilse açıklayıp atlar — asla başarısız olmaz. Hangileri tespit edildi: `/ecc-doctor`."), table columns `Komut | Ne yapar | Örnek`, descriptions translated, same 3 rows/examples.

- [ ] **Step 3: Full suite** — `cd /Users/sahansenvar/Developer/everything-claude-code-mobile && npm test 2>&1 | tail -4`. Expect all green: `bridge-commands.test.js` (3 describes) + the global `setup.test.js` operating-discipline lint now also covers the 3 new commands (they include the line) + prior suite. Capture totals.

- [ ] **Step 4: Commit**

```bash
cd /Users/sahansenvar/Developer/everything-claude-code-mobile
git add docs/COMMANDS.md docs/tr/COMMANDS.md
git -c commit.gpgsign=false commit -m "docs: document companion bridge commands (EN+TR)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Self-Review
- **Spec coverage:** 3 bridge commands → T1/T2/T3; contract tests → T1-T3 (`bridge-commands.test.js`); docs EN+TR → T4. Soft-detect mandated in every command body + asserted (`/not detected|skip/i`). No gaps.
- **Placeholders:** none — every command file + test is literal; doc step gives exact content + clear placement anchor (existing-file edit, so "read then add after Setup & health" is a precise instruction, not a placeholder).
- **Consistency:** `read`/`assertCommon`/`DISCIPLINE` defined in T1, reused T2/T3; operating-discipline line byte-identical to the lint-enforced string; tool names match recon (`getJiraIssue`, `create_pull_request`/`update_pull_request`/`pull_request_read`, `get_design_context`); `ui-impl` is the real agent name.
- **Safety:** no agents (27-agent test untouched); no command-count test; no source/.mcp.json/plugin changes; the global discipline lint will validate the 3 new commands during `npm test` (T3/T4 run full suite); graceful-degrade prose prevents session failure.

