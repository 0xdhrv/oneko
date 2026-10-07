import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ONEKO_DEFAULTS } from "./defaults";
import { createInitialCatState } from "./initial-state";
import { createPersistHandler, loadPersistedCatState, parsePersistedPosition } from "./persistence";

const storage = { getItem: vi.fn(), setItem: vi.fn() };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("window", { localStorage: storage, innerWidth: 500, innerHeight: 300 });
});
afterEach(() => vi.unstubAllGlobals());

describe("position storage boundary", () => {
  it.each([
    null,
    [],
    "position",
    20,
    { version: 2, x: 10, y: 20 },
    { version: 1, x: "10", y: 20 },
    { version: 1, x: NaN, y: 20 },
    { version: 1, x: 10, y: Infinity },
    { nekoPosX: 10 },
    { version: 1, nekoPosX: 10, nekoPosY: 20 },
  ])("rejects malformed positions %j", (value) => {
    expect(parsePersistedPosition(value)).toBeNull();
  });

  it("migrates only finite legacy coordinates and ignores internal animation fields", () => {
    const ref = { current: createInitialCatState(ONEKO_DEFAULTS) };
    const el = { style: {} } as HTMLDivElement;
    storage.getItem.mockReturnValue(
      JSON.stringify({
        nekoPosX: -100,
        nekoPosY: 900,
        mousePosX: 200,
        mousePosY: 200,
        frameCount: "broken",
        idleAnimation: "invalid",
        bgPos: "anything",
      }),
    );
    loadPersistedCatState(ref, el);
    expect([ref.current.nekoPosX, ref.current.nekoPosY]).toEqual([16, 284]);
    expect([ref.current.mousePosX, ref.current.mousePosY]).toEqual([16, 284]);
    expect(ref.current.frameCount).toBe(0);
    expect(ref.current.idleAnimation).toBeNull();
    expect(el.style).toEqual({ left: "0px", top: "268px" });
    createPersistHandler(ref)();
    expect(storage.setItem).toHaveBeenCalledWith("oneko", '{"version":1,"x":16,"y":284}');
  });

  it("handles viewports smaller than the sprite", () => {
    Object.assign(window, { innerWidth: 10, innerHeight: 0 });
    storage.getItem.mockReturnValue('{"version":1,"x":50,"y":40}');
    const ref = { current: createInitialCatState(ONEKO_DEFAULTS) };
    loadPersistedCatState(ref, { style: {} } as HTMLDivElement);
    expect([ref.current.nekoPosX, ref.current.nekoPosY]).toEqual([5, 0]);
  });

  it("leaves runtime state intact for damaged JSON or blocked storage and never saves invalid numbers", () => {
    const ref = { current: createInitialCatState(ONEKO_DEFAULTS) };
    const before = structuredClone(ref.current);
    storage.getItem.mockReturnValue("{");
    loadPersistedCatState(ref, { style: {} } as HTMLDivElement);
    expect(ref.current).toEqual(before);
    storage.getItem.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => loadPersistedCatState(ref, { style: {} } as HTMLDivElement)).not.toThrow();
    storage.setItem.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(createPersistHandler(ref)).not.toThrow();
    storage.setItem.mockClear();
    ref.current.nekoPosX = NaN;
    createPersistHandler(ref)();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
