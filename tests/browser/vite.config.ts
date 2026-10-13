import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import vue from "@vitejs/plugin-vue";

export default {
  root: resolve("tests/browser/fixture"),
  resolve: { alias: { "@": resolve(".codex/browser-consumer") } },
  esbuild: { jsx: "automatic" },
  // The Svelte and Vue wrappers in public/frameworks are compiled as a consumer would.
  plugins: [svelte(), vue()],
  server: { host: "127.0.0.1", port: 3102, strictPort: true },
};
