import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  plugins: [dts()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        node: resolve(__dirname, "src/node/index.ts"),
        react: resolve(__dirname, "src/react/index.ts"),
      },
      name: "IngestX",
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: ["papaparse", "xlsx", "react", "react-dom", "fs", "path", /^node:/],
    },
  },
});
