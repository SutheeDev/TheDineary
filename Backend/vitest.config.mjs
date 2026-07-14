import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Env vars the app reads. Set here so they exist before any module loads.
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "1h",
    },
    // Boots a fresh in-memory MongoDB and wires up the per-test cleanup.
    setupFiles: ["./tests/setup.mjs"],
    // Each test file spins up its own database, so run them one at a time to
    // keep memory use and startup predictable.
    fileParallelism: false,
  },
});
