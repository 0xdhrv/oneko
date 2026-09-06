import type { CatRuntimeState } from "./types";

/** The sprite has ten frames per second; no need to wake on every screen refresh. */
export function startAnimationLoop(
  stateRef: { current: CatRuntimeState },
  frame: () => void,
): () => void {
  let timer: ReturnType<typeof setInterval> | undefined;
  const syncVisibility = () => {
    clearInterval(timer);
    timer = undefined;
    if (document.hidden) return;
    timer = setInterval(() => {
      if (!stateRef.current.paused && !stateRef.current.pausedCfg) frame();
    }, 100);
  };
  document.addEventListener("visibilitychange", syncVisibility);
  syncVisibility();
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", syncVisibility);
  };
}
