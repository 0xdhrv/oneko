// Generates public/oneko-loop.svg: a single classic oneko looping through
// sleep → wake → run → scratch → run back → sleep, for the GitHub README.
// GitHub serves README SVGs through <img>, so the sprite sheet is inlined and
// the animation uses SMIL (no scripts, no external references).
import { readFileSync, writeFileSync } from "node:fs";

const TILE = 32;
const TICK = 0.1; // seconds per frame, matches the 100 ms oneko loop
const WIDTH = 224;
const STEP = 8; // px moved per running frame
const SCALE = 3;

// Subset of defaultSpriteSets from lib/oneko/constants.ts.
const sprites = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [
    [-5, 0],
    [-6, 0],
    [-7, 0],
  ],
  tired: [[-3, -2]],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
};

const sheet = JSON.parse(readFileSync("lib/oneko/skin-sheets.json", "utf8")).classic;

const frames = [];
let x = 8;
const hold = (name, ticks, every = 1) => {
  for (let i = 0; i < ticks; i++) {
    frames.push({
      sprite: sprites[name][Math.floor(i / every) % sprites[name].length],
      x,
    });
  }
};
const run = (dir, to) => {
  const sign = Math.sign(to - x);
  let i = 0;
  while (x !== to) {
    x += sign * Math.min(STEP, Math.abs(to - x));
    frames.push({ sprite: sprites[dir][i++ % 2], x });
  }
};

const right = WIDTH - TILE - 8;
hold("sleeping", 32, 8);
hold("alert", 8);
run("E", right);
hold("idle", 6);
hold("scratchSelf", 18, 2);
hold("idle", 6);
hold("alert", 6);
run("W", 8);
hold("idle", 6);
hold("tired", 12);

const dur = (frames.length * TICK).toFixed(1);
const keyTimes = frames.map((_, i) => (i / frames.length).toFixed(4)).join(";");
const values = (fn) => frames.map(fn).join(";");
const anim = (attr, fn) =>
  `<animate attributeName="${attr}" dur="${dur}s" repeatCount="indefinite" calcMode="discrete" keyTimes="${keyTimes}" values="${values(fn)}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH * SCALE}" height="${TILE * SCALE}" viewBox="0 0 ${WIDTH} ${TILE}" role="img" aria-label="Oneko pixel cat waking up, running, and going back to sleep">
<svg x="${frames[0].x}" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}" overflow="hidden">
${anim("x", (f) => f.x)}
<image href="${sheet}" width="256" height="128" x="${frames[0].sprite[0] * TILE}" y="${frames[0].sprite[1] * TILE}" style="image-rendering:pixelated" image-rendering="optimizeSpeed">
${anim("x", (f) => f.sprite[0] * TILE)}
${anim("y", (f) => f.sprite[1] * TILE)}
</image>
</svg>
</svg>
`;

writeFileSync("public/oneko-loop.svg", svg);
console.log(
  `public/oneko-loop.svg: ${frames.length} frames, ${dur}s, ${(svg.length / 1024).toFixed(1)} KB`,
);
