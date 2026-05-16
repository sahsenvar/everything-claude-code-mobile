/**
 * Hook stdin parsing.
 *
 * Claude Code passes the hook event as a JSON object on stdin. These helpers
 * read and parse it defensively (a hook must never crash the session).
 */

const fs = require('fs');

/** Parse a raw hook-event JSON string. Returns {} on empty/invalid input. */
function parseHookInput(raw) {
    if (!raw || !raw.trim()) return {};
    try {
        return JSON.parse(raw);
    } catch (_) {
        return {};
    }
}

/** Synchronously read the hook event from stdin (fd 0). Returns {} if none. */
function readHookInput() {
    try {
        const raw = fs.readFileSync(0, 'utf8');
        return parseHookInput(raw);
    } catch (_) {
        return {};
    }
}

/** Extract the target file path from a parsed hook event, or null. */
function resolveTargetFile(input) {
    if (input && input.tool_input && input.tool_input.file_path) {
        return input.tool_input.file_path;
    }
    return null;
}

module.exports = { parseHookInput, readHookInput, resolveTargetFile };
