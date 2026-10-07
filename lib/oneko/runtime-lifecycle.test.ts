import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ONEKO_DEFAULTS } from "./defaults";
import { createInitialCatState } from "./initial-state";
import { startCatAnimation } from "./start-cat-animation";
import { mountLaserCursor } from "./laser-cursor-dom";
import type { CatActivityState } from "./types";

vi.mock("./zone-runtime", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./zone-runtime")>()),
  refreshZones: vi.fn(),
}));
vi.mock("./animation/frame", () => ({ createFrameLoop: () => vi.fn() }));
vi.mock("./debug-controls/index", () => ({
  createDebugControls: () => ({ wrapper: document.createElement("div") }),
}));
vi.mock("./dom", () => ({
  createCatElement: () => document.createElement("div"),
  createDebugSVG: () => document.createElement("div"),
  createDebugHUD: () => document.createElement("div"),
  createBubble: () => ({
    wrapper: document.createElement("div"),
    textEl: document.createElement("div"),
    tailWrap: document.createElement("div"),
  }),
}));

type FakeElement = {
  parentNode: FakeElement | null;
  style: {
    cssText: string;
    transform: string;
    setProperty: (key: string, value: string, priority?: string) => void;
    getPropertyValue: (key: string) => string;
    getPropertyPriority: (key: string) => string;
    removeProperty: (key: string) => void;
  };
  setAttribute: ReturnType<typeof vi.fn>;
  appendChild: (child: FakeElement) => void;
  removeChild: (child: FakeElement) => void;
};

function element(): FakeElement {
  const properties = new Map<string, { value: string; priority: string }>();
  return {
    parentNode: null as FakeElement | null,
    style: {
      cssText: "",
      transform: "",
      setProperty: (key: string, value: string, priority = "") =>
        properties.set(key, { value, priority }),
      getPropertyValue: (key: string) => properties.get(key)?.value ?? "",
      getPropertyPriority: (key: string) => properties.get(key)?.priority ?? "",
      removeProperty: (key: string) => properties.delete(key),
    },
    setAttribute: vi.fn(),
    appendChild(child: FakeElement) {
      child.parentNode = this;
    },
    removeChild(child: FakeElement) {
      child.parentNode = null;
    },
  };
}

const storage = { getItem: vi.fn(), setItem: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal(
    "document",
    Object.assign(new EventTarget(), {
      body: element(),
      hidden: false,
      createElement: element,
    }),
  );
  vi.stubGlobal(
    "window",
    Object.assign(new EventTarget(), {
      innerWidth: 500,
      innerHeight: 500,
      localStorage: storage,
      requestAnimationFrame: vi.fn(() => 1),
      cancelAnimationFrame: vi.fn(),
    }),
  );
  storage.getItem.mockReturnValue(null);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function options(persistPosition = true) {
  return {
    stateRef: { current: createInitialCatState(ONEKO_DEFAULTS) },
    elRef: { current: null as HTMLDivElement | null },
    lastStateRef: { current: "idle" as CatActivityState },
    onStateChangeRef: { current: undefined },
    persistPosition,
    storageKey: "test-cat",
    zIndex: 10,
  };
}

it("saves current position on hidden/pagehide/unmount and removes listeners and DOM refs", () => {
  const opts = options();
  const stop = startCatAnimation(opts);
  opts.stateRef.current.nekoPosX = 230;
  document.dispatchEvent(new Event("visibilitychange"));
  expect(storage.setItem).not.toHaveBeenCalled();
  Object.assign(document, { hidden: true });
  document.dispatchEvent(new Event("visibilitychange"));
  expect(storage.setItem).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event("pagehide"));
  expect(storage.setItem).toHaveBeenCalledTimes(2);
  opts.stateRef.current.bubbleVisible = true;
  opts.stateRef.current.bubbleTimer = 20;
  stop();
  expect(storage.setItem).toHaveBeenCalledTimes(3);
  expect(JSON.parse(storage.setItem.mock.calls[2][1])).toEqual({
    version: 1,
    x: 230,
    y: opts.stateRef.current.nekoPosY,
  });
  expect(opts.elRef.current).toBeNull();
  expect(opts.stateRef.current.bubbleVisible).toBe(false);
  expect(opts.stateRef.current.bubbleTimer).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("pagehide"));
  expect(storage.setItem).toHaveBeenCalledTimes(3);
});

it("does not access storage when persistence is disabled, including teardown", () => {
  const stop = startCatAnimation(options(false));
  Object.assign(document, { hidden: true });
  document.dispatchEvent(new Event("visibilitychange"));
  window.dispatchEvent(new Event("pagehide"));
  stop();
  expect(storage.getItem).not.toHaveBeenCalled();
  expect(storage.setItem).not.toHaveBeenCalled();
});

it("starts remounted bubble DOM with matching transient state", () => {
  const opts = options(false);
  opts.stateRef.current.bubbleVisible = true;
  opts.stateRef.current.bubbleTimer = 90;
  const stop = startCatAnimation(opts);
  expect(opts.stateRef.current.bubbleVisible).toBe(false);
  expect(opts.stateRef.current.bubbleTimer).toBe(0);
  stop();
});

it("restores the host cursor value and priority after laser cleanup", () => {
  document.body.style.setProperty("cursor", "crosshair", "important");
  const stop = mountLaserCursor(10);
  expect(document.body.style.getPropertyValue("cursor")).toBe("none");
  stop();
  expect(document.body.style.getPropertyValue("cursor")).toBe("crosshair");
  expect(document.body.style.getPropertyPriority("cursor")).toBe("important");
  expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
});
