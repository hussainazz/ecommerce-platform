import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globalSetup: "./vitest.global-setup.ts",
    // setupFiles: ["./vitest-setup.ts"],
    globals: true, // allows you to use describe, it, expect without importing
    environment: "node",
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.config.ts"],
    },
    // ui: true,
  },
});
