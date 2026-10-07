import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(".codex/browser-consumer");
const registry = JSON.parse(await readFile("public/r/oneko.json", "utf8"));
await rm(root, { recursive: true, force: true });
for (const file of registry.files) {
  const destination = resolve(root, file.target ?? file.path);
  if (!destination.startsWith(`${root}/`)) throw new Error("Invalid registry file target");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, file.content);
}
