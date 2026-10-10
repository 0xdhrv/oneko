import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const outDir = resolve(root, "public");

// Hashed skin chunks live in public/oneko/; clear old hashes before writing new ones.
rmSync(resolve(outDir, "oneko"), { recursive: true, force: true });

await build({
  root,
  configFile: false,
  logLevel: "warn",
  resolve: { alias: { "@": root } },
  build: {
    outDir,
    emptyOutDir: false,
    copyPublicDir: false,
    target: "es2022",
    minify: "esbuild",
    sourcemap: false,
    lib: {
      entry: resolve(root, "lib/oneko/vanilla-entry.ts"),
      formats: ["es"],
      fileName: () => "oneko.js",
    },
    rollupOptions: {
      output: { chunkFileNames: "oneko/[name]-[hash].js" },
    },
  },
});
console.log("Wrote public/oneko.js");
