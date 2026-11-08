import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// The studio shows coats as plain images, so the page doesn't carry every sheet inline.
const sheets = JSON.parse(readFileSync("lib/oneko/skin-sheets.json", "utf8"));
mkdirSync("public/skins", { recursive: true });
for (const [id, source] of Object.entries(sheets))
  writeFileSync(`public/skins/${id}.png`, Buffer.from(source.split(",")[1], "base64"));
console.log(`Wrote ${Object.keys(sheets).length} sheets to public/skins`);
