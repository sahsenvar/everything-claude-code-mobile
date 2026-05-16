# Fork Notes

Personal fork of [ahmed3elshaer/everything-claude-code-mobile](https://github.com/ahmed3elshaer/everything-claude-code-mobile).

## Divergence from upstream
- Hooks consolidated into a single event-keyed `hooks/hooks.json` (plugin schema)
  routed through `scripts/hooks/post-tool-use.js`.
- Added missing hook scripts: `evaluate-ios-session.js`, `pre-compact-ios.js`,
  `track-build.js`, `track-focus.js`.
- All hardcoded `/Users/ah3sh/...` paths replaced with `${CLAUDE_PLUGIN_ROOT}`.
- MCP servers wired via root `.mcp.json`; fixed `kmp-context` server mismatch.
- Path resolution hardened (`scripts/lib/paths.js`, `CLAUDE_PROJECT_DIR`).
- MCP servers (`mcp-servers/*/index.js`) migrated off the removed string-literal
  `setRequestHandler('resources/list', …)` API to the schema objects from
  `@modelcontextprotocol/sdk/types.js` (required for SDK ≥1.x; servers crashed
  on startup otherwise).
- Added `scripts/install-mcp-deps.js` + `npm run mcp:install`. **Manual step:**
  after installing the plugin, run `npm run mcp:install` from the installed
  plugin directory (under `~/.claude/plugins/...`) so the 3 MCP servers get
  their `node_modules`; `/plugin install` does not run npm automatically.
- Added `.gitignore` (`node_modules/`, `mcp-servers/*/node_modules/`).
- `.claude-plugin/plugin.json`: removed the upstream `agents`/`skills`/`commands`
  **directory-string** keys. The current Claude Code plugin schema rejects
  `"agents": "./agents/"` (`agents: Invalid input` at `/plugin install`); the
  proven pattern (used by all official plugins) is to omit these keys and let
  Claude Code auto-discover from the default `agents/`, `skills/`, `commands/`
  directories. Verified: `claude plugin details` → Agents (27), Skills (81),
  Hooks (3), MCP (3). Version bumped 1.1.5 → 1.2.1.
- Plan 2A: the 5 `tests/unit/feature-builder.test.js` plugin-registration
  assertions (which expected `plugin.json` to list `agents`/`skills` arrays —
  an outdated convention removed in Plan 1) were rewritten into a structural
  loadability guard that asserts per-file frontmatter validity for every
  `agents/*.md` and `skills/*/SKILL.md`, verifies `commands/` is non-empty,
  and locks `plugin.json` to metadata-only. Three agents lacking frontmatter
  (`mobile-verifier`, `mobile-compactor`, `mobile-pattern-extractor`) were
  fixed in the same cycle. `npm test` is fully green. (`agents/network-impl.md`
  was already valid — an earlier note claiming a YAML parse error was wrong.)
- Plan 2B: targeted stack-skill content review. Resolved both Plan 2A
  carry-forwards — the skills auto-discovery test now hard-fails if any
  `skills/*` dir lacks `SKILL.md` (was a silent skip), and
  `agents/mobile-pattern-extractor.md` now documents that it is read-only by
  design (instinct persistence is delegated to the PostToolUse hook chain;
  adding `Write` would be wrong — investigation-confirmed). Plus stack
  alignment: `feature-builder` commits to Ktor+Koin (was Retrofit/Ktor,
  Koin/Hilt); `koin-patterns` notes KMP uses SQLDelight/Ktor; `offline-first`
  names SQLDelight for shared code; `coroutines-patterns` and
  `shared-coroutines` cross-reference (Android vs KMP). Spec bullet C6a
  (Ktor `Logger` SAM lambda) was descoped: Ktor's `Logger` is not a Kotlin
  `fun interface`, so `Logger { … }` would not compile. `npm test` green.
  Library-version policy is Plan 2C.
- Plan 2C: library-version policy. `gradle-patterns` now states the policy
  (skill examples reference the project's version catalog via `libs.*`; never
  inline pins; its `[versions]` block is an illustrative snapshot). Inline
  pinned coordinates were converted to `libs.*` accessors in the owner
  core-stack skills: `kmp-networking` (Ktor), `sqldelight-patterns`,
  `navigation-compose`, `shared-coroutines`, `shared-models`. Non-stack skills,
  all agents/commands, the pedagogical catalog blocks, and prose mentions were
  left as-is (out of scope by design). `npm test` green.

## Pulling upstream updates
```bash
git fetch upstream
git checkout main
git merge upstream/main      # main mirrors upstream; resolve as needed
git checkout fix/portability-and-quality
git rebase main              # replay fork changes on top
npm test && npm run lint:json
```
Re-run the smoke test (Task 15) after any upstream merge.
