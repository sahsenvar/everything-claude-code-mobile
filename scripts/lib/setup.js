/**
 * Setup & health primitives. Pure: no side effects at require time.
 * Single source of truth for /ecc-setup, /ecc-doctor, check-setup.js,
 * and the install-mcp-deps.js CLI shim.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { getClaudeConfigDir, readJsonFile, getInstinctsDir } = require('./utils');
const { instinctHealth } = require('./instincts');

const SERVERS = ['mobile-memory', 'ios-memory', 'kmp-context'];

const NUDGE = '⚠ ECC: MCP server dependencies missing — run /ecc-setup to install';

function detectPlatform(projectDir) {
  try {
    const has = (f) => fs.existsSync(path.join(projectDir, f));
    const gradleKts = path.join(projectDir, 'build.gradle.kts');
    const isDir = (f) => { try { return fs.statSync(path.join(projectDir, f)).isDirectory(); } catch (_) { return false; } };
    const isKmp =
      isDir('shared') ||
      (fs.existsSync(gradleKts) && fs.readFileSync(gradleKts, 'utf8').includes('kotlin("multiplatform")'));
    if (isKmp) return 'kmp';
    if (has('build.gradle') || has('build.gradle.kts') || has('settings.gradle') || has('settings.gradle.kts')) {
      return 'android';
    }
    const entries = fs.existsSync(projectDir) ? fs.readdirSync(projectDir) : [];
    if (has('Package.swift') || entries.some((e) => e.endsWith('.xcodeproj') || e.endsWith('.xcworkspace'))) {
      return 'ios';
    }
  } catch (_) { /* fall through */ }
  return 'unknown';
}

function detectState({ pluginRoot, projectDir }) {
  const mcpDeps = {};
  for (const s of SERVERS) {
    mcpDeps[s] = fs.existsSync(path.join(pluginRoot, 'mcp-servers', s, 'node_modules'));
  }
  const disciplineSkillPresent = fs.existsSync(
    path.join(pluginRoot, 'skills', 'ecc-operating-discipline', 'SKILL.md')
  );
  let sessionStartHookRegistered = false;
  const cfg = readJsonFile(path.join(pluginRoot, 'hooks', 'hooks.json'));
  if (cfg && cfg.hooks && Array.isArray(cfg.hooks.SessionStart)) {
    sessionStartHookRegistered = JSON.stringify(cfg.hooks.SessionStart).includes('check-setup.js');
  }
  return {
    mcpDeps,
    platform: detectPlatform(projectDir),
    sessionStartHookRegistered,
    disciplineSkillPresent,
  };
}

function setupNudge(state) {
  const missing = Object.values(state.mcpDeps).some((v) => v === false);
  return missing ? NUDGE : null;
}

function defaultRunInstall(dir, hasLock) {
  execFileSync('npm', [hasLock ? 'ci' : 'install', '--omit=dev'], { cwd: dir, stdio: 'inherit' });
}

function installMcpDeps({ pluginRoot, servers = SERVERS, runInstall = defaultRunInstall }) {
  const perServer = {};
  for (const name of servers) {
    const dir = path.join(pluginRoot, 'mcp-servers', name);
    if (!fs.existsSync(path.join(dir, 'package.json'))) {
      perServer[name] = { status: 'skipped' };
      continue;
    }
    const hasLock = fs.existsSync(path.join(dir, 'package-lock.json'));
    try {
      runInstall(dir, hasLock);
      perServer[name] = { status: 'installed' };
    } catch (e) {
      perServer[name] = { status: 'failed', error: String((e && e.message) || e) };
    }
  }
  return { perServer };
}

const COMPANION_PREFIXES = { figma: 'figma', atlassian: 'atlassian', github: 'github' };

function defaultPluginsFile() {
  return path.join(getClaudeConfigDir(), 'plugins', 'installed_plugins.json');
}

function detectCompanions({ pluginsFile = defaultPluginsFile() } = {}) {
  const result = { figma: 'unknown', atlassian: 'unknown', github: 'unknown' };
  const json = readJsonFile(pluginsFile);
  if (!json) return result;
  const names = Object.keys((json.plugins) || {}).map((k) => k.split('@')[0]);
  for (const [companion, prefix] of Object.entries(COMPANION_PREFIXES)) {
    result[companion] = names.some((n) => n.startsWith(prefix)) ? 'present' : 'absent';
  }
  return result;
}

const PROJECT_DATA_DIRS = [
  '.claude/mobile-memory', '.claude/ios-memory', '.claude/kmp-context', '.claude/checkpoints',
];

function doctorReport({ pluginRoot, projectDir, pluginsFile, instinctsFile } = {}) {
  const state = detectState({ pluginRoot, projectDir });
  const companions = detectCompanions(pluginsFile ? { pluginsFile } : {});
  const mcp = {};
  for (const s of SERVERS) mcp[s] = { depsInstalled: state.mcpDeps[s] };
  const ok =
    Object.values(state.mcpDeps).every(Boolean) &&
    state.disciplineSkillPresent &&
    state.sessionStartHookRegistered;
  const instFile = instinctsFile || path.join(getInstinctsDir(), 'mobile-instincts.json');
  const instincts = instinctHealth(readJsonFile(instFile) || { instincts: [] });
  return {
    mcp,
    platform: state.platform,
    disciplineSkillPresent: state.disciplineSkillPresent,
    sessionStartHookRegistered: state.sessionStartHookRegistered,
    companions,
    projectDataDirs: PROJECT_DATA_DIRS.slice(),
    ok,
    instincts,
  };
}

module.exports = { SERVERS, NUDGE, detectState, setupNudge, installMcpDeps, detectCompanions, doctorReport };
