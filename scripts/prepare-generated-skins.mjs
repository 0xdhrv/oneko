import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const catalog = new URL("lib/oneko/skin-sheets.json", root);
const sheets = JSON.parse(await readFile(catalog, "utf8"));
const variants = [
  "ginger",
  "sage",
  "siamese",
  "strawberry-milk",
  "blue-frost",
  "lavender",
  "tuxedo",
  "peach",
  "honey",
  "mocha",
  "mint",
  "midnight-blue",
];

for (const id of variants) {
  const { data, info } = await sharp(
    await readFile(new URL(`output/skins/${id}-concept.png`, root)),
  )
    .resize(256, 128, { kernel: "nearest" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Keep solid pixel edges instead of generated semi-transparent fringes.
  for (let offset = 0; offset < data.length; offset += 4) {
    const visible = data[offset + 3] >= 128;
    data[offset + 3] = visible ? 255 : 0;
    if (!visible) data.fill(0, offset, offset + 3);
  }
  const png = await sharp(data, { raw: info }).png().toBuffer();
  await writeFile(new URL(`output/skins/${id}.png`, root), png);
  sheets[id] = `data:image/png;base64,${png.toString("base64")}`;
}

await writeFile(catalog, `${JSON.stringify(sheets, null, 2)}\n`);
