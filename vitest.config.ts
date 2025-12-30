import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: "./vitest.global-setup.ts",
    setupFiles: ["./vitest-setup.ts"],
    globals: true,
    environment: "node",
    // these prevents race conditions
    sequence: {
      concurrent: false,
    },
    fileParallelism: false, // Run test files sequentially for DB isolation

    teardownTimeout: 10000, // Give teardown enough time to clean up MongoDB

    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.config.ts"],
    },
  },
});
