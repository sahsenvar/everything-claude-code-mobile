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
