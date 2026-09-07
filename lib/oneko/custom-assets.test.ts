import { describe, expect, it, vi, afterEach } from "vitest";
import { getSkinSource } from "./skins";
import {
  isSavedSprite,
  MAX_SPRITE_BYTES,
  readSprite,
  readThoughts,
  thoughtsForProp,
  validateThoughts,
} from "./custom-assets";
import { restorePlaygroundState, DEFAULT_ONEKO_PLAYGROUND_STATE } from "./playground-defaults";
import { createOnekoUsage } from "./usage";

function textFile(text: string, name = "thoughts.txt") {
  return { name, size: new TextEncoder().encode(text).length, text: async () => text } as File;
}

afterEach(() => vi.unstubAllGlobals());

describe("custom assets", () => {
  it("imports UTF-8 thoughts, Windows line endings and blank lines", async () => {
    const text = await readThoughts(textFile("\ufeff Hello cat \r\n\r\n Time for treats 🐟\r\n"));
    expect(thoughtsForProp(text)).toEqual(["Hello cat", "Time for treats 🐟"]);
    expect(thoughtsForProp("\n Hello \n")).toBe("Hello");
    expect(thoughtsForProp(" \n ")).toBe("");
  });

  it("rejects unusable text files without silently truncating imports", async () => {
    await expect(readThoughts(textFile(" \n "))).rejects.toThrow("no thoughts");
    await expect(readThoughts(textFile("hello", "cat.png"))).rejects.toThrow("plain-text");
    await expect(readThoughts(textFile("a\0b"))).rejects.toThrow("UTF-8");
    await expect(readThoughts(textFile("x".repeat(30_000)))).rejects.toThrow("24 KB");
    expect(() => validateThoughts("x".repeat(121))).toThrow("120 characters");
    expect(() => validateThoughts(Array(51).fill("hello").join("\n"))).toThrow("50 thoughts");
  });

  it("only restores bounded PNG sheets with the expected dimensions", () => {
    expect(isSavedSprite(getSkinSource("classic"))).toBe(true);
    expect(isSavedSprite("https://example.com/cat.png")).toBe(false);
    expect(isSavedSprite("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
    expect(isSavedSprite("data:image/png;base64,broken")).toBe(false);
    const bytes = Buffer.from(getSkinSource("classic").split(",")[1], "base64");
    bytes.writeUInt32BE(128, 16);
    expect(isSavedSprite(`data:image/png;base64,${bytes.toString("base64")}`)).toBe(false);
    expect(isSavedSprite(`data:image/png;base64,${"a".repeat(MAX_SPRITE_BYTES * 2)}`)).toBe(false);
  });

  it("rejects oversized sprites before reading and corrupt images after header validation", async () => {
    await expect(readSprite({ size: MAX_SPRITE_BYTES + 1 } as File)).rejects.toThrow("256 KB");
    vi.stubGlobal(
      "FileReader",
      class {
        result = getSkinSource("classic");
        onload = () => {};
        readAsDataURL() {
          this.onload();
        }
      },
    );
    vi.stubGlobal(
      "Image",
      class {
        decode() {
          return Promise.reject(new Error("decode"));
        }
      },
    );
    await expect(readSprite({ size: 100 } as File)).rejects.toThrow("couldn’t be opened");
    vi.stubGlobal(
      "Image",
      class {
        decode() {
          return Promise.resolve();
        }
      },
    );
    await expect(readSprite({ size: 100 } as File)).resolves.toBe(getSkinSource("classic"));
  });

  it("round-trips assets and exports portable props without upload metadata", () => {
    const saved = restorePlaygroundState(
      JSON.stringify({
        ...DEFAULT_ONEKO_PLAYGROUND_STATE,
        spriteSrc: getSkinSource("classic"),
        spriteName: "my cat.png",
        bubbleText: "Hello\nTreats?",
      }),
    );
    expect(saved.spriteSrc).toBe(getSkinSource("classic"));
    expect(saved.bubbleText).toBe("Hello\nTreats?");
    const usage = createOnekoUsage(saved);
    expect(usage).toContain(`spriteSrc={${JSON.stringify(saved.spriteSrc)}}`);
    expect(usage).toContain('bubbleText={["Hello","Treats?"]}');
    expect(usage).not.toContain("spriteName");
    expect(createOnekoUsage(DEFAULT_ONEKO_PLAYGROUND_STATE)).not.toContain("spriteSrc");
  });
});
