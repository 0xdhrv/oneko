import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "lib/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["json", "text"],
      reportsDirectory: "./coverage",
      include: ["lib/oneko/**/*.ts"],
      exclude: ["lib/oneko/**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
