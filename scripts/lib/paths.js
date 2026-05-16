/**
 * Path resolution for plugin-bundled scripts.
 *
 * pluginRoot() — absolute path to the installed plugin directory.
 *   Prefers ${CLAUDE_PLUGIN_ROOT} (set by Claude Code when running plugin
 *   hooks/MCP); falls back to the repo root relative to this file.
 *
 * projectDir() — absolute path to the user's project.
 *   Prefers ${CLAUDE_PROJECT_DIR} (set by Claude Code); falls back to cwd.
 */

const path = require('path');

function pluginRoot() {
    if (process.env.CLAUDE_PLUGIN_ROOT) {
        return process.env.CLAUDE_PLUGIN_ROOT;
    }
    // this file lives at <root>/scripts/lib/paths.js
    return path.resolve(__dirname, '../../');
}

function projectDir() {
    if (process.env.CLAUDE_PROJECT_DIR) {
        return process.env.CLAUDE_PROJECT_DIR;
    }
    return process.cwd();
}

module.exports = { pluginRoot, projectDir };
