import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/index.ts",
        "src/types/index.ts",
        "src/tui/Theme.ts",
        "src/tui/actions.ts",
        "src/tui/Prompt.ts",
        "**/*.test.ts",
      ],
      thresholds: {
        statements: 65,
        branches: 70,
        functions: 80,
        lines: 65,
      },
    },
  },
});
