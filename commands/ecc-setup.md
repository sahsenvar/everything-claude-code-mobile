---
description: One-command setup for everything-claude-code-mobile — installs the bundled MCP server dependencies and verifies plugin health. Idempotent; safe to re-run.
---

# ECC Setup Command

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

One command to make the plugin fully operational after `/plugin install`. Replaces the manual `cd … && npm run mcp:install` dance.

## What It Does

1. Resolves the plugin root from `$CLAUDE_PLUGIN_ROOT` (no glob `cd` needed).
2. Previews current state.
3. Installs the 3 bundled MCP server dependencies.
4. Re-checks and prints a green/red summary; on failure shows the exact retry command per server.

Idempotent: if deps are already present it reports "already set up" and does nothing.

## Steps (run these)

1. Preview + verify-after via the doctor report:

   ```bash
   node -e "const{doctorReport}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/setup');const{pluginRoot,projectDir}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/paths');console.log(JSON.stringify(doctorReport({pluginRoot:pluginRoot(),projectDir:projectDir()}),null,2))"
   ```

2. If any `mcp.<server>.depsInstalled` is `false`, install:

   ```bash
   node "$CLAUDE_PLUGIN_ROOT/scripts/install-mcp-deps.js"
   ```

3. Re-run the command in step 1 to verify. Present the result as a green/red checklist (MCP deps per server, platform, discipline skill, SessionStart hook). For any server still failing, tell the user to re-run step 2 or, for one server, `cd "$CLAUDE_PLUGIN_ROOT/mcp-servers/<server>" && npm ci --omit=dev`.

## Invokes

- `scripts/lib/setup.js` (`doctorReport`, `installMcpDeps` via the `install-mcp-deps.js` CLI)
