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
- Known: `tests/unit/feature-builder.test.js` has ~5 assertions expecting
  `plugin.json` to list `agents`/`skills` as arrays. These predate this fork
  (failing at upstream baseline) and encode an outdated manifest convention;
  deferred to the Plan 2 content-quality review. The plugin itself is fully
  functional (components load via auto-discovery).

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
