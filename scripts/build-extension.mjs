import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const src = resolve(root, "extension");
const outDir = resolve(root, "dist/extension");
rmSync(outDir, { recursive: true, force: true });

// One ES build: content.js is imported by loader.js, so both entries share the engine chunks.
await build({
  root,
  configFile: false,
  logLevel: "warn",
  resolve: { alias: { "@": root } },
  build: {
    outDir,
    copyPublicDir: false,
    target: "es2022",
    minify: "esbuild",
    sourcemap: false,
    lib: {
      entry: {
        content: resolve(src, "src/content.ts"),
        popup: resolve(src, "src/popup.ts"),
      },
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: { output: { chunkFileNames: "chunks/[name]-[hash].js" } },
  },
});

for (const file of ["manifest.json", "loader.js", "popup.html", "popup.css"])
  cpSync(resolve(src, file), resolve(outDir, file));
cpSync(resolve(root, "public/cat-sounds"), resolve(outDir, "cat-sounds"), { recursive: true });
cpSync(resolve(root, "LICENSE"), resolve(outDir, "LICENSE"));

mkdirSync(resolve(outDir, "icons"));
const icon = readFileSync(resolve(root, "public/icon.svg"));
for (const size of [16, 32, 48, 128])
  await sharp(icon, { density: 72 * Math.ceil(size / 24) })
    .resize(size, size, { kernel: "nearest" })
    .png()
    .toFile(resolve(outDir, `icons/${size}.png`));

const { version } = JSON.parse(readFileSync(resolve(src, "manifest.json"), "utf8"));
const zip = resolve(root, `dist/oneko-chrome-${version}.zip`);
rmSync(zip, { force: true });
execFileSync("zip", ["-qr", "-X", zip, "."], { cwd: outDir });
console.log(`Built dist/extension and dist/oneko-chrome-${version}.zip`);
