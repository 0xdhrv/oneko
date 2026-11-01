import { defaultSpriteSets, TILE } from "./constants";

export const SHEET_WIDTH = 256;
export const SHEET_HEIGHT = 128;

export type Frame = { column: number; row: number };
/** RGBA packed into one number, red in the high byte. */
export type Color = number;

const NAMES: Record<keyof typeof defaultSpriteSets, string> = {
  idle: "Sit",
  alert: "Ears up",
  tired: "Sleepy",
  sleeping: "Nap",
  scratchSelf: "Groom",
  scratchWallN: "Claw up",
  scratchWallE: "Claw right",
  scratchWallS: "Claw down",
  scratchWallW: "Claw left",
  N: "Run up",
  NE: "Run up right",
  E: "Run right",
  SE: "Run down right",
  S: "Run down",
  SW: "Run down left",
  W: "Run left",
  NW: "Run up left",
};

const MIRRORS: Partial<Record<keyof typeof defaultSpriteSets, keyof typeof defaultSpriteSets>> = {
  scratchWallE: "scratchWallW",
  scratchWallW: "scratchWallE",
  NE: "NW",
  NW: "NE",
  E: "W",
  W: "E",
  SE: "SW",
  SW: "SE",
};

/** Every animation in drawing order. Each of the 32 frames belongs to exactly one. */
export const SPRITE_ANIMATIONS = (Object.keys(NAMES) as (keyof typeof defaultSpriteSets)[]).map(
  (id) => ({
    id,
    name: NAMES[id],
    mirror: MIRRORS[id],
    frames: defaultSpriteSets[id].map(([x, y]) => ({
      column: -x,
      row: -y,
    })) as Frame[],
  }),
);

export const packColor = (red: number, green: number, blue: number, alpha = 255): Color =>
  ((red << 24) | (green << 16) | (blue << 8) | alpha) >>> 0;

export const colorToHex = (color: Color) => `#${(color >>> 8).toString(16).padStart(6, "0")}`;

export const hexToColor = (hex: string) => packColor(...parseHex(hex));

function parseHex(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

const offsetOf = (x: number, y: number) => (y * SHEET_WIDTH + x) * 4;

const readColor = (sheet: Uint8ClampedArray, offset: number): Color =>
  packColor(sheet[offset], sheet[offset + 1], sheet[offset + 2], sheet[offset + 3]);

function writeColor(sheet: Uint8ClampedArray, offset: number, color: Color) {
  sheet[offset] = color >>> 24;
  sheet[offset + 1] = (color >>> 16) & 255;
  sheet[offset + 2] = (color >>> 8) & 255;
  sheet[offset + 3] = color & 255;
}

export function getPixel(sheet: Uint8ClampedArray, frame: Frame, x: number, y: number): Color {
  return readColor(sheet, offsetOf(frame.column * TILE + x, frame.row * TILE + y));
}

export function setPixel(
  sheet: Uint8ClampedArray,
  frame: Frame,
  x: number,
  y: number,
  color: Color,
) {
  writeColor(sheet, offsetOf(frame.column * TILE + x, frame.row * TILE + y), color);
}

/** Fill the connected area of one color, staying inside the frame. */
export function fillArea(
  sheet: Uint8ClampedArray,
  frame: Frame,
  startX: number,
  startY: number,
  color: Color,
) {
  const target = getPixel(sheet, frame, startX, startY);
  if (target === color) return;
  const pending = [[startX, startY]];
  while (pending.length) {
    const [x, y] = pending.pop()!;
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) continue;
    if (getPixel(sheet, frame, x, y) !== target) continue;
    setPixel(sheet, frame, x, y, color);
    pending.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}

export function readFrame(sheet: Uint8ClampedArray, frame: Frame): Uint8ClampedArray<ArrayBuffer> {
  const pixels = new Uint8ClampedArray(TILE * TILE * 4);
  for (let y = 0; y < TILE; y++)
    pixels.set(
      sheet.subarray(
        offsetOf(frame.column * TILE, frame.row * TILE + y),
        offsetOf(frame.column * TILE + TILE, frame.row * TILE + y),
      ),
      y * TILE * 4,
    );
  return pixels;
}

export function writeFrame(sheet: Uint8ClampedArray, frame: Frame, pixels: Uint8ClampedArray) {
  for (let y = 0; y < TILE; y++)
    sheet.set(
      pixels.subarray(y * TILE * 4, (y + 1) * TILE * 4),
      offsetOf(frame.column * TILE, frame.row * TILE + y),
    );
}

export function flipPixels(pixels: Uint8ClampedArray): Uint8ClampedArray {
  const flipped = new Uint8ClampedArray(pixels.length);
  for (let y = 0; y < TILE; y++)
    for (let x = 0; x < TILE; x++) {
      const from = (y * TILE + x) * 4;
      const to = (y * TILE + TILE - 1 - x) * 4;
      flipped.set(pixels.subarray(from, from + 4), to);
    }
  return flipped;
}

export function replaceColor(sheet: Uint8ClampedArray, from: Color, to: Color) {
  for (let offset = 0; offset < sheet.length; offset += 4)
    if (readColor(sheet, offset) === from) writeColor(sheet, offset, to);
}

/** Visible colors, most used first. */
export function sheetColors(sheet: Uint8ClampedArray): Color[] {
  const counts = new Map<Color, number>();
  for (let offset = 0; offset < sheet.length; offset += 4) {
    if (sheet[offset + 3] === 0) continue;
    const color = readColor(sheet, offset);
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).map(([color]) => color);
}

/** Frames with nothing in them, where the cat would vanish mid-animation. */
export function countBlankFrames(sheet: Uint8ClampedArray): number {
  return SPRITE_ANIMATIONS.flatMap((animation) => animation.frames).filter((frame) =>
    readFrame(sheet, frame).every((value, index) => index % 4 !== 3 || value === 0),
  ).length;
}

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  for (let index = 0; index < 4; index++) chunk[4 + index] = type.charCodeAt(index);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

async function zlib(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * A palette PNG. Canvas exports are always 32-bit, roughly three times larger for this art,
 * which matters when the sheet travels inside a share link.
 */
export async function encodeSheet(sheet: Uint8ClampedArray): Promise<string> {
  const palette = new Map<Color, number>();
  for (let offset = 0; offset < sheet.length; offset += 4) {
    const color = sheet[offset + 3] ? readColor(sheet, offset) : 0;
    if (!palette.has(color) && palette.size <= 256) palette.set(color, palette.size);
  }
  const indexed = palette.size <= 256;
  const stride = SHEET_WIDTH * (indexed ? 1 : 4) + 1;
  const scanlines = new Uint8Array(stride * SHEET_HEIGHT);
  for (let y = 0; y < SHEET_HEIGHT; y++)
    for (let x = 0; x < SHEET_WIDTH; x++) {
      const offset = offsetOf(x, y);
      if (indexed) {
        const color = sheet[offset + 3] ? readColor(sheet, offset) : 0;
        scanlines[y * stride + 1 + x] = palette.get(color)!;
      } else {
        scanlines.set(sheet.subarray(offset, offset + 4), y * stride + 1 + x * 4);
      }
    }

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, SHEET_WIDTH);
  view.setUint32(4, SHEET_HEIGHT);
  header[8] = 8;
  header[9] = indexed ? 3 : 6;
  const chunks = [pngChunk("IHDR", header)];
  if (indexed) {
    const colors = [...palette.keys()];
    chunks.push(
      pngChunk(
        "PLTE",
        Uint8Array.from(colors.flatMap((c) => [c >>> 24, (c >>> 16) & 255, (c >>> 8) & 255])),
      ),
      pngChunk(
        "tRNS",
        Uint8Array.from(colors, (color) => color & 255),
      ),
    );
  }
  chunks.push(pngChunk("IDAT", await zlib(scanlines)), pngChunk("IEND", new Uint8Array()));

  const signature = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const file = new Blob([signature, ...chunks] as BlobPart[]);
  const bytes = new Uint8Array(await file.arrayBuffer());
  return `data:image/png;base64,${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`;
}

/** Read a sheet's pixels. Hosted coats need CORS for this; embedded ones always work. */
export async function decodeSheet(source: string): Promise<Uint8ClampedArray> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.referrerPolicy = "no-referrer";
  image.src = source;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_WIDTH;
  canvas.height = SHEET_HEIGHT;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, SHEET_WIDTH, SHEET_HEIGHT).data;
}
