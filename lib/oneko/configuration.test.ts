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
import { encodeWav } from "./sound-clip";

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
    ["spriteSrc", "http://example.com/cat.png"],
    ["spriteSrc", "https://user:secret@example.com/cat.png"],
    ["spriteSrc", "javascript:alert(1)"],
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
      error: expect.stringContaining("1 MB"),
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
  it("round-trips Unicode settings in a URL fragment", async () => {
    const settings = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      bubbleText: "猫 🐈\nनमस्ते",
      skin: "calico" as const,
    };
    const result = await createShareURL("https://example.com/?tracking=old#old", settings);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const url = new URL(result.value);
    expect(url.origin).toBe("https://example.com");
    expect(url.pathname).toBe("/studio");
    expect(url.search).toBe("");
    await expect(parseShareFragment(url.hash)).resolves.toEqual({
      ok: true,
      value: { version: 1, settings },
    });
  });

  it("carries custom artwork and sounds through a link", async () => {
    vi.stubGlobal(
      "Image",
      class {
        decode() {
          return Promise.resolve();
        }
      },
    );
    const settings = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      spriteSrc: getBundledSkinSource("classic"),
      soundClips: {
        pet: { src: encodeWav(new Float32Array(2000).fill(0.5)), name: "chirp" },
        moving: { src: "", name: "" },
      },
    };
    const result = await createShareURL("https://example.com/studio", settings);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toContain("#oneko2=");
    await expect(parseShareFragment(new URL(result.value).hash)).resolves.toEqual({
      ok: true,
      value: { version: 1, settings },
    });
  });

  it("refuses a link that inflates past any real configuration", async () => {
    const huge = new Blob(["a".repeat(MAX_CONFIGURATION_BYTES * 4)])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"));
    const bytes = new Uint8Array(await new Response(huge).arrayBuffer());
    const encoded = Buffer.from(bytes).toString("base64url");
    await expect(parseShareFragment(`#oneko2=${encoded}`)).resolves.toMatchObject({ ok: false });
  });

  it("rejects a shared sheet that does not decode", async () => {
    vi.stubGlobal(
      "Image",
      class {
        decode() {
          return Promise.reject(new Error("bad PNG"));
        }
      },
    );
    const result = await createShareURL("https://example.com/studio", {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      spriteSrc: getBundledSkinSource("classic"),
    });
    if (!result.ok) throw new Error(result.error);
    await expect(parseShareFragment(new URL(result.value).hash)).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("PNG"),
    });
  });

  it("rejects sounds that are not studio clips", () => {
    for (const soundClips of [
      { pet: { src: "data:text/html;base64,PGh0bWw+", name: "x" } },
      { pet: { src: "https://cats.example/a.mp3", name: "x" } },
      { purr: { src: "", name: "x" } },
      [],
    ])
      expect(parse({ soundClips })).toMatchObject({ ok: false });
  });

  it("shares hosted coats by link", async () => {
    const settings = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      spriteSrc: "https://cats.example/ginger.png",
      spriteName: "cats.example/ginger.png",
    };
    const result = await createShareURL("https://example.com/studio", settings);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    await expect(parseShareFragment(new URL(result.value).hash)).resolves.toEqual({
      ok: true,
      value: { version: 1, settings },
    });
  });

  it("accepts files and links made before newer settings existed", () => {
    const {
      napWhileTyping: _,
      pettable: _p,
      friend: _f,
      ...older
    } = DEFAULT_ONEKO_PLAYGROUND_STATE;
    expect(parseConfiguration(JSON.stringify({ version: 1, settings: older }))).toEqual({
      ok: true,
      value: { version: 1, settings: DEFAULT_ONEKO_PLAYGROUND_STATE },
    });
  });

  it("still opens links made before they were compressed", async () => {
    const settings = { ...DEFAULT_ONEKO_PLAYGROUND_STATE, bubbleText: "猫 🐈" };
    const encoded = Buffer.from(JSON.stringify({ version: 1, settings })).toString("base64url");
    await expect(parseShareFragment(`#oneko=${encoded}`)).resolves.toEqual({
      ok: true,
      value: { version: 1, settings },
    });
  });

  it("rejects oversized links before reading them", async () => {
    await expect(parseShareFragment(`#oneko2=${"a".repeat(1024 * 1024)}`)).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("too large"),
    });
  });

  it("ignores ordinary anchors and reports damaged shared configurations", async () => {
    await expect(parseShareFragment("#installation")).resolves.toEqual({
      ok: true,
      value: null,
    });
    await expect(parseShareFragment("#oneko=%%%")).resolves.toMatchObject({ ok: false });
    await expect(parseShareFragment("#oneko=_w")).resolves.toMatchObject({ ok: false });
    await expect(parseShareFragment("#oneko=" + btoa('{"version":99}'))).resolves.toMatchObject({
      ok: false,
    });
  });
});
