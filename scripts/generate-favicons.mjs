import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const pub = join(root, "public");
const svgPath = join(pub, "favicon.svg");
const svg = readFileSync(svgPath);

/** Pixel-art SVG is 23×24; scale with nearest + pad so crisp edges survive. */
const png = (size) =>
  sharp(svg)
    .resize(size, size, {
      fit: "contain",
      position: "centre",
      kernel: sharp.kernel.nearest,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    })
    .png()
    .toBuffer();

const main = async () => {
  const [b16, b32, b180, b192, b512] = await Promise.all([
    png(16),
    png(32),
    png(180),
    png(192),
    png(512),
  ]);

  writeFileSync(join(pub, "favicon.ico"), await toIco([b16, b32]));
  writeFileSync(join(pub, "apple-touch-icon.png"), b180);
  writeFileSync(join(pub, "icon-192.png"), b192);
  writeFileSync(join(pub, "icon-512.png"), b512);

  console.log("Wrote favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
