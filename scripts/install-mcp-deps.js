#!/usr/bin/env node
/**
 * Install npm dependencies for each bundled MCP server.
 * Thin CLI shim — logic lives in scripts/lib/setup.js (single source of truth).
 */
const { installMcpDeps } = require('./lib/setup');
const { pluginRoot } = require('./lib/paths');

if (require.main === module) {
  const { perServer } = installMcpDeps({ pluginRoot: pluginRoot() });
  let failed = false;
  for (const [name, r] of Object.entries(perServer)) {
    console.log(`${name}: ${r.status}${r.error ? ' — ' + r.error : ''}`);
    if (r.status === 'failed') failed = true;
  }
  console.log('MCP server dependencies install complete.');
  if (failed) process.exitCode = 1;
}

module.exports = { installMcpDeps };
