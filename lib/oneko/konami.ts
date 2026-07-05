import { KONAMI_SEQUENCE, KONAMI_TARGET } from "./constants";
import type { CatRuntimeState } from "./types";

export function createKonamiHandler(
  stateRef: { current: CatRuntimeState },
  debugSVG: SVGSVGElement,
  debugWrapper: HTMLDivElement,
): (e: KeyboardEvent) => void {
  const konamiBuffer: string[] = [];

  return (e: KeyboardEvent) => {
    konamiBuffer.push(e.code);
    if (konamiBuffer.length > KONAMI_SEQUENCE.length) {
      konamiBuffer.shift();
    }
    if (konamiBuffer.join(",") !== KONAMI_TARGET) {
      return;
    }

    stateRef.current.debugMode = !stateRef.current.debugMode;
    if (stateRef.current.debugMode) {
      debugSVG.style.display = "block";
      debugWrapper.style.display = "flex";
      return;
    }

    debugSVG.style.display = "none";
    debugWrapper.style.display = "none";
    stateRef.current.paused = false;
    stateRef.current.stateLocked = false;
    stateRef.current.noFollow = false;
  };
}
