#!/usr/bin/env node
/**
 * V2 Instinct: track Gradle build/test events.
 * Appends a build event to <project>/.claude/instincts/build-history.json.
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot, ensureDir, runCommand } = require('../lib/utils');
const { readHookInput } = require('../lib/hook-input');

function main() {
    const input = readHookInput();
    const command = (input.tool_input && input.tool_input.command) || '';

    let kind = 'build';
    if (/\btest\b/.test(command)) kind = 'test';
    else if (/\bassemble\b/.test(command)) kind = 'assemble';

    const projectRoot = getProjectRoot();
    const dir = ensureDir(path.join(projectRoot, '.claude', 'instincts'));
    const file = path.join(dir, 'build-history.json');

    let history = { events: [] };
    if (fs.existsSync(file)) {
        try { history = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { history = { events: [] }; }
    }
    if (!Array.isArray(history.events)) history.events = [];

    const branch = runCommand('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot });

    history.events.push({
        timestamp: new Date().toISOString(),
        kind,
        command: command.slice(0, 200),
        gitBranch: branch.success ? branch.output : 'unknown'
    });
    history.events = history.events.slice(-100);

    fs.writeFileSync(file, JSON.stringify(history, null, 2));
    console.log(`📊 Build event tracked (${kind}).`);
}

main();
