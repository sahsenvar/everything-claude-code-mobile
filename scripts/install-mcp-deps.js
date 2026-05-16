#!/usr/bin/env node
/**
 * Install npm dependencies for each bundled MCP server.
 * Run after cloning / before first plugin use.
 */

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const SERVERS = ['mobile-memory', 'ios-memory', 'kmp-context'];
const root = path.resolve(__dirname, '..');

for (const name of SERVERS) {
    const dir = path.join(root, 'mcp-servers', name);
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
        console.log(`skip ${name}: no package.json`);
        continue;
    }
    const hasLock = fs.existsSync(path.join(dir, 'package-lock.json'));
    console.log(`installing deps for ${name} (${hasLock ? 'npm ci' : 'npm install'})...`);
    execFileSync('npm', [hasLock ? 'ci' : 'install', '--omit=dev'], {
        cwd: dir, stdio: 'inherit'
    });
}
console.log('MCP server dependencies installed.');
