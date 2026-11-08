import { ONEKO_DEFAULTS } from "./defaults";
import { refreshZones } from "./zone-runtime";
import { hideBubble, showBubble } from "./animation/bubbles";
import { makePettable, watchPage } from "./animation/attention";
import { createFrameLoop } from "./animation/frame";
import { createPlay, restoreKnocked } from "./animation/play";
import { clearTreats } from "./treats";
import { createMouseMoveHandler } from "./animation/mouse";
import { startAnimationLoop } from "./animation-loop";
import {
  BUBBLE_DISPLAY_FRAMES,
  OBSTACLE_INTERVAL,
  PATH_RECALC_INTERVAL,
  SCROLL_SETTLE_MS,
} from "./constants";
import { createDebugControls } from "./debug-controls/index";
import { createBubble, createCatElement, createDebugHUD, createDebugSVG } from "./dom";
import { createKonamiHandler } from "./konami";
import { joinPack, packSize } from "./pack";
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
  /** Make the cat a keyboard-reachable "Pet the cat" button. */
  pettable?: boolean;
}

type EngineOptionKey = Exclude<
  keyof StartCatAnimationOptions,
  "stateRef" | "elRef" | "lastStateRef" | "onStateChangeRef" | "liveStateRef"
>;

/** Options fixed for one engine run. Each must be listed, so hosts restart the cat when one changes. */
const RESTART_OPTIONS = {
  persistPosition: true,
  storageKey: true,
  zIndex: true,
  pettable: true,
} satisfies Record<EngineOptionKey, true>;
export const ENGINE_OPTION_KEYS = Object.keys(RESTART_OPTIONS) as EngineOptionKey[];

/** The laser toy runs only while the cat is chasing. */
export function laserActive(options: {
  laserPointer: boolean;
  followCursor: boolean;
  paused: boolean;
}): boolean {
  return options.laserPointer && options.followCursor && !options.paused;
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
  storageKey = ONEKO_DEFAULTS.storageKey,
  zIndex,
  pettable = ONEKO_DEFAULTS.pettable,
}: StartCatAnimationOptions): () => void {
  stateRef.current.bubbleVisible = false;
  stateRef.current.bubbleTimer = 0;
  stateRef.current.zIndex = zIndex;
  stateRef.current.affectionKey = `${storageKey}:affection`;
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

  const play = createPlay(deps);
  const frame = createFrameLoop(deps, play);
  const debugControls = createDebugControls({
    stateRef,
    el,
    bubbleEl,
    bubbleTextEl,
    frame,
    showBubble: () => showBubble(deps, { forced: true }),
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
      event.target.closest(
        "button,a,input,select,textarea,label,summary,[role='button'],[data-oneko-cat]",
      )
    )
      return;
    onMouseMove(event);
  };
  document.addEventListener("pointerdown", onPointerDown);

  // Zones are re-read on the next tick; the page-wide obstacle scan waits until scrolling settles.
  let settle: ReturnType<typeof setTimeout> | undefined;
  const invalidateObstacles = () => {
    stateRef.current.zoneState.collectedFrame = -Infinity;
    clearTimeout(settle);
    settle = setTimeout(() => {
      stateRef.current.lastObstacleRefresh = -OBSTACLE_INTERVAL;
      stateRef.current.lastPathRecalcFrame = -PATH_RECALC_INTERVAL;
    }, SCROLL_SETTLE_MS);
  };
  window.addEventListener("scroll", invalidateObstacles, { passive: true });
  window.addEventListener("resize", invalidateObstacles, { passive: true });

  const persist = persistPosition ? createPersistHandler(stateRef, storageKey) : null;
  const onVisibilityChange = () => {
    if (document.hidden) persist?.();
  };
  if (persist) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", persist);
  }

  const onKeyDown = createKonamiHandler(stateRef, debugSVG, debugWrapper);
  document.addEventListener("keydown", onKeyDown);

  const leavePack = joinPack(stateRef.current);
  const stopWatchingPage = watchPage(deps);
  const stopPetting = pettable ? makePettable(deps) : undefined;
  const stopAnimationLoop = startAnimationLoop(stateRef, frame);

  return () => {
    stopPetting?.();
    stopWatchingPage();
    play.dispose();
    leavePack();
    if (packSize() === 0) {
      clearTreats();
      restoreKnocked();
    }
    persist?.();
    clearTimeout(settle);
    teardownCatAnimation(
      { el, debugSVG, debugWrapper, bubbleEl },
      {
        onMouseMove,
        onPointerDown,
        onKeyDown,
        invalidateObstacles,
        persist,
        onVisibilityChange,
        stopAnimationLoop,
      },
    );
    elRef.current = null;
    stateRef.current.bubbleVisible = false;
    stateRef.current.bubbleTimer = 0;
    if (liveStateRef) liveStateRef.current.bubbleVisible = false;
  };
}
