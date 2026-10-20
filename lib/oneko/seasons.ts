import { pixelArtSVG } from "./pixel-art";

/** Seasonal dress-up: a pixel hat and a few themed thoughts around a holiday. */
export type OnekoSeason = "halloween" | "winter" | "newYear";

const ONEKO_SEASONS = ["halloween", "winter", "newYear"] as const;

export function isOnekoSeason(value: unknown): value is OnekoSeason {
  return (ONEKO_SEASONS as readonly unknown[]).includes(value);
}

/**
 * The season on a date in the visitor's local time, or null. Halloween runs Oct 20–31, winter
 * Dec 18–29, and the new year Dec 30–Jan 2.
 */
export function seasonForDate(date: Date): OnekoSeason | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  if (month === 10 && day >= 20) return "halloween";
  if (month === 12 && day >= 18 && day <= 29) return "winter";
  if ((month === 12 && day >= 30) || (month === 1 && day <= 2)) return "newYear";
  return null;
}

/** Which season to dress for: true follows the calendar, a season name forces it, false opts out. */
export function resolveSeason(
  setting: boolean | OnekoSeason,
  date = new Date(),
): OnekoSeason | null {
  if (setting === false) return null;
  if (setting === true) return seasonForDate(date);
  return isOnekoSeason(setting) ? setting : null;
}

export const SEASON_MESSAGES: Record<OnekoSeason, readonly string[]> = {
  halloween: [
    "trick or treat. mostly treat",
    "I am the spooky one in this house",
    "black cat energy, any coat",
    "boo. did I scare you",
    "this pumpkin smells like nap",
    "I dressed up as a cat",
  ],
  winter: [
    "is the tree for climbing",
    "I helped wrap the presents",
    "the box is the present",
    "warm lap wanted, apply within",
    "snow is just cold sand",
  ],
  newYear: [
    "new year, same nap spot",
    "resolution: more treats",
    "the fireworks can stop now",
    "I stayed up past midnight. barely",
    "counting down to my next nap",
  ],
};

/** Hats drawn in pixels: each row is one line of the hat, "." is transparent. */
const HATS: Record<OnekoSeason, { rows: readonly string[]; colors: Record<string, string> }> = {
  halloween: {
    rows: [
      ".......PP..",
      "......PPP..",
      ".....PPPP..",
      ".....PPPP..",
      "....PPPPPP.",
      "....PPPPPP.",
      "...POOOOOP.",
      "PPPPPPPPPPP",
    ],
    colors: { P: "#4a2470", O: "#f28c28" },
  },
  winter: {
    rows: [
      "........WW.",
      ".......RWW.",
      "......RR...",
      ".....RRRR..",
      "....RRRRRR.",
      "...RRRRRRR.",
      "WWWWWWWWWWW",
      "WWWWWWWWWWW",
    ],
    colors: { R: "#d62839", W: "#f4f1ea" },
  },
  newYear: {
    rows: [
      ".....YY....",
      ".....GG....",
      "....GBBG...",
      "....BGGB...",
      "...GBBBBG..",
      "...BGGGGB..",
      "..GBBBBBBG.",
      "..BGGGGGGB.",
    ],
    colors: { Y: "#ffd23f", G: "#ffb627", B: "#2e86de" },
  },
};

/** Hat size in sprite pixels, including the one-pixel outline on every side. */
export const HAT_WIDTH = 13;
export const HAT_HEIGHT = 10;
export function hatSVG(season: OnekoSeason): string {
  return pixelArtSVG(HATS[season].rows, HATS[season].colors);
}

/** Offset of the hat's top-left corner within a sprite frame, or null for an unknown frame. */
export function hatOffset(spriteX: number, spriteY: number): { left: number; top: number } | null {
  const anchor = HAT_ANCHORS[`${spriteX},${spriteY}`];
  if (!anchor) return null;
  // The brim's bottom row sits on the anchor; the outline row below overlaps the head outline.
  return { left: anchor[0] - Math.floor(HAT_WIDTH / 2), top: anchor[1] - (HAT_HEIGHT - 1) };
}

/**
 * Where the top of the head is in each 32 × 32 frame, keyed by the sprite offsets used in
 * constants.ts ("-col,-row"). Values are [x, y] of the hat's bottom center within the frame.
 */
export const HAT_ANCHORS: Record<string, readonly [number, number]> = {
  // idle, tired, alert: sitting, facing the viewer
  "-3,-3": [16, 6],
  "-3,-2": [16, 6],
  "-7,-3": [16, 5],
  // scratchSelf
  "-5,0": [11, 7],
  "-6,0": [11, 7],
  "-7,0": [14, 5],
  // scratchWallN: seen from behind
  "0,0": [15, 4],
  "0,-1": [15, 4],
  // scratchWallS
  "-7,-1": [16, 13],
  "-6,-2": [16, 13],
  // scratchWallE
  "-2,-2": [25, 4],
  "-2,-3": [25, 4],
  // scratchWallW
  "-4,0": [7, 4],
  "-4,-1": [7, 4],
  // sleeping
  "-2,0": [18, 13],
  "-2,-1": [19, 16],
  // N
  "-1,-2": [16, 4],
  "-1,-3": [16, 4],
  // NE
  "0,-2": [22, 5],
  "0,-3": [22, 4],
  // E
  "-3,0": [25, 7],
  "-3,-1": [25, 7],
  // SE
  "-5,-1": [26, 12],
  "-5,-2": [23, 10],
  // S
  "-6,-3": [16, 4],
  "-7,-2": [16, 4],
  // SW
  "-5,-3": [7, 12],
  "-6,-1": [7, 10],
  // W
  "-4,-2": [7, 7],
  "-4,-3": [7, 7],
  // NW
  "-1,0": [10, 5],
  "-1,-1": [10, 5],
};
