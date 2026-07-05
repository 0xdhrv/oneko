import type { CatRuntimeState } from "./types";

export function startAnimationLoop(
  stateRef: { current: CatRuntimeState },
  frame: () => void,
): () => void {
  let rafId = 0;

  const onAnimationFrame = (timestamp: number) => {
    const s = stateRef.current;
    if (!s.lastFrameTimestamp) {
      s.lastFrameTimestamp = timestamp;
    }
    if (timestamp - s.lastFrameTimestamp > 100) {
      s.lastFrameTimestamp = timestamp;
      if (!s.paused) {
        frame();
      }
    }
    rafId = window.requestAnimationFrame(onAnimationFrame);
  };

  rafId = window.requestAnimationFrame(onAnimationFrame);
  return () => window.cancelAnimationFrame(rafId);
}
