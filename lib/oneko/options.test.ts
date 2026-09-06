import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createInitialCatState } from "./initial-state";
import {
  DEFAULT_ONEKO_PLAYGROUND_STATE as defaults,
  restorePlaygroundState,
} from "./playground-defaults";
import { applyRuntimeConfig } from "./runtime-config";
import { updateZoneTarget } from "./zone-runtime";
import { followPath } from "./animation/movement";
import { interruptIdleIfChasing } from "./animation/frame/interrupt-idle";
import { maybeStartIdleAnimation, updateIdleAnimation } from "./animation/idle";
import { showBubble, updateBubble } from "./animation/bubbles";
import { playSound } from "./animation/activity";
import { createPersistHandler, loadPersistedCatState } from "./persistence";
import { createOnekoUsage } from "./usage";
import type { CatAnimationDeps } from "./animation/deps";

function deps() {
  return {
    stateRef: { current: createInitialCatState({ ...defaults, initialPos: { x: 250, y: 250 } }) },
    el: { style: {} },
    bubbleEl: { style: {}, offsetWidth: 100, offsetHeight: 34 },
    bubbleTextEl: { textContent: "", style: {} },
    bubbleTail: { style: {} },
  } as unknown as CatAnimationDeps;
}

beforeEach(() => vi.stubGlobal("window", { innerWidth: 500, innerHeight: 500 }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("cat behavior options", () => {
  it("stops an active chase and favorite visit, rests, then follows the latest cursor on resume", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const d = deps(),
      s = d.stateRef.current;
    s.mousePosX = 450;
    s.mousePosY = 450;
    s.freerunMode = true;
    s.nekoVelX = 20;
    s.zoneState.targetId = "bed";
    s.zoneState.visitFrames = 40;
    applyRuntimeConfig(s, { ...defaults, followCursor: false });
    updateZoneTarget(s, 500, 500);
    followPath(d, 0);
    expect([s.nekoPosX, s.nekoPosY, s.nekoVelX]).toEqual([250, 250, 0]);
    expect(s.freerunMode).toBe(false);
    expect(s.zoneState.targetId).toBeNull();
    expect(s.idleTime).toBe(1);
    s.idleAnimation = "sleeping";
    interruptIdleIfChasing(s, 0);
    expect(s.idleAnimation).toBe("sleeping");
    applyRuntimeConfig(s, { ...defaults, followCursor: true });
    updateZoneTarget(s, 500, 500);
    const distance = Math.hypot(
      s.zoneState.movementTarget.x - s.nekoPosX,
      s.zoneState.movementTarget.y - s.nekoPosY,
    );
    interruptIdleIfChasing(s, distance);
    followPath(d, distance);
    expect(s.nekoPosX).toBeGreaterThan(250);
    expect(s.idleAnimation).toBeNull();
  });

  it("wakes an existing or restored nap and keeps grooming available when naps are disabled", () => {
    const d = deps(),
      s = d.stateRef.current;
    applyRuntimeConfig(s, { ...defaults, sleepEnabled: false });
    s.idleAnimation = "sleeping";
    expect(updateIdleAnimation(d)).toBe(false);
    expect(s.idleAnimation).toBeNull();
    s.idleTime = 1000;
    vi.spyOn(Math, "random").mockReturnValue(0);
    maybeStartIdleAnimation(d);
    expect(s.idleAnimation).toBe("scratchSelf");
    s.idleAnimation = null;
    applyRuntimeConfig(s, { ...defaults, sleepEnabled: true });
    maybeStartIdleAnimation(d);
    expect(s.idleAnimation).toBe("sleeping");
  });

  it("keeps sleeping bubbles sleepy even with custom awake text", () => {
    const d = deps();
    d.stateRef.current.idleAnimation = "sleeping";
    d.stateRef.current.customBubbleText = "meow";
    showBubble(d);
    expect(d.bubbleTextEl.textContent).not.toMatch(/meow/i);
  });
});

describe("bubble comforts", () => {
  it("changes side and scale live without resizing the cat", () => {
    const d = deps(),
      s = d.stateRef.current;
    s.bubbleCooldown = 100;
    applyRuntimeConfig(s, { ...defaults, bubblePlacement: "above", bubbleScale: 2 });
    updateBubble(d);
    expect(Number.parseFloat(d.bubbleEl.style.top)).toBeLessThan(s.nekoPosY);
    expect(d.bubbleEl.style.transform).toContain("scale(2)");
    expect(s.scale).toBe(1);
    applyRuntimeConfig(s, { ...defaults, bubblePlacement: "below" });
    updateBubble(d);
    expect(Number.parseFloat(d.bubbleEl.style.top)).toBeGreaterThan(s.nekoPosY);
    expect(d.bubbleEl.style.flexDirection).toBe("column-reverse");
  });

  it("flips near the top and keeps a scaled bubble inside the bottom and right edges", () => {
    const d = deps(),
      s = d.stateRef.current;
    s.bubbleCooldown = 100;
    s.nekoPosY = 20;
    updateBubble(d);
    expect(d.bubbleEl.style.flexDirection).toBe("column-reverse");
    s.nekoPosX = 490;
    s.nekoPosY = 490;
    applyRuntimeConfig(s, { ...defaults, bubbleScale: 2, bubblePlacement: "below" });
    updateBubble(d);
    expect(Number.parseFloat(d.bubbleEl.style.top) + 68).toBeLessThanOrEqual(494);
    expect(Number.parseFloat(d.bubbleEl.style.left) + 100).toBeLessThanOrEqual(494);
  });

  it("validates saved settings and clamps invalid bubble scales", () => {
    const s = deps().stateRef.current;
    applyRuntimeConfig(s, { ...defaults, bubbleScale: Number.NaN });
    expect(s.bubbleScaleCfg).toBe(1);
    applyRuntimeConfig(s, { ...defaults, bubbleScale: 99 });
    expect(s.bubbleScaleCfg).toBe(2);
    const restored = restorePlaygroundState(
      JSON.stringify({
        paused: true,
        followCursor: false,
        sleepEnabled: false,
        bubblePlacement: "below",
        bubbleScale: 99,
      }),
    );
    expect(restored).toMatchObject({
      paused: true,
      followCursor: false,
      sleepEnabled: false,
      bubblePlacement: "below",
      bubbleScale: 2,
    });
    expect(restorePlaygroundState('{"bubblePlacement":"left"}').bubblePlacement).toBe("auto");
  });
});

describe("installation options", () => {
  it("loads sounds from a custom directory and retains mute behavior", () => {
    const audio = vi.fn(function () {
      return { volume: 0, play: () => Promise.resolve() };
    });
    vi.stubGlobal("Audio", audio);
    const d = deps();
    applyRuntimeConfig(d.stateRef.current, {
      ...defaults,
      meow: true,
      soundBasePath: "https://assets.example/cats///",
    });
    playSound(d, ["/cat-sounds/Cat_purr1.ogg"]);
    expect(audio).toHaveBeenCalledWith("https://assets.example/cats/Cat_purr1.ogg");
    applyRuntimeConfig(d.stateRef.current, { ...defaults, meow: false });
    d.stateRef.current.soundCooldown = 0;
    playSound(d, ["/cat-sounds/Cat_purr1.ogg"]);
    expect(audio).toHaveBeenCalledTimes(1);
  });

  it("isolates persisted cat positions using the chosen key, retaining the legacy default", () => {
    const saved = new Map<string, string>();
    Object.assign(window, {
      localStorage: {
        getItem: (key: string) => saved.get(key) ?? null,
        setItem: (key: string, value: string) => saved.set(key, value),
      },
    });
    const d = deps();
    createPersistHandler(d.stateRef, d.el, "cat:shop")();
    expect(saved.has("oneko")).toBe(false);
    d.stateRef.current.nekoPosX = 100;
    createPersistHandler(d.stateRef, d.el)();
    loadPersistedCatState(d.stateRef, d.el, "cat:shop");
    expect(d.stateRef.current.nekoPosX).toBe(250);
    loadPersistedCatState(d.stateRef, d.el);
    expect(d.stateRef.current.nekoPosX).toBe(100);
  });

  it("exports the selected comforts and safely escapes custom text without playground visibility", () => {
    const usage = createOnekoUsage({
      ...defaults,
      showCat: false,
      paused: true,
      followCursor: false,
      bubblePlacement: "below",
      bubbleScale: 1.5,
      bubbleText: 'Treats "please"\n</code>',
    });
    expect(usage).toContain('"use client"');
    expect(usage).toContain("paused\n");
    expect(usage).toContain("followCursor={false}");
    expect(usage).toContain('bubblePlacement={"below"}');
    expect(usage).toContain('bubbleText={"Treats \\"please\\"\\n</code>"}');
    expect(usage).toContain("meow={false}");
    expect(usage).not.toContain("showCat");
    expect(usage).not.toContain("speed=");
  });
});
