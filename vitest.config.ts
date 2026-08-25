import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "./tests/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    env: {
      RAZORPAY_WEBHOOK_SECRET: "test-webhook-secret",
    },
  },
});
