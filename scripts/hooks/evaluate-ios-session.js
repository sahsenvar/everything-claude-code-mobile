#!/usr/bin/env node
/**
 * Session evaluation hook (iOS) - extracts Swift patterns from completed
 * sessions. Runs on Stop. iOS analogue of evaluate-session.js.
 */

const fs = require('fs');
const path = require('path');
const { log, getProjectRoot, runCommand } = require('../lib/utils');
const { addInstinct, loadInstincts } = require('../lib/instincts');

const SWIFT_PATTERNS = [
    { id: 'swiftui-state-object', pattern: /@StateObject\s+(?:private\s+)?var\s+\w+/, context: 'swiftui-patterns', description: 'SwiftUI @StateObject ownership' },
    { id: 'swiftui-observed-object', pattern: /@ObservedObject\s+(?:private\s+)?var\s+\w+/, context: 'swiftui-patterns', description: 'SwiftUI @ObservedObject injection' },
    { id: 'mvvm-observable-object', pattern: /class\s+\w+(?:ViewModel)?\s*:\s*ObservableObject/, context: 'swift-patterns', description: 'MVVM ObservableObject view model' },
    { id: 'combine-sink', pattern: /\.sink\s*\(/, context: 'combine-framework', description: 'Combine subscription via sink' },
    { id: 'combine-publisher', pattern: /AnyPublisher\s*<[^>]+>/, context: 'combine-framework', description: 'Combine AnyPublisher type erasure' },
    { id: 'swift-async-task', pattern: /Task\s*\{[\s\S]*?await\s+/, context: 'swift-patterns', description: 'Structured concurrency with Task/await' },
    { id: 'swift-mainactor', pattern: /@MainActor/, context: 'swift-patterns', description: '@MainActor isolation' },
    { id: 'core-data-fetchrequest', pattern: /@FetchRequest\s*\(/, context: 'core-data', description: 'Core Data @FetchRequest in SwiftUI' }
];

function isIosProject(dir) {
    try {
        if (fs.existsSync(path.join(dir, 'Package.swift'))) return true;
        if (fs.existsSync(path.join(dir, 'Podfile'))) return true;
        return fs.readdirSync(dir).some(f => f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'));
    } catch (_) {
        return false;
    }
}

function main() {
    const projectRoot = getProjectRoot();

    if (!isIosProject(projectRoot)) {
        log('Not an iOS project, skipping Swift pattern extraction', 'info');
        return;
    }

    log('Evaluating session for Swift patterns...', 'info');

    const diff = runCommand('git diff HEAD~5 --name-only -- "*.swift"', { cwd: projectRoot });
    if (!diff.success || !diff.output) {
        log('No recent Swift changes to analyze', 'info');
        return;
    }

    const changedFiles = diff.output.split('\n').filter(f => f.endsWith('.swift'));
    log(`Analyzing ${changedFiles.length} changed Swift files`, 'info');

    const detected = new Set();
    for (const file of changedFiles) {
        const filePath = path.join(projectRoot, file);
        try {
            if (!fs.existsSync(filePath)) continue;
            const content = fs.readFileSync(filePath, 'utf-8');
            for (const def of SWIFT_PATTERNS) {
                if (def.pattern.test(content)) {
                    detected.add(def.id);
                    addInstinct({
                        id: def.id, type: 'pattern', description: def.description,
                        context: def.context, confidence: 0.4
                    });
                    log(`Detected: ${def.description}`, 'success');
                }
            }
        } catch (_) { /* skip unreadable files */ }
    }

    if (detected.size > 0) {
        log(`Session evaluation complete: ${detected.size} Swift patterns reinforced`, 'success');
    } else {
        log('No new Swift patterns detected in this session', 'info');
    }

    const instincts = loadInstincts();
    const high = instincts.instincts.filter(i => i.confidence >= 0.7);
    log(`Total instincts: ${instincts.instincts.length} (${high.length} high confidence)`, 'info');
}

main();
