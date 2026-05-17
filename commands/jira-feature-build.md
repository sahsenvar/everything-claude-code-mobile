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
