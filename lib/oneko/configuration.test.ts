import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ONEKO_PLAYGROUND_STATE } from "./playground-defaults";
import { getBundledSkinSource } from "../bundled-skins";
import {
  createShareURL,
  MAX_CONFIGURATION_BYTES,
  parseConfiguration,
  parseShareFragment,
  readConfiguration,
  serializeConfiguration,
} from "./configuration";

const configuration = (changes = {}) => ({
  version: 1,
  settings: { ...DEFAULT_ONEKO_PLAYGROUND_STATE, ...changes },
});
const parse = (changes: Record<string, unknown>) =>
  parseConfiguration(JSON.stringify(configuration(changes)));

afterEach(() => vi.unstubAllGlobals());

describe("portable configuration", () => {
  it("round-trips a complete configuration without dropping artwork or Unicode thoughts", () => {
    const settings = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      spriteSrc: getBundledSkinSource("calico"),
      spriteName: "我的猫.png",
      bubbleText: "म्याऊँ 🐈\nTreats?",
      meow: true,
      showCat: false,
      paused: true,
    };
    expect(parseConfiguration(serializeConfiguration(settings))).toEqual({
      ok: true,
      value: { version: 1, settings },
    });
  });

  it("rejects unsupported versions, incomplete states, and unknown keys", () => {
    expect(parseConfiguration("{")).toMatchObject({
      ok: false,
      error: expect.stringContaining("JSON"),
    });
    expect(parseConfiguration("[]")).toMatchObject({ ok: false });
    expect(parseConfiguration(JSON.stringify({ ...configuration(), version: 2 }))).toMatchObject({
      ok: false,
      error: expect.stringContaining("version"),
    });
    expect(parseConfiguration(JSON.stringify({ ...configuration(), extra: true }))).toMatchObject({
      ok: false,
      error: expect.stringContaining("extra"),
    });
    expect(parseConfiguration(JSON.stringify({ version: 1, settings: {} }))).toMatchObject({
      ok: false,
      error: expect.stringContaining("Missing"),
    });
    expect(parse({ unknown: true })).toMatchObject({
      ok: false,
      error: expect.stringContaining("unknown"),
    });
    expect(parse({ "": true })).toMatchObject({ ok: false });
    expect(parseConfiguration(JSON.stringify({ ...configuration(), "": true }))).toMatchObject({
      ok: false,
    });
    expect(
      parseConfiguration(
        JSON.stringify(configuration()).replace('"settings":{', '"settings":{"__proto__":{},'),
      ),
    ).toMatchObject({ ok: false });
  });

  it.each([
    ["speed", 100],
    ["volume", "0.5"],
    ["paused", "false"],
    ["skin", "missing"],
    ["bubblePlacement", "left"],
    ["spriteName", "x".repeat(256)],
    ["spriteSrc", "https://example.com/cat.png"],
    ["spriteSrc", "data:image/png;base64,broken"],
    ["bubbleText", "x".repeat(121)],
    ["bubbleText", Array(51).fill("Meow").join("\n")],
    ["bubbleText", "hello\0cat"],
  ])("rejects invalid %s values", (key, value) => {
    expect(parse({ [key]: value })).toMatchObject({ ok: false });
  });

  it("rejects oversized input before reading and undecodable custom sprites before applying", async () => {
    const text = vi.fn();
    await expect(
      readConfiguration({
        size: MAX_CONFIGURATION_BYTES + 1,
        text,
      } as unknown as File),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("512 KB"),
    });
    expect(text).not.toHaveBeenCalled();
    vi.stubGlobal(
      "Image",
      class {
        decode() {
          return Promise.reject(new Error("bad PNG"));
        }
      },
    );
    const raw = JSON.stringify(configuration({ spriteSrc: getBundledSkinSource("classic") }));
    await expect(
      readConfiguration({ size: raw.length, text: async () => raw } as File),
    ).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("PNG"),
    });
    vi.stubGlobal(
      "Image",
      class {
        decode() {
          return Promise.resolve();
        }
      },
    );
    await expect(
      readConfiguration({ size: raw.length, text: async () => raw } as File),
    ).resolves.toEqual({ ok: true, value: JSON.parse(raw) });
  });
});

describe("share links", () => {
  it("round-trips Unicode settings in a URL fragment", () => {
    const settings = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      bubbleText: "猫 🐈\nनमस्ते",
      skin: "calico" as const,
    };
    const result = createShareURL("https://example.com/?tracking=old#old", settings);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const url = new URL(result.value);
    expect(url.origin).toBe("https://example.com");
    expect(url.pathname).toBe("/studio");
    expect(url.search).toBe("");
    expect(parseShareFragment(url.hash)).toEqual({
      ok: true,
      value: { version: 1, settings },
    });
  });

  it("keeps custom artwork intact through a file fallback", () => {
    const settings = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      spriteSrc: getBundledSkinSource("classic"),
    };
    expect(createShareURL("https://example.com/studio", settings)).toMatchObject({
      ok: false,
      error: expect.stringContaining("Download"),
    });
    expect(parseConfiguration(serializeConfiguration(settings))).toMatchObject({
      ok: true,
      value: { settings: { spriteSrc: settings.spriteSrc } },
    });
  });

  it("rejects oversized links without truncating thoughts", () => {
    const settings = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      bubbleText: Array(50).fill("猫".repeat(120)).join("\n"),
    };
    expect(createShareURL("https://example.com/studio", settings)).toMatchObject({
      ok: false,
      error: expect.stringContaining("too large"),
    });
  });

  it("ignores ordinary anchors and reports damaged shared configurations", () => {
    expect(parseShareFragment("#installation")).toEqual({
      ok: true,
      value: null,
    });
    expect(parseShareFragment("#oneko=%%%")).toMatchObject({ ok: false });
    expect(parseShareFragment("#oneko=_w")).toMatchObject({ ok: false });
    expect(parseShareFragment("#oneko=" + btoa('{"version":99}'))).toMatchObject({ ok: false });
  });
});
