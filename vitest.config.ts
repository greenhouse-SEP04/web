/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";   // ← add

export default defineConfig({
  plugins: [react()],
  resolve: {                    // ← add this block
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./src/tests/setup.ts",
    coverage: { reporter: ["text", "html"] },
  },
});
