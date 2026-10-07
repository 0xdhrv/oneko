import { resolve } from "node:path";

export default {
  root: resolve("tests/browser/fixture"),
  resolve: { alias: { "@": resolve(".codex/browser-consumer") } },
  esbuild: { jsx: "automatic" },
  server: { host: "127.0.0.1", port: 3102, strictPort: true },
};
