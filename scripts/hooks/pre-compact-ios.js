#!/usr/bin/env node
/**
 * Pre-compact hook (iOS) - saves an iOS-focused session checkpoint before
 * context compaction. iOS analogue of pre-compact.js.
 */

const fs = require('fs');
const path = require('path');
const { log, getProjectRoot, ensureDir, getTimestamp, runCommand } = require('../lib/utils');
const { loadInstincts } = require('../lib/instincts');

function gitBranch(dir) {
    const r = runCommand('git rev-parse --abbrev-ref HEAD', { cwd: dir });
    return r.success ? r.output : 'unknown';
}

function recentSwiftFiles(dir) {
    const r = runCommand('git diff --name-only HEAD~3 -- "*.swift"', { cwd: dir });
    return r.success && r.output ? r.output.split('\n').filter(Boolean).slice(0, 20) : [];
}

function cleanOld(dir, keep) {
    try {
        const files = fs.readdirSync(dir).filter(f => f.startsWith('ios-checkpoint-')).sort().reverse();
        for (let i = keep; i < files.length; i++) fs.unlinkSync(path.join(dir, files[i]));
    } catch (_) { /* ignore */ }
}

function main() {
    const projectRoot = getProjectRoot();
    const checkpointDir = ensureDir(path.join(projectRoot, '.claude', 'checkpoints'));
    const file = path.join(checkpointDir, `ios-checkpoint-${getTimestamp()}.json`);

    const checkpoint = {
        timestamp: new Date().toISOString(),
        platform: 'ios',
        projectRoot,
        gitBranch: gitBranch(projectRoot),
        recentSwiftFiles: recentSwiftFiles(projectRoot),
        instincts: loadInstincts()
    };

    fs.writeFileSync(file, JSON.stringify(checkpoint, null, 2));
    log(`iOS checkpoint saved: ${path.basename(file)}`, 'success');
    cleanOld(checkpointDir, 10);
}

main();
