import type { CatActivityState, CatLiveState, CatRuntimeState } from "../types";

export interface CatAnimationDeps {
  stateRef: { current: CatRuntimeState };
  el: HTMLDivElement;
  bubbleEl: HTMLDivElement;
  bubbleTextEl: HTMLDivElement;
  bubbleTail: HTMLDivElement;
  debugSVG: SVGSVGElement;
  debugHUD: HTMLDivElement;
  lastStateRef: { current: CatActivityState };
  onStateChangeRef: { current: ((state: CatActivityState) => void) | undefined };
  liveStateRef?: { current: CatLiveState };
}
