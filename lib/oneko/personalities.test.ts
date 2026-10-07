import { describe, expect, it } from "vitest";
import { DEFAULT_ONEKO_PLAYGROUND_STATE, SETTING_RANGES } from "./playground-defaults";
import { ONEKO_PERSONALITIES, selectedPersonality } from "./personalities";

describe("personalities", () => {
  it("changes only movement numbers and preserves the rest of the cat", () => {
    const current = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      spriteSrc: "custom-art",
      spriteName: "my-cat.png",
      bubbleText: "My own thoughts",
      meow: true,
      paused: true,
      followCursor: false,
      showCat: false,
      sleepEnabled: false,
    };
    for (const personality of ONEKO_PERSONALITIES) {
      const next = { ...current, ...personality.settings };
      for (const [key, value] of Object.entries(current)) {
        if (!Object.hasOwn(personality.settings, key))
          expect(next[key as keyof typeof next]).toEqual(value);
      }
      expect(selectedPersonality(next)?.id).toBe(personality.id);
      for (const [key, value] of Object.entries(personality.settings)) {
        const [min, max] = SETTING_RANGES[key as keyof typeof SETTING_RANGES];
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    }
  });

  it("derives selection from the current values instead of a saved preset ID", () => {
    const current = { ...DEFAULT_ONEKO_PLAYGROUND_STATE, ...ONEKO_PERSONALITIES[0].settings };
    expect(selectedPersonality(current)?.id).toBe("sleepy");
    expect(selectedPersonality({ ...current, speed: current.speed + 1 })).toBeUndefined();
    expect(selectedPersonality({ ...current, skin: "calico", meow: true })?.id).toBe("sleepy");
  });
});
