import { afterEach, expect, it, vi } from "vitest";
import { startAnimationLoop } from "./animation-loop";
import type { CatRuntimeState } from "./types";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("ticks at 10fps, stops while hidden, resumes without catch-up, and cleans up", () => {
  vi.useFakeTimers();
  const doc = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal("document", doc);
  const state = { current: { paused: false } as CatRuntimeState };
  const frame = vi.fn();
  const stop = startAnimationLoop(state, frame);
  vi.advanceTimersByTime(1000);
  expect(frame).toHaveBeenCalledTimes(10);
  state.current.paused = true;
  vi.advanceTimersByTime(1000);
  expect(frame).toHaveBeenCalledTimes(10);
  doc.hidden = true;
  doc.dispatchEvent(new Event("visibilitychange"));
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(2000);
  state.current.paused = false;
  doc.hidden = false;
  doc.dispatchEvent(new Event("visibilitychange"));
  vi.advanceTimersByTime(100);
  expect(frame).toHaveBeenCalledTimes(11);
  stop();
  doc.dispatchEvent(new Event("visibilitychange"));
  expect(vi.getTimerCount()).toBe(0);
});

it("honors the public pause option independently of debug playback and resumes in place", () => {
  vi.useFakeTimers();
  vi.stubGlobal("document", Object.assign(new EventTarget(), { hidden: false }));
  const state = { current: { paused: false, pausedCfg: true } as CatRuntimeState };
  const frame = vi.fn();
  const stop = startAnimationLoop(state, frame);
  vi.advanceTimersByTime(1000);
  expect(frame).not.toHaveBeenCalled();
  state.current.pausedCfg = false;
  vi.advanceTimersByTime(100);
  expect(frame).toHaveBeenCalledTimes(1);
  state.current.pausedCfg = true;
  vi.advanceTimersByTime(1000);
  expect(frame).toHaveBeenCalledTimes(1);
  stop();
});
