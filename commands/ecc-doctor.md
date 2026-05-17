---
description: Health check for everything-claude-code-mobile — MCP server deps, platform, discipline skill, SessionStart hook, and detected companion plugins (Figma/Atlassian/GitHub). Read-only.
---

# ECC Doctor Command

> **Operating discipline:** follow the `ecc-operating-discipline` skill (agent delegation, Android/iOS style, mobile security, testing/TDD).

A read-only green/red status report. Mutates nothing.

## Steps (run these)

1. Produce the structured report:

   ```bash
   node -e "const{doctorReport}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/setup');const{pluginRoot,projectDir}=require(process.env.CLAUDE_PLUGIN_ROOT+'/scripts/lib/paths');console.log(JSON.stringify(doctorReport({pluginRoot:pluginRoot(),projectDir:projectDir()}),null,2))"
   ```

2. Render it as a checklist:
   - **MCP servers** — for each of `mobile-memory`, `ios-memory`, `kmp-context`: ✓ if `depsInstalled`, else ✗ with fix `Run /ecc-setup`.
   - **Platform** — detected `platform`.
   - **Discipline skill** — ✓/✗ `disciplineSkillPresent`.
   - **SessionStart hook** — ✓/✗ `sessionStartHookRegistered`.
   - **Companion integrations** — Figma / Atlassian (Jira) / GitHub from `companions`; for each `absent`, show `/plugin install` is available (these are independent official plugins; ECC runs alongside, does not bundle them).
   - **Note** — list `projectDataDirs`: `/plugin uninstall` will not remove these; they are user data, delete manually only if desired.

## Invokes

- `scripts/lib/setup.js` (`doctorReport`)
