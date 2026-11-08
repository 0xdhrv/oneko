import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { getBundledSkinSource } from "../bundled-skins";
import { isSavedSprite } from "./custom-assets";
import { ONEKO_SKINS } from "./skins";
import {
  countBlankFrames,
  encodeSheet,
  fillArea,
  flipPixels,
  getPixel,
  hexToColor,
  colorToHex,
  packColor,
  readFrame,
  replaceColor,
  setPixel,
  sheetColors,
  SHEET_HEIGHT,
  SHEET_WIDTH,
  SPRITE_ANIMATIONS,
  writeFrame,
} from "./sprite-sheet";

const RED = packColor(255, 0, 0);
const BLUE = packColor(0, 0, 255);
const frame = { column: 2, row: 1 };

async function sheetOf(source: string) {
  const png = Buffer.from(source.split(",")[1], "base64");
  const { data } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return new Uint8ClampedArray(data);
}

describe("sprite sheet", () => {
  it("names each of the 32 frames exactly once", () => {
    const cells = SPRITE_ANIMATIONS.flatMap((animation) =>
      animation.frames.map(({ column, row }) => `${column},${row}`),
    );
    expect(cells).toHaveLength(32);
    expect(new Set(cells).size).toBe(32);
  });

  it("pairs mirrored animations both ways", () => {
    for (const animation of SPRITE_ANIMATIONS) {
      if (!animation.mirror) continue;
      const other = SPRITE_ANIMATIONS.find((candidate) => candidate.id === animation.mirror);
      expect(other?.mirror).toBe(animation.id);
    }
  });

  it("converts colors without losing the top bit", () => {
    expect(colorToHex(hexToColor("#ff8000"))).toBe("#ff8000");
    expect(hexToColor("#ffffff")).toBe(0xffffffff);
  });

  it("fills only the connected area inside its frame", () => {
    const sheet = new Uint8ClampedArray(SHEET_WIDTH * SHEET_HEIGHT * 4);
    for (let y = 0; y < 32; y++) setPixel(sheet, frame, 10, y, RED);
    fillArea(sheet, frame, 0, 0, BLUE);
    expect(getPixel(sheet, frame, 9, 31)).toBe(BLUE);
    expect(getPixel(sheet, frame, 10, 5)).toBe(RED);
    expect(getPixel(sheet, frame, 11, 5)).toBe(0);
    expect(getPixel(sheet, { column: 1, row: 1 }, 31, 0)).toBe(0);
  });

  it("flips a frame and writes it back in place", () => {
    const sheet = new Uint8ClampedArray(SHEET_WIDTH * SHEET_HEIGHT * 4);
    setPixel(sheet, frame, 3, 7, RED);
    writeFrame(sheet, frame, flipPixels(readFrame(sheet, frame)));
    expect(getPixel(sheet, frame, 28, 7)).toBe(RED);
    expect(getPixel(sheet, frame, 3, 7)).toBe(0);
  });

  it("swaps one color across the sheet", () => {
    const sheet = new Uint8ClampedArray(SHEET_WIDTH * SHEET_HEIGHT * 4);
    setPixel(sheet, frame, 0, 0, RED);
    setPixel(sheet, { column: 7, row: 3 }, 31, 31, RED);
    replaceColor(sheet, RED, BLUE);
    expect(sheetColors(sheet)).toEqual([BLUE]);
  });

  it("counts frames the cat would vanish in", () => {
    const sheet = new Uint8ClampedArray(SHEET_WIDTH * SHEET_HEIGHT * 4);
    expect(countBlankFrames(sheet)).toBe(32);
    setPixel(sheet, frame, 0, 0, RED);
    expect(countBlankFrames(sheet)).toBe(31);
  });

  it("encodes a valid sheet that decodes to the same pixels", async () => {
    const original = await sheetOf(getBundledSkinSource("calico"));
    setPixel(original, frame, 4, 4, packColor(9, 8, 7, 128));
    const encoded = await encodeSheet(original);
    expect(isSavedSprite(encoded)).toBe(true);
    const decoded = await sheetOf(encoded);
    expect(sheetColors(decoded).length).toBe(sheetColors(original).length);
    expect(getPixel(decoded, frame, 4, 4)).toBe(packColor(9, 8, 7, 128));
    expect(countBlankFrames(decoded)).toBe(0);
  });

  it("keeps sheets with too many colors for a palette", async () => {
    const noise = new Uint8ClampedArray(SHEET_WIDTH * SHEET_HEIGHT * 4);
    for (let offset = 0; offset < noise.length; offset += 4) {
      noise[offset] = offset & 255;
      noise[offset + 1] = (offset >> 8) & 255;
      noise[offset + 3] = 255;
    }
    const encoded = await encodeSheet(noise);
    expect(isSavedSprite(encoded)).toBe(true);
    expect(await sheetOf(encoded)).toEqual(noise);
  });

  it("uses a palette for up to 256 colors and full color beyond, both exact", async () => {
    // Transparent counts as one palette entry, so 255 opaque colors fill the palette.
    const withColors = (count: number) => {
      const sheet = new Uint8ClampedArray(SHEET_WIDTH * SHEET_HEIGHT * 4);
      for (let i = 0; i < count; i++) sheet.set([i & 255, i >> 8, 7, 255], i * 4);
      return sheet;
    };
    const colorType = (source: string) => Buffer.from(source.split(",")[1], "base64")[25];
    for (const [opaque, type] of [
      [255, 3],
      [256, 6],
    ]) {
      const sheet = withColors(opaque);
      const encoded = await encodeSheet(sheet);
      expect(colorType(encoded), `${opaque} colors`).toBe(type);
      expect(await sheetOf(encoded)).toEqual(sheet);
    }
  });

  it("never makes a built-in coat larger", async () => {
    for (const { id } of ONEKO_SKINS) {
      const source = getBundledSkinSource(id);
      const encoded = await encodeSheet(await sheetOf(source));
      expect(encoded.length, id).toBeLessThanOrEqual(source.length);
    }
  });
});
