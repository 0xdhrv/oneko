import { refreshZones } from "./zone-runtime";
import { hideBubble, showBubble } from "./animation/bubbles";
import { createFrameLoop } from "./animation/frame";
import { createMouseMoveHandler } from "./animation/mouse";
import { startAnimationLoop } from "./animation-loop";
import { BUBBLE_DISPLAY_FRAMES, OBSTACLE_INTERVAL, PATH_RECALC_INTERVAL } from "./constants";
import { createDebugControls } from "./debug-controls/index";
import { createBubble, createCatElement, createDebugHUD, createDebugSVG } from "./dom";
import { createKonamiHandler } from "./konami";
import { createPersistHandler, loadPersistedCatState } from "./persistence";
import { teardownCatAnimation } from "./teardown";
import type { CatActivityState, CatLiveState, CatRuntimeState } from "./types";

export interface StartCatAnimationOptions {
  stateRef: { current: CatRuntimeState };
  elRef: { current: HTMLDivElement | null };
  lastStateRef: { current: CatActivityState };
  onStateChangeRef: { current: ((state: CatActivityState) => void) | undefined };
  liveStateRef?: { current: CatLiveState };
  persistPosition: boolean;
  storageKey?: string;
  zIndex: number;
}

function createDebugWrapper(
  zIndex: number,
  debugHUD: HTMLDivElement,
  debugControls: HTMLDivElement,
) {
  const debugWrapper = document.createElement("div");
  debugWrapper.setAttribute("aria-hidden", "true");
  debugWrapper.style.cssText = [
    "position:fixed",
    "top:10px",
    "left:10px",
    `z-index:${zIndex}`,
    "display:none",
    "flex-direction:column",
    "gap:6px",
    "pointer-events:none",
  ].join(";");
  debugWrapper.appendChild(debugHUD);
  debugWrapper.appendChild(debugControls);
  return debugWrapper;
}

export function startCatAnimation({
  stateRef,
  elRef,
  lastStateRef,
  onStateChangeRef,
  liveStateRef,
  persistPosition,
  storageKey = "oneko",
  zIndex,
}: StartCatAnimationOptions): () => void {
  const el = createCatElement(stateRef.current, zIndex);
  elRef.current = el;
  const debugSVG = createDebugSVG(zIndex);
  const debugHUD = createDebugHUD();
  const { wrapper: bubbleEl, textEl: bubbleTextEl, tailWrap: bubbleTail } = createBubble(zIndex);

  const deps = {
    stateRef,
    el,
    bubbleEl,
    bubbleTextEl,
    bubbleTail,
    debugSVG,
    debugHUD,
    lastStateRef,
    onStateChangeRef,
    liveStateRef,
  };

  const frame = createFrameLoop(deps);
  const debugControls = createDebugControls({
    stateRef,
    el,
    bubbleEl,
    bubbleTextEl,
    frame,
    showBubble: () => showBubble(deps),
    hideBubble: () => hideBubble(deps),
    bubbleDisplayFrames: BUBBLE_DISPLAY_FRAMES,
  });
  const debugWrapper = createDebugWrapper(zIndex, debugHUD, debugControls);

  if (persistPosition) {
    loadPersistedCatState(stateRef, el, storageKey);
  }

  refreshZones(deps);

  document.body.appendChild(debugSVG);
  document.body.appendChild(debugWrapper);
  document.body.appendChild(el);
  document.body.appendChild(bubbleEl);

  const onMouseMove = createMouseMoveHandler(deps);
  document.addEventListener("mousemove", onMouseMove);
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch") return;
    if (
      event.target instanceof Element &&
      event.target.closest("button,a,input,select,textarea,label,summary,[role='button']")
    )
      return;
    onMouseMove(event);
  };
  document.addEventListener("pointerdown", onPointerDown);

  const invalidateObstacles = () => {
    stateRef.current.lastObstacleRefresh = -OBSTACLE_INTERVAL;
    stateRef.current.lastPathRecalcFrame = -PATH_RECALC_INTERVAL;
  };
  window.addEventListener("scroll", invalidateObstacles, { passive: true });
  window.addEventListener("resize", invalidateObstacles, { passive: true });

  const onBeforeUnload = persistPosition ? createPersistHandler(stateRef, el, storageKey) : null;
  if (onBeforeUnload) {
    window.addEventListener("beforeunload", onBeforeUnload);
  }

  const onKeyDown = createKonamiHandler(stateRef, debugSVG, debugWrapper);
  document.addEventListener("keydown", onKeyDown);

  const stopAnimationLoop = startAnimationLoop(stateRef, frame);

  return () =>
    teardownCatAnimation(
      { el, debugSVG, debugWrapper, bubbleEl },
      {
        onMouseMove,
        onPointerDown,
        onKeyDown,
        invalidateObstacles,
        onBeforeUnload,
        stopAnimationLoop,
      },
    );
}
