import { TILE } from "./constants";
import type { CatRuntimeState } from "./types";

export function loadPersistedCatState(
  stateRef: { current: CatRuntimeState },
  el: HTMLDivElement,
  storageKey = "oneko",
): void {
  let parsed: Record<string, unknown> | null = null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return;
  }

  const apply = <K extends keyof CatRuntimeState>(key: K, value: unknown) => {
    if (value !== undefined && value !== null) {
      stateRef.current[key] = value as CatRuntimeState[K];
    }
  };

  apply("nekoPosX", parsed.nekoPosX);
  apply("nekoPosY", parsed.nekoPosY);
  apply("mousePosX", parsed.mousePosX);
  apply("mousePosY", parsed.mousePosY);
  apply("frameCount", parsed.frameCount);
  apply("idleTime", parsed.idleTime);
  apply("idleAnimation", parsed.idleAnimation);
  apply("idleAnimationFrame", parsed.idleAnimationFrame);

  if (parsed.bgPos) {
    el.style.backgroundPosition = parsed.bgPos as string;
  }

  const s0 = stateRef.current;
  el.style.left = `${s0.nekoPosX - TILE / 2}px`;
  el.style.top = `${s0.nekoPosY - TILE / 2}px`;
}

export function createPersistHandler(
  stateRef: { current: CatRuntimeState },
  el: HTMLDivElement,
  storageKey = "oneko",
): () => void {
  return () => {
    try {
      const s = stateRef.current;
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          nekoPosX: s.nekoPosX,
          nekoPosY: s.nekoPosY,
          mousePosX: s.mousePosX,
          mousePosY: s.mousePosY,
          frameCount: s.frameCount,
          idleTime: s.idleTime,
          idleAnimation: s.idleAnimation,
          idleAnimationFrame: s.idleAnimationFrame,
          bgPos: el.style.backgroundPosition,
        }),
      );
    } catch {
      // ignore
    }
  };
}
