import { afterEach, describe, expect, it, vi } from "vitest";
import {
  catZoneRadius,
  collectZones,
  constrainZoneMovement,
  containsPoint,
  expandRect,
  nearestSafePoint,
} from "./zones";
import { refreshZones, updateZoneTarget } from "./zone-runtime";
import { createInitialCatState } from "./initial-state";
import { DEFAULT_ONEKO_PLAYGROUND_STATE } from "./playground-defaults";
import { followPath } from "./animation/movement";
import type { CatAnimationDeps } from "./animation/deps";

const rect = { left: 100, top: 100, right: 200, bottom: 200 };
const state = () =>
  createInitialCatState({ ...DEFAULT_ONEKO_PLAYGROUND_STATE, initialPos: { x: 50, y: 150 } });
function deps() {
  return {
    stateRef: { current: state() },
    el: { style: {} },
    bubbleEl: { style: {} },
    bubbleTextEl: {},
  } as unknown as CatAnimationDeps;
}
afterEach(() => vi.unstubAllGlobals());

describe("strict keep-out zones", () => {
  it("stops a fast cat crossing a thin zone even when the destination is outside it", () => {
    const safe = constrainZoneMovement({ x: 0, y: 150 }, { x: 400, y: 150 }, [
      { ...rect, right: 101 },
    ]);
    expect(safe.x).toBeLessThan(100);
  });
  it("allows movement away from and along an edge, but not into it", () => {
    const start = { x: 100, y: 150 };
    expect(constrainZoneMovement(start, { x: 50, y: 150 }, [rect])).toEqual({ x: 50, y: 150 });
    expect(constrainZoneMovement(start, { x: 100, y: 180 }, [rect])).toEqual({ x: 100, y: 180 });
    expect(constrainZoneMovement(start, { x: 150, y: 150 }, [rect])).toEqual(start);
  });
  it("covers scaled and rotated sprite corners", () => {
    const radius = catZoneRadius(3);
    expect(radius).toBeGreaterThan(48 * Math.SQRT2);
    const padded = expandRect(rect, radius);
    const safe = constrainZoneMovement({ x: 0, y: 150 }, { x: 300, y: 150 }, [padded]);
    expect(safe.x + 48 * Math.SQRT2).toBeLessThan(rect.left);
  });
  it("relocates an enclosed cat outside overlapping zones, or finds no space", () => {
    const blocked = [rect, { left: 150, top: 50, right: 240, bottom: 250 }];
    const safe = nearestSafePoint({ x: 170, y: 150 }, blocked, 500, 500, 24)!;
    expect(blocked.some((zone) => containsPoint(zone, safe))).toBe(false);
    expect(
      nearestSafePoint(
        { x: 100, y: 100 },
        [{ left: -1, top: -1, right: 501, bottom: 501 }],
        500,
        500,
        24,
      ),
    ).toBeNull();
  });
  it("still blocks forced zoomies with high velocity", () => {
    vi.stubGlobal("window", { innerWidth: 500, innerHeight: 500 });
    const d = deps(),
      s = d.stateRef.current;
    s.zoneState.blocked = [rect];
    s.zoneState.movementTarget = { x: 400, y: 150 };
    s.currentSpeed = 300;
    s.nekoVelX = 300;
    s.freerunMode = true;
    s.freerunTimer = 100;
    for (let i = 0; i < 10; i++) followPath(d, 350);
    expect(s.nekoPosX).toBeLessThan(rect.left);
  });
  it("hides the cat when the whole viewport is forbidden and restores it after removal", () => {
    vi.stubGlobal("window", { innerWidth: 500, innerHeight: 500 });
    vi.stubGlobal("document", { querySelectorAll: () => [] });
    const d = deps(),
      s = d.stateRef.current;
    s.zoneState.definitions = [
      { id: "whole", type: "avoid", rect: { left: 0, top: 0, right: 500, bottom: 500 } },
    ];
    expect(refreshZones(d)).toBe(false);
    expect(d.el.style.visibility).toBe("hidden");
    s.zoneState.definitions = [];
    expect(refreshZones(d)).toBe(true);
    expect(d.el.style.visibility).toBe("");
  });
  it("reconciles selector zones after layout changes and scale changes", () => {
    vi.stubGlobal("window", { innerWidth: 500, innerHeight: 500 });
    let bounds = rect;
    const element = { getBoundingClientRect: () => bounds };
    vi.stubGlobal("document", {
      querySelectorAll: (selector: string) => (selector === "#keep-out" ? [element] : []),
    });
    vi.stubGlobal("getComputedStyle", () => ({ visibility: "visible", display: "block" }));
    const d = deps(),
      s = d.stateRef.current;
    s.zoneState.definitions = [{ id: "moving", type: "avoid", selector: "#keep-out" }];
    refreshZones(d);
    bounds = { left: 20, top: 100, right: 80, bottom: 200 };
    refreshZones(d);
    expect(
      s.zoneState.blocked.some((zone) => containsPoint(zone, { x: s.nekoPosX, y: s.nekoPosY })),
    ).toBe(false);
    s.scale = 3;
    refreshZones(d);
    expect(
      s.zoneState.blocked.some((zone) => containsPoint(zone, { x: s.nekoPosX, y: s.nekoPosY })),
    ).toBe(false);
  });

  it("reads tiny explicit rectangles and tolerates invalid selectors", () => {
    vi.stubGlobal("document", {
      querySelectorAll: (selector: string) => {
        if (selector === "[") throw Error("bad selector");
        return [];
      },
    });
    expect(
      collectZones([
        { id: "invalid", type: "avoid", selector: "[" },
        { id: "tiny", type: "avoid", rect: { left: 10, top: 10, right: 11, bottom: 11 } },
      ]),
    ).toHaveLength(1);
  });
});

describe("occasional favorite spots", () => {
  it("visits briefly, leaves the real pointer untouched, then returns with a cooldown", () => {
    const s = state();
    s.mousePosX = 450;
    s.mousePosY = 350;
    s.zoneState.favorites = [{ id: "bed", type: "attract", rect }];
    s.zoneState.cooldownFrames = 1;
    s.zoneState.duration = 2;
    updateZoneTarget(s, 500, 500, () => 0);
    expect(s.zoneState.movementTarget).toEqual({ x: 150, y: 150 });
    expect(s.mousePosX).toBe(450);
    updateZoneTarget(s, 500, 500, () => 0);
    updateZoneTarget(s, 500, 500, () => 0);
    expect(s.zoneState.movementTarget).toEqual({ x: 450, y: 350 });
    expect(s.zoneState.cooldownFrames).toBe(80);
  });
  it("does not choose blocked or offscreen favorites", () => {
    const s = state();
    s.zoneState.favorites = [
      { id: "bed", type: "attract", rect },
      { id: "offscreen", type: "attract", rect: { ...rect, left: 700, right: 800 } },
    ];
    s.zoneState.blocked = [rect];
    s.zoneState.cooldownFrames = 1;
    updateZoneTarget(s, 500, 500, () => 0);
    expect(s.zoneState.targetId).toBeNull();
  });
  it("stops a visit when the spot disappears, or the laser takes priority", () => {
    const s = state();
    s.zoneState.favorites = [{ id: "bed", type: "attract", rect }];
    s.zoneState.cooldownFrames = 1;
    updateZoneTarget(s, 500, 500, () => 0);
    s.zoneState.favorites = [];
    updateZoneTarget(s, 500, 500, () => 0);
    expect(s.zoneState.targetId).toBeNull();
    s.zoneState.favorites = [{ id: "bed", type: "attract", rect }];
    s.zoneState.cooldownFrames = 1;
    s.laserPointerCfg = true;
    updateZoneTarget(s, 500, 500, () => 0);
    expect(s.zoneState.targetId).toBeNull();
  });
  it("respects probability checks and clamps cursor targets outside forbidden areas", () => {
    const s = state();
    s.zoneState.favorites = [{ id: "bed", type: "attract", rect }];
    s.zoneState.cooldownFrames = 1;
    updateZoneTarget(s, 500, 500, () => 0.9);
    expect(s.zoneState.targetId).toBeNull();
    s.mousePosX = 150;
    s.mousePosY = 150;
    s.zoneState.blocked = [rect];
    updateZoneTarget(s, 500, 500, () => 0.9);
    expect(containsPoint(rect, s.zoneState.movementTarget)).toBe(false);
  });
});
