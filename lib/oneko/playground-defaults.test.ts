import { describe, expect, it } from "vitest";
import { DEFAULT_ONEKO_PLAYGROUND_STATE, restorePlaygroundState } from "./playground-defaults";

describe("saved cat comforts", () => {
  it("restores a coat and settings while filling missing fields with defaults", () => {
    expect(
      restorePlaygroundState(JSON.stringify({ skin: "calico", speed: 20, meow: true })),
    ).toEqual({
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      skin: "calico",
      speed: 20,
      meow: true,
    });
  });
  it.each([null, "broken", "null", "[]", "42"])("uses defaults for invalid storage: %s", (raw) => {
    expect(restorePlaygroundState(raw)).toEqual(DEFAULT_ONEKO_PLAYGROUND_STATE);
  });
  it("ignores unknown coats, wrong types and unknown keys, and clamps numeric controls", () => {
    const restored = restorePlaygroundState(
      JSON.stringify({
        skin: "__proto__",
        meow: "true",
        speed: 900,
        scale: -4,
        volume: null,
        alien: true,
        bubbleText: "p".repeat(200),
      }),
    );
    expect(restored.skin).toBe("classic");
    expect(restored.meow).toBe(false);
    expect(restored.speed).toBe(30);
    expect(restored.scale).toBe(0.5);
    expect(restored.volume).toBe(0.5);
    expect(restored.bubbleText).toHaveLength(120);
    expect(restored).not.toHaveProperty("alien");
  });
});
