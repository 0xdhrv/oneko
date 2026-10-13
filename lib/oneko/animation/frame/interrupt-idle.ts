import type { CatRuntimeState } from "../../types";
import { stopDistance } from "../attention";

export function interruptIdleIfChasing(s: CatRuntimeState, dist: number) {
  // Wake only when the target is clearly out of reach, so a cat napping beside its lead stays asleep.
  const reach = Math.max(32, stopDistance(s) + 12);
  if (s.idleAnimation && dist > reach && !s.stateLocked && !s.noFollow) {
    s.idleAnimation = null;
    s.idleAnimationFrame = 0;
    s.idleTime = 0;
  }
}
