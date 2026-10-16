import { afterEach, describe, expect, it, vi } from "vitest";
import { affectionTier, greetingFor, GREETINGS, parseAffection } from "./affection";
import { parseConfiguration } from "./configuration";
import { createCatControls } from "./controls";
import { createInitialCatState } from "./initial-state";
import { moodForHour } from "./mood";
import { DEFAULT_ONEKO_PLAYGROUND_STATE, restorePlaygroundState } from "./playground-defaults";
import { readOptions } from "./vanilla-entry";
import { applyRuntimeConfig } from "./runtime-config";
import { ONEKO_DEFAULTS } from "./defaults";
import { defaultSpriteSets } from "./constants";
import { HAT_ANCHORS, hatOffset, hatSVG, resolveSeason, seasonForDate } from "./seasons";

vi.mock("./vanilla", () => ({ createOneko: vi.fn() }));
// vanilla-entry defines <oneko-cat> on import; give it just enough of a browser.
vi.hoisted(() => {
  Object.assign(globalThis, {
    HTMLElement: class {},
    customElements: { get: () => true, define: () => {} },
    document: {
      readyState: "complete",
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
    },
    window: { addEventListener: () => {} },
  });
});

afterEach(() => vi.useRealTimers());

describe("seasons", () => {
  it("follows the local calendar", () => {
    expect(seasonForDate(new Date(2026, 9, 19))).toBeNull();
    expect(seasonForDate(new Date(2026, 9, 20))).toBe("halloween");
    expect(seasonForDate(new Date(2026, 9, 31, 23, 59))).toBe("halloween");
    expect(seasonForDate(new Date(2026, 10, 1))).toBeNull();
    expect(seasonForDate(new Date(2026, 11, 18))).toBe("winter");
    expect(seasonForDate(new Date(2026, 11, 29))).toBe("winter");
    expect(seasonForDate(new Date(2026, 11, 30))).toBe("newYear");
    expect(seasonForDate(new Date(2027, 0, 2))).toBe("newYear");
    expect(seasonForDate(new Date(2027, 0, 3))).toBeNull();
  });

  it("can be forced or turned off", () => {
    const halloween = new Date(2026, 9, 25);
    expect(resolveSeason(true, halloween)).toBe("halloween");
    expect(resolveSeason(false, halloween)).toBeNull();
    expect(resolveSeason("winter", halloween)).toBe("winter");
    expect(resolveSeason("easter" as never, halloween)).toBeNull();
  });

  it("has a hat anchor for every sprite frame the cat can show", () => {
    for (const frames of Object.values(defaultSpriteSets))
      for (const [x, y] of frames) expect(hatOffset(x, y), `${x},${y}`).not.toBeNull();
    expect(Object.keys(HAT_ANCHORS)).toHaveLength(
      new Set(Object.values(defaultSpriteSets).flatMap((frames) => frames.map(String))).size,
    );
    expect(hatOffset(99, 99)).toBeNull();
  });

  it("draws outlined hats", () => {
    const svg = hatSVG("halloween");
    expect(svg).toContain('viewBox="0 0 13 10"');
    expect(svg).toContain("#1b1b1b");
  });
});

describe("time of day", () => {
  it("is playful at dawn and dusk and sleepy late at night", () => {
    expect(moodForHour(6).freerun).toBeGreaterThan(1);
    expect(moodForHour(19).freerun).toBeGreaterThan(1);
    expect(moodForHour(2).idle).toBeLessThan(0.5);
    expect(moodForHour(2).speed).toBeLessThan(1);
    expect(moodForHour(14).idle).toBeLessThan(1);
  });
});

describe("affection", () => {
  it("parses saved values defensively", () => {
    expect(parseAffection({ version: 1, affection: 3.7, lastVisit: 5 })).toEqual({
      version: 1,
      affection: 3,
      lastVisit: 5,
    });
    expect(parseAffection({ version: 1, affection: 5000, lastVisit: 5 })?.affection).toBe(999);
    expect(parseAffection({ version: 2, affection: 1, lastVisit: 5 })).toBeNull();
    expect(parseAffection({ version: 1, affection: "lots", lastVisit: 5 })).toBeNull();
    expect(parseAffection(null)).toBeNull();
  });

  it("warms up over time and greets only after a break", () => {
    expect([0, 1, 5, 15].map(affectionTier)).toEqual([0, 1, 2, 3]);
    const now = 10 * 60 * 60 * 1000;
    expect(greetingFor({ version: 1, affection: 20, lastVisit: now - 60_000 }, now)).toBeNull();
    expect(GREETINGS[3]).toContain(
      greetingFor({ version: 1, affection: 20, lastVisit: now - 3_600_000 }, now),
    );
    expect(GREETINGS[0]).toContain(greetingFor(null, now));
  });
});

describe("options", () => {
  it("reads new options from attributes, including season names", () => {
    const attributes: Record<string, string> = {
      seasonal: "halloween",
      grabbable: "",
      treats: "",
      "time-of-day": "false",
    };
    expect(readOptions((name) => attributes[name] ?? null)).toEqual({
      seasonal: "halloween",
      grabbable: true,
      treats: true,
      timeOfDay: false,
    });
    expect(readOptions((name) => (name === "seasonal" ? "false" : null))).toEqual({
      seasonal: false,
    });
  });

  it("applies new options and event handlers live", () => {
    const state = createInitialCatState(ONEKO_DEFAULTS);
    expect(state.seasonalCfg).toBe(true);
    const onPet = vi.fn();
    applyRuntimeConfig(state, {
      ...ONEKO_DEFAULTS,
      seasonal: "winter",
      grabbable: true,
      treats: true,
      onPet,
    });
    expect(state).toMatchObject({
      seasonalCfg: "winter",
      grabbableCfg: true,
      treatsCfg: true,
    });
    expect(state.handlers.onPet).toBe(onPet);
    applyRuntimeConfig(state, {
      ...ONEKO_DEFAULTS,
      seasonal: "spring" as never,
    });
    expect(state.seasonalCfg).toBe(true);
  });

  it("validates and restores seasonal playground settings", () => {
    const parse = (seasonal: unknown) =>
      parseConfiguration(
        JSON.stringify({
          version: 1,
          settings: { ...DEFAULT_ONEKO_PLAYGROUND_STATE, seasonal },
        }),
      );
    expect(parse("newYear").ok).toBe(true);
    expect(parse(false).ok).toBe(true);
    expect(parse("spring")).toMatchObject({ ok: false });
    expect(restorePlaygroundState(JSON.stringify({ seasonal: "halloween" })).seasonal).toBe(
      "halloween",
    );
    expect(restorePlaygroundState(JSON.stringify({ seasonal: 3 })).seasonal).toBe(true);
  });
});

describe("controls", () => {
  it("queues requests for the next tick and settles goTo", async () => {
    const stateRef = { current: createInitialCatState(ONEKO_DEFAULTS) };
    const controls = createCatControls(stateRef);
    controls.say("hello", { duration: 2000 });
    expect(stateRef.current.sayRequest).toEqual({ text: "hello", frames: 20 });
    controls.pet();
    expect(stateRef.current.petRequest).toBe(true);
    controls.sit();
    expect(stateRef.current.errand).toEqual({ kind: "sit" });
    const trip = controls.goTo({ x: 40, y: 50 });
    expect(stateRef.current.errand).toMatchObject({
      kind: "goTo",
      target: { x: 40, y: 50 },
    });
    controls.follow();
    expect(stateRef.current.errand).toBeNull();
    await expect(trip).resolves.toBe(false);
    await expect(controls.goTo("#missing")).resolves.toBe(false);
  });
});
