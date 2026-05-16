#!/usr/bin/env node
/**
 * V2 Instinct: track repeated-read focus files.
 * Repeated reads of the same file indicate problem-solving; record a count.
 */

const fs = require('fs');
const path = require('path');
const { getProjectRoot, ensureDir } = require('../lib/utils');
const { readHookInput, resolveTargetFile } = require('../lib/hook-input');

function main() {
    let file = process.argv[2];
    if (!file || file.startsWith('$')) {
        file = resolveTargetFile(readHookInput());
    }
    if (!file) {
        process.exit(0);
    }

    const dir = ensureDir(path.join(getProjectRoot(), '.claude', 'instincts'));
    const f = path.join(dir, 'focus-history.json');

    let history = {};
    if (fs.existsSync(f)) {
        try { history = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { history = {}; }
    }

    const entry = history[file] || { count: 0, firstSeen: new Date().toISOString() };
    entry.count += 1;
    entry.lastSeen = new Date().toISOString();
    history[file] = entry;

    fs.writeFileSync(f, JSON.stringify(history, null, 2));
    console.log(`🔁 Focus tracked: ${path.basename(file)} (x${entry.count}).`);
}

main();
