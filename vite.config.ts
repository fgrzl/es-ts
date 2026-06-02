import { defineConfig } from "vite-plus";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "esTs",
      fileName: (format) => `es-ts.${format}.js`,
      formats: ["es", "cjs"],
    },
    rollupOptions: {
      external: ["@opentelemetry/api", "uuid"],
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  lint: {
    ignorePatterns: ["dist/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["dist/**"],
  },
  plugins: [dts({ insertTypesEntry: true })],
});
