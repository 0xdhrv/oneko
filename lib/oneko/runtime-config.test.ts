import { describe, expect, it } from "vitest";
import { applyRuntimeConfig, defaultRuntimeConfigState } from "./runtime-config";
import type { CatRuntimeState } from "./types";

function minimalRuntimeState(): CatRuntimeState {
  return {
    nekoPosX: 0,
    nekoPosY: 0,
    nekoVelX: 0,
    nekoVelY: 0,
    mousePosX: 0,
    mousePosY: 0,
    frameCount: 0,
    idleTime: 0,
    idleAnimation: null,
    idleAnimationFrame: 0,
    lastFrameTimestamp: 0,
    obstacleRects: [],
    lastObstacleRefresh: 0,
    grid: null,
    gridCols: 0,
    gridRows: 0,
    currentPath: [],
    pathWaypointIdx: 0,
    lastPathRecalcFrame: 0,
    lastPathTargetCol: 0,
    lastPathTargetRow: 0,
    debugMode: false,
    paused: false,
    stateLocked: false,
    noFollow: false,
    ...defaultRuntimeConfigState(),
    laserPointerCfg: true,
    laserCaught: true,
    loopPrevAngle: null,
    mouseCircleWinding: 0,
    freerunMode: false,
    freerunTimer: 0,
    lastFreerunMsg: -1,
  };
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

    expect(state.currentSpeed).toBe(22);
    expect(state.scale).toBe(2);
    expect(state.customBubbleText).toBe("meow");
    expect(state.laserPointerCfg).toBe(false);
    expect(state.laserCaught).toBe(false);
  });
});
