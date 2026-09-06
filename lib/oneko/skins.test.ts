import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { defaultSpriteSets, TILE } from "./constants";
import { getSkinSource, isOnekoSkin, ONEKO_SKINS, type OnekoSkin } from "./skins";

describe("bundled cat skins", () => {
  it.each(ONEKO_SKINS)(
    "$name contains every animation frame at the original pixel size",
    async ({ id }) => {
      const data = Buffer.from(getSkinSource(id).split(",")[1], "base64");
      const metadata = await sharp(data).metadata();
      expect([metadata.width, metadata.height]).toEqual([256, 128]);
      expect(metadata.hasAlpha).toBe(true);
      for (const frames of Object.values(defaultSpriteSets)) {
        for (const [x, y] of frames) {
          const { data: pixels } = await sharp(data)
            .extract({ left: -x * TILE, top: -y * TILE, width: TILE, height: TILE })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          expect(pixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(true);
        }
      }
    },
  );
  it("falls back to the classic cat for unknown skin IDs", () => {
    expect(isOnekoSkin("__proto__")).toBe(false);
    expect(getSkinSource("unknown" as OnekoSkin)).toBe(getSkinSource("classic"));
  });
});
