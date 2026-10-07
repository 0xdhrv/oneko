import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));

/** Measure the installed component, keeping React/framework cost outside both bundles. */
async function measure(name) {
  const destination = mkdtempSync(join(tmpdir(), "oneko-bundle-"));
  try {
    const item = JSON.parse(readFileSync(resolve(root, `public/r/${name}.json`), "utf8"));
    for (const file of item.files) {
      const target = resolve(destination, file.target ?? file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
    const entry = join(destination, "consumer.ts");
    writeFileSync(entry, 'export { default } from "./components/oneko";\n');
    const result = await build({
      configFile: false,
      root: destination,
      logLevel: "error",
      esbuild: { jsx: "automatic" },
      resolve: { alias: { "@": destination } },
      build: {
        write: false,
        target: "es2022",
        minify: "esbuild",
        sourcemap: false,
        rollupOptions: {
          input: entry,
          external: (id) => id === "react" || id.startsWith("react/"),
          preserveEntrySignatures: "strict",
          output: { format: "es", inlineDynamicImports: true, entryFileNames: "oneko.js" },
        },
      },
    });
    const outputs = Array.isArray(result) ? result : [result];
    const chunks = outputs
      .flatMap((output) => output.output)
      .filter((file) => file.type === "chunk");
    if (chunks.length !== 1) throw new Error(`Expected one consumer chunk, got ${chunks.length}`);
    return {
      variant: name,
      rawBytes: Buffer.byteLength(chunks[0].code),
      gzipBytes: gzipSync(chunks[0].code).length,
    };
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
}

const full = await measure("oneko");
const classic = await measure("oneko-classic");
console.log(
  JSON.stringify(
    {
      tool: "Vite production build, esbuild minification, ES2022",
      externals: ["react", "react/*"],
      full,
      classic,
      savings: {
        rawBytes: full.rawBytes - classic.rawBytes,
        gzipBytes: full.gzipBytes - classic.gzipBytes,
      },
    },
    null,
    2,
  ),
);
