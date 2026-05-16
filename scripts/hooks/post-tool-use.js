#!/usr/bin/env node
/**
 * Single PostToolUse dispatcher.
 *
 * Replaces the legacy per-pattern PostToolUse hooks. Reads the hook event
 * from stdin, then for Write/Edit on Kotlin/Gradle files: spawns the matching
 * capture/extract/track script with the resolved file path, and prints
 * reminder messages. Always exits 0 — hooks must not block the session.
 */

const path = require('path');
const { spawnSync } = require('child_process');
const { readHookInput, resolveTargetFile } = require('../lib/hook-input');
const { projectDir } = require('../lib/paths');

const HOOKS_DIR = __dirname;

function run(script, file) {
    try {
        spawnSync('node', [path.join(HOOKS_DIR, script), file], {
            cwd: projectDir(),
            stdio: 'inherit',
            timeout: 30000
        });
    } catch (_) {
        // Never fail the session because of a learning hook.
    }
}

function main() {
    const input = readHookInput();
    const tool = input.tool_name || '';
    const file = resolveTargetFile(input);

    if ((tool !== 'Write' && tool !== 'Edit') || !file) {
        process.exit(0);
    }

    const base = path.basename(file);

    if (base.endsWith('ViewModel.kt')) {
        run('capture-viewmodel.js', file);
        console.log('📝 Reminder: add a matching ViewModel test (TDD).');
    } else if (base.endsWith('Screen.kt')) {
        run('capture-compose.js', file);
        console.log('🧠 Compose screen pattern captured.');
    } else if (base.endsWith('Module.kt')) {
        run('capture-koin.js', file);
    } else if (base.endsWith('.kt')) {
        run('extract-pattern.js', file);
    }

    if (base === 'build.gradle.kts') {
        run('track-dependency.js', file);
    }

    if (base.endsWith('ViewModel.swift')) {
        console.log('📝 Reminder: add an XCTest for this ViewModel; consider a SwiftUI preview.');
    } else if (base === 'Podfile') {
        console.log('📦 Podfile changed: remember to run `pod install`.');
    } else if (base === 'Package.swift') {
        console.log('📦 Package.swift changed: resolve packages in Xcode.');
    }

    process.exit(0);
}

main();
