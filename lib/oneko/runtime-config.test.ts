import { describe, expect, it } from "vitest";
import { createInitialCatState } from "./initial-state";
import { applyRuntimeConfig } from "./runtime-config";
import type { CatRuntimeState } from "./types";

function minimalRuntimeState(): CatRuntimeState {
  const state = createInitialCatState({ laserPointer: true });
  state.laserCaught = true;
  return state;
}

describe("applyRuntimeConfig", () => {
  it("maps props onto runtime state fields", () => {
    const state = minimalRuntimeState();
    applyRuntimeConfig(state, {
      speed: 22,
      scale: 2,
      opacity: 0.5,
      rotationAmount: 30,
      idleThreshold: 2000,
      freerunChance: 0.1,
      freerunDuration: 80,
      bubbleEnabled: false,
      bubbleDisplayFrames: 90,
      bubbleCooldown: 60,
      bubbleChance: 0.25,
      followDistance: 40,
      animationSpeed: 1.5,
      bubbleText: "meow",
      meow: false,
      volume: 0.8,
      laserPointer: false,
    });

    expect(state.cfg.speed).toBe(22);
    expect(state.cfg.scale).toBe(2);
    expect(state.cfg.bubbleText).toBe("meow");
    expect(state.cfg.laserPointer).toBe(false);
    expect(state.laserCaught).toBe(false);
  });

  it("clamps numbers the browser or engine would reject, and defaults non-finite ones", () => {
    const state = minimalRuntimeState();
    applyRuntimeConfig(state, { volume: 2, opacity: -1, scale: Number.NaN, bubbleChance: 5 });
    expect(state.cfg).toMatchObject({ volume: 1, opacity: 0, scale: 1, bubbleChance: 1 });
    applyRuntimeConfig(state, { volume: -0.5, speed: Number.POSITIVE_INFINITY });
    expect(state.cfg).toMatchObject({ volume: 0, speed: 10 });
  });
});
