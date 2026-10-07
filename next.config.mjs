import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the selected Shiki imports in the bundle; externalizing its package
  // makes OpenNext include every grammar and theme in the Worker.
  transpilePackages: ["shiki"],
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.mp3": {
        type: "asset",
      },
    },
  },
};

export default nextConfig;
