import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    css: true,
    // Playwright specs live in e2e/ and run via `npm run test:e2e`, not Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.types.ts", "src/setupTests.ts"],
      reporter: ["text-summary", "html"],
      // A ratchet: set just below the current numbers. Raise them when coverage goes up; never lower them.
      thresholds: { lines: 85, statements: 83, functions: 79, branches: 75 },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
