import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
    // Real Sharp encoding across six formats plus an internet-gated network
    // probe warrant a generous per-test timeout.
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
