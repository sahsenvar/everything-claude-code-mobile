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
