import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const pkg = resolve(root, "packages/oneko");
const outDir = resolve(pkg, "dist");
rmSync(outDir, { recursive: true, force: true });

await build({
  root,
  configFile: false,
  logLevel: "warn",
  resolve: { alias: { "@": root } },
  esbuild: { jsx: "automatic" },
  build: {
    outDir,
    copyPublicDir: false,
    target: "es2022",
    minify: false,
    lib: {
      entry: Object.fromEntries(
        ["index", "vanilla", "vue", "solid", "adapter"].map((name) => [
          name,
          resolve(pkg, `src/${name}.ts`),
        ]),
      ),
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: (id) => /^(react|vue|svelte|solid-js)(\/|$)/.test(id),
      output: {
        chunkFileNames: "chunks/[name]-[hash].js",
        // Rollup strips directives. Keep the React entry usable from Next server components.
        banner: (chunk) => (chunk.name === "index" ? '"use client";' : ""),
      },
    },
  },
});

execFileSync(
  process.execPath,
  [resolve(root, "node_modules/typescript/bin/tsc"), "-p", resolve(pkg, "tsconfig.json")],
  { stdio: "inherit" },
);

// Declarations must resolve independently of the website's @/ alias and source tree.
const types = resolve(outDir, "types");
for (const file of readdirSync(types, { recursive: true })) {
  if (!file.endsWith(".d.ts")) continue;
  const path = resolve(types, file);
  const source = readFileSync(path, "utf8").replace(
    /(["'])@\/([^"']+)\1/g,
    (_match, quote, target) => {
      const local = relative(dirname(path), resolve(types, target)).replaceAll("\\", "/");
      return `${quote}${local.startsWith(".") ? local : `./${local}`}${quote}`;
    },
  );
  writeFileSync(path, source);
}

// TypeScript's skin unions reference the JSON modules. Type-only shapes avoid duplicating sprites.
for (const name of ["skin-sheets", "skin-classic"]) {
  const sheets = JSON.parse(readFileSync(resolve(root, `lib/oneko/${name}.json`), "utf8"));
  writeFileSync(
    resolve(types, `lib/oneko/${name}.json.d.ts`),
    `declare const sheets: {\n${Object.keys(sheets)
      .map((key) => `  ${JSON.stringify(key)}: string;`)
      .join("\n")}\n};\nexport = sheets;\n`,
  );
}

mkdirSync(resolve(outDir, "svelte"), { recursive: true });
writeFileSync(
  resolve(outDir, "svelte/Oneko.svelte"),
  readFileSync(resolve(pkg, "src/Oneko.svelte"), "utf8")
    .replace('from "./vanilla"', 'from "../vanilla.js"')
    .replace('from "./adapter"', 'from "../adapter.js"'),
);
writeFileSync(
  resolve(outDir, "svelte/Oneko.svelte.d.ts"),
  'import type { Component } from "svelte";\nimport type { OnekoControls, OnekoOptions } from "../types/packages/oneko/src/vanilla";\ndeclare const Oneko: Component<OnekoOptions, OnekoControls>;\nexport default Oneko;\n',
);
// Also expose sibling types for Svelte's source compiler and editor tooling.
for (const name of ["vanilla", "adapter"]) {
  writeFileSync(
    resolve(outDir, `${name}.d.ts`),
    `export * from "./types/packages/oneko/src/${name}";\n`,
  );
}
cpSync(resolve(root, "public/cat-sounds"), resolve(outDir, "cat-sounds"), { recursive: true });
cpSync(resolve(root, "LICENSE"), resolve(pkg, "LICENSE"));
cpSync(resolve(root, "docs/skins.md"), resolve(pkg, "SKIN-CREDITS.md"));
console.log("Built packages/oneko/dist");
