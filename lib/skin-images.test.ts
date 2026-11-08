import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { getBundledSkinSource } from "./bundled-skins";
import { ONEKO_SKINS } from "./oneko/skins";
import { skinImageURL } from "./skin-images";

it("serves every coat as a static image that matches its bundled sheet", () => {
  for (const { id } of ONEKO_SKINS) {
    const file = readFileSync(`public${skinImageURL(id)}`);
    const sheet = Buffer.from(getBundledSkinSource(id).split(",")[1], "base64");
    expect(file.equals(sheet), `Run pnpm build:skin-images: ${id} is stale`).toBe(true);
  }
  expect(skinImageURL("nope" as never)).toBe("/skins/classic.png");
});
