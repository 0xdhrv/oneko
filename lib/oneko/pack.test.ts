import { afterEach, describe, expect, it, vi } from "vitest";
import { stopDistance, tickAttention } from "./animation/attention";
import type { CatAnimationDeps } from "./animation/deps";
import { createInitialCatState } from "./initial-state";
import {
  areCatsHidden,
  HIDDEN_STORAGE_KEY,
  joinPack,
  leaderPosition,
  napmateNearby,
  onCatsHiddenChange,
  setCatsHidden,
} from "./pack";
import { DEFAULT_ONEKO_PLAYGROUND_STATE } from "./playground-defaults";
import { updateZoneTarget } from "./zone-runtime";

const cat = (x: number, y: number, chase: "cursor" | "cat" = "cursor") =>
  createInitialCatState({ ...DEFAULT_ONEKO_PLAYGROUND_STATE, chase, initialPos: { x, y } });
const cleanups: (() => void)[] = [];
const join = (state: ReturnType<typeof cat>) => cleanups.push(joinPack(state));

afterEach(() => {
  for (const leave of cleanups.splice(0)) leave();
  vi.unstubAllGlobals();
});

describe("a pack of cats", () => {
  it("follows the cat mounted before it, and the first cat leads", () => {
    const first = cat(100, 100);
    const second = cat(200, 200, "cat");
    const third = cat(300, 300, "cat");
    [first, second, third].forEach(join);
    expect(leaderPosition(first)).toBeNull();
    expect(leaderPosition(second)).toEqual({ x: 100, y: 100 });
    expect(leaderPosition(third)).toEqual({ x: 200, y: 200 });
  });

  it("ignores the pack when chasing the cursor and keeps its place after a restart", () => {
    const first = cat(100, 100, "cat");
    const second = cat(200, 200, "cat");
    const leaveFirst = joinPack(first);
    join(second);
    leaveFirst();
    expect(leaderPosition(second)).toBeNull();
    cleanups.push(joinPack(first));
    expect(leaderPosition(first)).toBeNull();
    expect(leaderPosition(second)).toEqual({ x: 100, y: 100 });
    second.chaseCfg = "cursor";
    expect(leaderPosition(second)).toBeNull();
  });

  it("dozes off beside a napping friend, but not a distant one", () => {
    const sleeper = cat(100, 100);
    const near = cat(130, 100);
    const far = cat(600, 100);
    [sleeper, near, far].forEach(join);
    expect(napmateNearby(near)).toBe(false);
    sleeper.idleAnimation = "sleeping";
    expect(napmateNearby(near)).toBe(true);
    expect(napmateNearby(far)).toBe(false);
  });
});

describe("what the cat pays attention to", () => {
  const deps = (state: ReturnType<typeof cat>) =>
    ({ stateRef: { current: state } }) as CatAnimationDeps;
  const target = (state: ReturnType<typeof cat>) => {
    tickAttention(deps(state));
    updateZoneTarget(state, 1000, 800, () => 1);
    return state.zoneState.movementTarget;
  };

  it("prefers staying put, then a perch, then its leader, then the cursor", () => {
    const leader = cat(100, 100);
    const follower = cat(400, 400, "cat");
    [leader, follower].forEach(join);
    follower.mousePosX = 700;
    follower.mousePosY = 600;
    expect(target(follower)).toEqual({ x: 100, y: 100 });
    expect(stopDistance(follower)).toBeGreaterThanOrEqual(32);

    follower.perchTarget = { x: 250, y: 50 };
    expect(target(follower)).toEqual({ x: 250, y: 50 });
    expect(stopDistance(follower)).toBeLessThanOrEqual(8);

    follower.typingNap = true;
    expect(target(follower)).toEqual({ x: 400, y: 400 });
    expect(follower.idleAnimation).toBe("sleeping");

    follower.typingNap = false;
    follower.perchTarget = null;
    follower.chaseCfg = "cursor";
    expect(target(follower)).toEqual({ x: 700, y: 600 });
  });

  it("holds still while focused and only naps while typing if sleep is allowed", () => {
    const state = cat(300, 300);
    join(state);
    state.mousePosX = 900;
    state.held = true;
    expect(target(state)).toEqual({ x: 300, y: 300 });
    state.held = false;
    state.sleepEnabledCfg = false;
    state.typingNap = true;
    expect(target(state)).toEqual({ x: 300, y: 300 });
    expect(state.idleAnimation).toBeNull();
  });
});

describe("hiding every cat", () => {
  function stubBrowser(storage: Storage | "unavailable") {
    const events = new EventTarget();
    vi.stubGlobal("window", events);
    if (storage === "unavailable")
      vi.stubGlobal("localStorage", {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      });
    else vi.stubGlobal("localStorage", storage);
    return events;
  }

  function memoryStorage(): Storage {
    const values = new Map<string, string>();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => void values.set(key, value),
      removeItem: (key) => void values.delete(key),
      clear: () => values.clear(),
      key: () => null,
      get length() {
        return values.size;
      },
    };
  }

  it("remembers the choice and tells every listener", () => {
    const storage = memoryStorage();
    stubBrowser(storage);
    const changed = vi.fn();
    const stop = onCatsHiddenChange(changed);
    expect(areCatsHidden()).toBe(false);
    setCatsHidden(true);
    expect(storage.getItem(HIDDEN_STORAGE_KEY)).toBe("1");
    expect(areCatsHidden()).toBe(true);
    setCatsHidden(false);
    expect(areCatsHidden()).toBe(false);
    expect(changed).toHaveBeenCalledTimes(2);
    stop();
    setCatsHidden(true);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("still hides cats for this page when storage is blocked", () => {
    stubBrowser("unavailable");
    setCatsHidden(true);
    expect(areCatsHidden()).toBe(true);
    setCatsHidden(false);
    expect(areCatsHidden()).toBe(false);
  });
});
