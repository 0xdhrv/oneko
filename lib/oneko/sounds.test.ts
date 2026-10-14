import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LASER_CATCH_POOL, PET_SOUND_POOL, SOUND_POOLS } from "./constants";

const publicDir = join(__dirname, "../../public");
const soundDir = join(publicDir, "cat-sounds");

function isOgg(path: string) {
  return readFileSync(path).subarray(0, 4).toString("latin1") === "OggS";
}

describe("cat sounds", () => {
  it("references only Ogg files that exist", () => {
    const paths = new Set([
      ...Object.values(SOUND_POOLS).flat(),
      ...PET_SOUND_POOL,
      ...LASER_CATCH_POOL,
    ]);
    for (const path of paths) {
      expect(isOgg(join(publicDir, path)), path).toBe(true);
    }
  });

  it("ships only valid Ogg files", () => {
    for (const file of readdirSync(soundDir)) {
      expect(isOgg(join(soundDir, file)), file).toBe(true);
    }
  });
});
