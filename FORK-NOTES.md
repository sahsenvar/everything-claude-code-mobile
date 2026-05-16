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
