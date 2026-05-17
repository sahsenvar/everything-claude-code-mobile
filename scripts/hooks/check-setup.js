#!/usr/bin/env node
/**
 * SessionStart: detection-only nudge if MCP server deps are missing.
 * Never installs, no network, never fails the session.
 */
const { pluginRoot, projectDir } = require('../lib/paths');
const { detectState, setupNudge } = require('../lib/setup');

function main() {
  try {
    const state = detectState({ pluginRoot: pluginRoot(), projectDir: projectDir() });
    const nudge = setupNudge(state);
    if (nudge) console.log(nudge);
  } catch (_) {
    /* never disrupt the session */
  }
}

main();
