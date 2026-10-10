import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SHEET_PATH = "lib/oneko/skin-sheets.json";
const IDS_PATH = "lib/oneko/skin-ids.json";
const CLASSIC_DESCRIPTION =
  "Pixel cat for React with the classic coat, custom sprites, keep-out zones, favorite spots, adjustable bubbles, and optional sounds that are off by default.";
const CLASSIC_DOCS =
  'Classic-only installation of Oneko. Supports skin="classic" and custom spriteSrc; use the full oneko registry item for all 24 named skins. Includes the same animation, controls, zones, and public behavior as the full installation. Sound is off by default; to enable it, supply sound assets and set meow={true}.';

/**
 * shadcn builds the full item from registry.json's single canonical file list.
 * This post-step changes sprite data only: every runtime source file remains
 * byte-for-byte identical. The independent catalog filters against sheet keys.
 */
export function deriveClassicItem(full) {
  const sheetFile = full.files.find((file) => file.path === SHEET_PATH);
  if (!sheetFile) throw new Error(`Registry is missing ${SHEET_PATH}`);
  const sheets = JSON.parse(sheetFile.content);
  if (typeof sheets.classic !== "string") throw new Error("Registry has no classic sprite");
  return {
    ...full,
    name: "oneko-classic",
    title: "Oneko Classic",
    description: CLASSIC_DESCRIPTION,
    docs: CLASSIC_DOCS,
    files: full.files.map((file) => {
      if (file.path === SHEET_PATH)
        return {
          ...file,
          content: `${JSON.stringify({ classic: sheets.classic }, null, 2)}\n`,
        };
      if (file.path === IDS_PATH)
        return {
          ...file,
          content: `${JSON.stringify(["classic"], null, 2)}\n`,
        };
      return { ...file };
    }),
  };
}

export function buildClassicRegistry(root = process.cwd()) {
  const manifest = JSON.parse(readFileSync(resolve(root, "registry.json"), "utf8"));
  const fullManifestItem = manifest.items.find((item) => item.name === "oneko");
  if (!fullManifestItem) throw new Error("registry.json is missing the full oneko item");
  const full = JSON.parse(readFileSync(resolve(root, "public/r/oneko.json"), "utf8"));
  const classic = deriveClassicItem(full);
  writeFileSync(
    resolve(root, "public/r/oneko-classic.json"),
    `${JSON.stringify(classic, null, 2)}\n`,
  );

  // Index descriptors share the canonical file list; only the generated item carries content.
  const classicManifestItem = {
    ...fullManifestItem,
    name: classic.name,
    title: classic.title,
    description: classic.description,
    docs: classic.docs,
  };
  const index = {
    ...manifest,
    items: [...manifest.items, classicManifestItem],
  };
  writeFileSync(resolve(root, "public/r/registry.json"), `${JSON.stringify(index, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildClassicRegistry();
}
