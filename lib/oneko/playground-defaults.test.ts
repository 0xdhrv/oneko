import { describe, expect, it } from "vitest";
import { copyPlaygroundState, DEFAULT_ONEKO_PLAYGROUND_STATE } from "./playground-defaults";
import type { OnekoPlaygroundState } from "@/components/oneko-playground-context";

describe("copyPlaygroundState", () => {
  it("copies all playground fields", () => {
    const target: OnekoPlaygroundState = { ...DEFAULT_ONEKO_PLAYGROUND_STATE, speed: 1 };
    const source: OnekoPlaygroundState = {
      ...DEFAULT_ONEKO_PLAYGROUND_STATE,
      speed: 22,
      meow: false,
    };

    copyPlaygroundState(target, source);

    expect(target.speed).toBe(22);
    expect(target.meow).toBe(false);
    expect(target.bubbleText).toBe(DEFAULT_ONEKO_PLAYGROUND_STATE.bubbleText);
  });
});
