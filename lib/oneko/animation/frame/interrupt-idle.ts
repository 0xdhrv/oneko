import type { CatRuntimeState } from "../../types";

export function interruptIdleIfChasing(s: CatRuntimeState, dist: number) {
  if (s.idleAnimation && dist > 32 && !s.stateLocked && !s.noFollow) {
    s.idleAnimation = null;
    s.idleAnimationFrame = 0;
    s.idleTime = 0;
  }
}
