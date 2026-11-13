// Rebuild the generated coats on the Classic sheet's exact pixel geometry.
//
// The concept sheets are image-model renders at ~6.9x scale with soft edges, thousands of
// near-duplicate colors and drifted poses. Resampling them straight to 256 x 128 breaks outlines.
// Instead, every coat keeps Classic's silhouettes and outlines, and takes only its colors from the
// concept: the concept is quantized to a small palette, reduced to sprite resolution, aligned to
// Classic cell by cell, and sampled for each fur pixel.
//
//   node scripts/prepare-generated-skins.mjs            rebuild runtime PNGs and the catalog
//   node scripts/prepare-generated-skins.mjs --out DIR  write PNGs to DIR only (preview)

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { crc32, deflateSync } from "node:zlib";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const catalog = new URL("lib/oneko/skin-sheets.json", root);
const sheets = JSON.parse(await readFile(catalog, "utf8"));
const outIndex = process.argv.indexOf("--out");
const previewDir = outIndex === -1 ? null : process.argv[outIndex + 1];

const W = 256;
const H = 128;
const CELL = 32;
const SEARCH = 6;
const POINT_START = 0.58;
const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// `points` lets the outline cluster also stand as fur, for coats whose fur is as dark as their
// outline (tuxedo); otherwise drifted concept outlines would read as markings. `colorpoint`
// skips sampling: the concept's poses differ too much for its markings to land in place, so
// the points are derived from Classic's own shapes instead. `eyes` colors Classic's eye pixels
// where they sit on dark fur, which would otherwise hide them.
const variants = {
  ginger: {},
  sage: {},
  siamese: { colorpoint: { eyes: [70, 120, 200] } },
  "strawberry-milk": {},
  "blue-frost": {},
  lavender: {},
  tuxedo: { points: true },
  peach: {},
  honey: {},
  mocha: {},
  mint: {},
  "midnight-blue": { eyes: [244, 170, 40] },
};

const classic = await decode(Buffer.from(sheets.classic.split(",")[1], "base64"));
if (classic.width !== W || classic.height !== H) throw new Error("Classic sheet must be 256 x 128");
const eyePixels = eyeIslands();

for (const [id, options] of Object.entries(variants)) {
  const concept = await decode(await readFile(new URL(`output/skins/${id}-concept.png`, root)));
  const png = await encode(recolor(concept, options));
  if (previewDir) {
    await mkdir(previewDir, { recursive: true });
    await writeFile(join(previewDir, `${id}.png`), png);
  } else {
    await writeFile(new URL(`output/skins/${id}.png`, root), png);
    sheets[id] = `data:image/png;base64,${png.toString("base64")}`;
  }
}

if (!previewDir) {
  await writeFile(catalog, `${JSON.stringify(sheets, null, 2)}\n`);
  await writeFile(
    new URL("lib/oneko/skin-ids.json", root),
    `${JSON.stringify(Object.keys(sheets), null, 2)}\n`,
  );
}

async function decode(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// Byte-for-byte what the studio's encodeSheet writes, so re-saving a coat in the studio
// never changes its size.
function encode(pixels) {
  const palette = new Map();
  const view = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  const colorAt = (i) => (pixels[i + 3] ? view.getUint32(i) : 0);
  const scanlines = Buffer.alloc((W + 1) * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const color = colorAt((y * W + x) * 4);
      if (!palette.has(color)) palette.set(color, palette.size);
      scanlines[y * (W + 1) + 1 + x] = palette.get(color);
    }
  }
  if (palette.size > 256) throw new Error("Coat needs more than 256 colors");
  const colors = [...palette.keys()];
  const header = Buffer.alloc(13);
  header.writeUInt32BE(W, 0);
  header.writeUInt32BE(H, 4);
  header[8] = 8;
  header[9] = 3;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk(
      "PLTE",
      Buffer.from(colors.flatMap((c) => [c >>> 24, (c >>> 16) & 255, (c >>> 8) & 255])),
    ),
    chunk("tRNS", Buffer.from(colors.map((c) => c & 255))),
    chunk("IDAT", deflateSync(scanlines)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function recolor(concept, { points = false, colorpoint, eyes }) {
  const palette = quantize(concept, 7);
  const outline = darkest(palette);
  if (colorpoint) return colorpointCoat(palette, outline, colorpoint);
  const small = reduce(concept, palette);
  const furLabels = new Set(palette.map((_, i) => i).filter((i) => points || i !== outline));
  const fur = mostCommon(small, furLabels, palette.length);
  // Shading clusters far darker than the coat are outline anti-aliasing in the concept; sampled
  // as fur they read as dirt.
  if (!points)
    for (const label of furLabels)
      if (luma(palette[label]) < luma(palette[fur]) * 0.5) furLabels.delete(label);
  const out = new Uint8ClampedArray(W * H * 4);

  for (let cy = 0; cy < H / CELL; cy++) {
    for (let cx = 0; cx < W / CELL; cx++) {
      const [dx, dy] = align(small, cx, cy);
      for (let y = cy * CELL; y < (cy + 1) * CELL; y++) {
        for (let x = cx * CELL; x < (cx + 1) * CELL; x++) {
          const i = (y * W + x) * 4;
          if (classic.data[i + 3] < 128) continue;
          let label;
          if (classic.data[i] < 128) label = outline;
          else label = nearestFur(small, x + dx, y + dy, furLabels, outline) ?? fur;
          out.set([...palette[label], 255], i);
        }
      }
    }
  }
  const coat = rim(smooth(out), palette, outline);
  if (eyes)
    for (const k of eyePixels) {
      const [x, y] = [k % W, Math.floor(k / W)];
      const onDarkFur = NEIGHBOURS.some(([u, v]) => {
        const j = ((y + v) * W + x + u) * 4;
        return classic.data[j] >= 128 && luma(coat.subarray(j, j + 3)) < 70;
      });
      if (onDarkFur) coat.set(eyes, k * 4);
    }
  return coat;
}

// Pale body with darker ears, legs, tail and face, the way a colorpoint coat darkens away from
// the warm core. Each frame's fur shades by distance from the cat's centroid, the mask also
// covers Classic's eyes (small outline islands that never touch the edge), and a mid tone
// softens each boundary.
function colorpointCoat(palette, outline, { eyes }) {
  const tones = palette.filter((_, i) => i !== outline).sort((a, b) => luma(b) - luma(a));
  const [body, mid, point] = [tones[0], tones[Math.floor(tones.length / 2)], tones.at(-1)];
  const opaque = (x, y) =>
    x >= 0 && y >= 0 && x < W && y < H && classic.data[(y * W + x) * 4 + 3] >= 128;
  const fur = (x, y) => opaque(x, y) && classic.data[(y * W + x) * 4] >= 128;

  const shade = new Uint8Array(W * H); // 0 body, 1 mid, 2 point
  for (let cy = 0; cy < H / CELL; cy++)
    for (let cx = 0; cx < W / CELL; cx++) {
      let n = 0;
      let sx = 0;
      let sy = 0;
      for (let y = cy * CELL; y < (cy + 1) * CELL; y++)
        for (let x = cx * CELL; x < (cx + 1) * CELL; x++)
          if (opaque(x, y)) [n, sx, sy] = [n + 1, sx + x, sy + y];
      if (!n) continue;
      const [ox, oy] = [sx / n, sy / n];
      let reach = 0;
      for (let y = cy * CELL; y < (cy + 1) * CELL; y++)
        for (let x = cx * CELL; x < (cx + 1) * CELL; x++)
          if (fur(x, y)) reach = Math.max(reach, Math.hypot(x - ox, y - oy));
      for (let y = cy * CELL; y < (cy + 1) * CELL; y++)
        for (let x = cx * CELL; x < (cx + 1) * CELL; x++) {
          if (!fur(x, y)) continue;
          let nearEye = false;
          for (let v = -1; v <= 1; v++)
            for (let u = -1; u <= 1; u++) if (eyePixels.has((y + v) * W + x + u)) nearEye = true;
          const t = Math.hypot(x - ox, y - oy) / reach;
          shade[y * W + x] = nearEye || t > POINT_START ? 2 : t > POINT_START - 0.1 ? 1 : 0;
        }
    }

  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!opaque(x, y)) continue;
      const k = y * W + x;
      let color = palette[outline];
      if (eyePixels.has(k)) {
        const masked = NEIGHBOURS.some(([u, v]) => shade[(y + v) * W + x + u] === 2);
        if (masked) color = eyes;
      } else if (fur(x, y)) color = [body, mid, point][shade[k]];
      out.set([...color, 255], k * 4);
    }
  return smooth(out);
}

// Classic's eyes: 8-connected outline islands of at most 4 pixels that never touch the edge.
function eyeIslands() {
  const opaque = (x, y) =>
    x >= 0 && y >= 0 && x < W && y < H && classic.data[(y * W + x) * 4 + 3] >= 128;
  const line = (x, y) => opaque(x, y) && classic.data[(y * W + x) * 4] < 128;
  const eyePixels = new Set();
  const seen = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (seen[y * W + x] || !line(x, y)) continue;
      const stack = [[x, y]];
      const group = [];
      let edge = false;
      seen[y * W + x] = 1;
      while (stack.length) {
        const [px, py] = stack.pop();
        group.push(py * W + px);
        for (const [u, v] of NEIGHBOURS) if (!opaque(px + u, py + v)) edge = true;
        for (let v = -1; v <= 1; v++)
          for (let u = -1; u <= 1; u++) {
            const nx = px + u;
            const ny = py + v;
            if (line(nx, ny) && !seen[ny * W + nx]) {
              seen[ny * W + nx] = 1;
              stack.push([nx, ny]);
            }
          }
      }
      if (!edge && group.length <= 4) for (const p of group) eyePixels.add(p);
    }

  return eyePixels;
}

// Classic draws eyes, mouths and leg seams as interior outline pixels, which vanish against dark
// fur. Like the hand-drawn Black coat, draw those in a light tone wherever the fur is dark.
function rim(pixels, palette, outline) {
  const lines = palette.filter((c, i) => i !== outline && luma(c) >= 80);
  const tone = lines.length
    ? lines.reduce((a, b) => (Math.abs(luma(a) - 140) <= Math.abs(luma(b) - 140) ? a : b))
    : [150, 150, 160];
  const out = new Uint8ClampedArray(pixels);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      if (classic.data[i + 3] < 128 || classic.data[i] >= 128) continue;
      const around = [i - 4, i + 4, i - W * 4, i + W * 4];
      if (around.some((j) => classic.data[j + 3] < 128)) continue;
      const darkFur = around.some(
        (j) => classic.data[j] >= 128 && luma(pixels.subarray(j, j + 3)) < 70,
      );
      if (darkFur) out.set(tone, i);
    }
  }
  return out;
}

// Small k-means over opaque concept pixels; deterministic farthest-point seeding.
function quantize({ data }, k) {
  const samples = [];
  for (let i = 0; i < data.length; i += 4 * 3) {
    if (data[i + 3] >= 200) samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  const centers = [samples[0]];
  while (centers.length < k) {
    let best = samples[0];
    let bestDistance = -1;
    for (const s of samples) {
      const d = Math.min(...centers.map((c) => distance(s, c)));
      if (d > bestDistance) [best, bestDistance] = [s, d];
    }
    centers.push(best);
  }
  for (let round = 0; round < 12; round++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const s of samples) {
      const sum = sums[closest(centers, s)];
      sum[0] += s[0];
      sum[1] += s[1];
      sum[2] += s[2];
      sum[3]++;
    }
    sums.forEach((sum, j) => {
      if (sum[3]) centers[j] = [sum[0] / sum[3], sum[1] / sum[3], sum[2] / sum[3]];
    });
  }
  // Merge clusters that ended up nearly identical, then drop ones too rare to be a real color.
  const counts = Array.from(centers, () => 0);
  for (const s of samples) counts[closest(centers, s)]++;
  const kept = centers
    .map((c, j) => ({ c, n: counts[j] }))
    .filter(({ n }) => n > samples.length * 0.004)
    .sort((a, b) => b.n - a.n);
  const merged = [];
  for (const { c } of kept) if (!merged.some((m) => distance(m, c) < 18 ** 2)) merged.push(c);
  return merged.map((c) => c.map(Math.round));
}

// Concept -> 256 x 128 labels, voting over the middle of each source block. -1 is transparent.
function reduce(concept, palette) {
  const sx = concept.width / W;
  const sy = concept.height / H;
  const labels = new Int8Array(W * H);
  const votes = Array.from({ length: palette.length + 1 }, () => 0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      votes.fill(0);
      for (let v = 0.25; v < 0.8; v += 0.15) {
        for (let u = 0.25; u < 0.8; u += 0.15) {
          const px = Math.floor((x + u) * sx);
          const py = Math.floor((y + v) * sy);
          const i = (py * concept.width + px) * 4;
          if (concept.data[i + 3] < 128) votes[palette.length]++;
          else votes[closest(palette, concept.data.subarray(i, i + 3))]++;
        }
      }
      const winner = votes.indexOf(Math.max(...votes));
      labels[y * W + x] = winner === palette.length ? -1 : winner;
    }
  }
  return labels;
}

// Shift that best overlays the concept cell's silhouette on Classic's.
function align(small, cx, cy) {
  let best = [0, 0];
  let bestScore = -Infinity;
  for (let dy = -SEARCH; dy <= SEARCH; dy++) {
    for (let dx = -SEARCH; dx <= SEARCH; dx++) {
      let score = 0;
      for (let y = cy * CELL; y < (cy + 1) * CELL; y++) {
        for (let x = cx * CELL; x < (cx + 1) * CELL; x++) {
          const a = classic.data[(y * W + x) * 4 + 3] >= 128;
          const b = labelAt(small, x + dx, y + dy) >= 0;
          if (a && b) score++;
          else if (a !== b) score -= 1;
        }
      }
      score -= (Math.abs(dx) + Math.abs(dy)) * 0.5;
      if (score > bestScore) [best, bestScore] = [[dx, dy], score];
    }
  }
  return best;
}

function nearestFur(small, x, y, furLabels, outline) {
  const here = labelAt(small, x, y);
  // A dark concept pixel counts as a marking only when it sits inside a dark patch,
  // not on a one-pixel outline that drifted into the fur.
  if (furLabels.has(here) && (here !== outline || darkPatch(small, x, y, outline))) return here;
  for (let r = 1; r <= 3; r++) {
    const counts = new Map();
    for (let v = -r; v <= r; v++) {
      for (let u = -r; u <= r; u++) {
        const label = labelAt(small, x + u, y + v);
        if (label === outline || !furLabels.has(label)) continue;
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
    }
    if (counts.size) return [...counts].sort((a, b) => b[1] - a[1])[0][0];
  }
  return null;
}

function darkPatch(small, x, y, outline) {
  let n = 0;
  for (let v = -1; v <= 1; v++)
    for (let u = -1; u <= 1; u++) if (labelAt(small, x + u, y + v) === outline) n++;
  return n >= 7;
}

// Majority filter over fur pixels: sampling a drifted concept leaves specks and ragged
// marking edges, so each fur pixel takes the color most of its fur neighbours share. Rare vivid
// colors are eyes and stay put.
function smooth(pixels) {
  const usage = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const k = (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2];
    usage.set(k, (usage.get(k) ?? 0) + 1);
  }
  const opaque = [...usage.values()].reduce((a, b) => a + b, 0);
  const vivid = (i) =>
    usage.get((pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2]) < opaque * 0.03 &&
    Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) -
      Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) >
      150;
  const isFur = (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < W &&
    y < H &&
    classic.data[(y * W + x) * 4 + 3] >= 128 &&
    classic.data[(y * W + x) * 4] >= 128;
  let current = pixels;
  for (let pass = 0; pass < 2; pass++) {
    const out = new Uint8ClampedArray(current);
    const key = (i) => (current[i] << 16) | (current[i + 1] << 8) | current[i + 2];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (!isFur(x, y) || vivid(i)) continue;
        const counts = new Map();
        for (let v = -1; v <= 1; v++) {
          for (let u = -1; u <= 1; u++) {
            if ((!u && !v) || !isFur(x + u, y + v)) continue;
            const k = key(((y + v) * W + x + u) * 4);
            counts.set(k, (counts.get(k) ?? 0) + 1);
          }
        }
        const [winner, n] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
        const own = counts.get(key(i)) ?? 0;
        if (winner !== undefined && winner !== key(i) && (own <= 1 || n >= own + 3))
          out.set([winner >> 16, (winner >> 8) & 255, winner & 255], i);
      }
    }
    current = out;
  }
  return current;
}

function labelAt(small, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return -1;
  return small[y * W + x];
}

function mostCommon(small, allowed, size) {
  const counts = Array.from({ length: size }, () => 0);
  for (const label of small) if (allowed.has(label)) counts[label]++;
  return counts.indexOf(Math.max(...counts));
}

function luma(c) {
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function darkest(palette) {
  return palette.reduce((best, c, i) => (luma(c) < luma(palette[best]) ? i : best), 0);
}

function closest(palette, c) {
  let best = 0;
  let bestDistance = Infinity;
  for (let j = 0; j < palette.length; j++) {
    const d = distance(palette[j], c);
    if (d < bestDistance) [best, bestDistance] = [j, d];
  }
  return best;
}

function distance(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}
