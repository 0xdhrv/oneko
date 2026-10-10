import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const out = join(root, "public", "og.png");
const sheets = JSON.parse(readFileSync(join(root, "lib/oneko/skin-sheets.json"), "utf8"));
const font = readFileSync(
  join(root, "node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Square.woff2"),
).toString("base64");

/** Sheets are 8×4 grids of 32px frames; coordinates match `defaultSpriteSets`. */
const SCALE = 4;
const cats = [
  { skin: "classic", frame: [3, 3] }, // idle
  { skin: "calico", frame: [3, 0] }, // running east
  { skin: "black", frame: [5, 0] }, // scratching
  { skin: "ginger", frame: [7, 3] }, // alert
  { skin: "siamese", frame: [3, 2] }, // tired
  { skin: "gray", frame: [2, 0] }, // sleeping
];

const catHtml = cats
  .map(
    ({ skin, frame: [x, y] }) =>
      `<div class="cat" style="background-image:url(${sheets[skin]});background-position:-${x * 32 * SCALE}px -${y * 32 * SCALE}px"></div>`,
  )
  .join("");

const html = `<!doctype html><html><head><style>
@font-face { font-family: Pixel; src: url(data:font/woff2;base64,${font}) format("woff2"); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #0a0a0a; color: #fafafa;
  font-family: Pixel, monospace; display: flex; flex-direction: column;
  justify-content: space-between; padding: 72px 80px; }
.eyebrow { font-size: 22px; letter-spacing: 0.08em; color: #e89f5e; }
h1 { font-size: 132px; font-weight: 400; line-height: 1; margin-top: 18px; }
p { font-size: 34px; color: #a1a1a1; margin-top: 18px; }
.row { display: flex; align-items: flex-end; justify-content: space-between; }
.cats { display: flex; gap: 8px; }
.cat { width: ${32 * SCALE}px; height: ${32 * SCALE}px; image-rendering: pixelated;
  background-size: ${256 * SCALE}px ${128 * SCALE}px; }
.url { font-size: 24px; color: #a1a1a1; padding-bottom: 12px; }
</style></head><body>
<div><div class="eyebrow">REACT · SHADCN REGISTRY</div><h1>Oneko</h1>
<p>A tiny pixel cat that follows your cursor.</p></div>
<div class="row"><div class="cats">${catHtml}</div><div class="url">oneko.dhrv.pw</div></div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
  });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: out });
  console.log("Wrote public/og.png");
} finally {
  await browser.close();
}
