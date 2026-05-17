# android-smoke (test fixture)

Minimal real Android/Gradle project used by the ECC smoke layer
(`tests/integration/smoke.test.js`) and the manual smoke checklist
(`docs/smoke-checklist.md`). **Not a shipped application** — it exists so the
plugin's JS runtime (hooks, doctor, MCP servers) can be exercised against a
real project structure. No gradle wrapper binary is included (the JS surface
only reads files).
