import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { defaultSpriteSets, TILE } from "./constants";
import { getBundledSkinSource } from "../bundled-skins";
import { getSkinSource, isOnekoSkin, loadSkinSource, ONEKO_SKINS, type OnekoSkin } from "./skins";
import sheets from "./skin-sheets.json";
import classicSheet from "./skin-classic.json";
import skinIds from "./skin-ids.json";
import { SKIN_CATALOG } from "./skin-catalog";

describe("bundled cat skins", () => {
  it("exposes exactly the bundled sheet IDs, without duplicate or missing catalog entries", () => {
    expect(ONEKO_SKINS.map(({ id }) => id).sort()).toEqual(Object.keys(sheets).sort());
    expect(new Set(SKIN_CATALOG.map(({ id }) => id)).size).toBe(SKIN_CATALOG.length);
  });
  it.each(ONEKO_SKINS)(
    "$name contains every animation frame at the original pixel size",
    async ({ id }) => {
      const data = Buffer.from(getBundledSkinSource(id).split(",")[1], "base64");
      const metadata = await sharp(data).metadata();
      expect([metadata.width, metadata.height]).toEqual([256, 128]);
      expect(metadata.hasAlpha).toBe(true);
      for (const frames of Object.values(defaultSpriteSets)) {
        for (const [x, y] of frames) {
          const { data: pixels } = await sharp(data)
            .extract({
              left: -x * TILE,
              top: -y * TILE,
              width: TILE,
              height: TILE,
            })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          expect(pixels.some((value, index) => index % 4 === 3 && value > 0)).toBe(true);
        }
      }
    },
  );
  it("falls back to the classic cat for unknown skin IDs", async () => {
    expect(isOnekoSkin("__proto__")).toBe(false);
    expect(getSkinSource("unknown" as OnekoSkin)).toBe(sheets.classic);
    expect(await loadSkinSource("unknown" as OnekoSkin)).toBe(sheets.classic);
  });
  it("keeps the inline classic sheet and skin IDs in sync with the bundled sheets", () => {
    expect(classicSheet).toEqual({ classic: sheets.classic });
    expect(skinIds).toEqual(Object.keys(sheets));
  });
  it("has classic ready immediately and loads other skins on demand", async () => {
    expect(getSkinSource("classic")).toBe(sheets.classic);
    expect(getSkinSource("calico")).toBeUndefined();
    expect(await loadSkinSource("calico")).toBe(sheets.calico);
    expect(getSkinSource("calico")).toBe(sheets.calico);
  });
});
