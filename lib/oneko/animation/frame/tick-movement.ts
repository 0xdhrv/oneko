import { updateBubble } from "../bubbles";
import type { CatAnimationDeps } from "../deps";
import { recalcPathIfNeeded, refreshGridIfNeeded } from "../grid";
import { freezeLockedState, updateIdleAnimation } from "../idle";
import { followPath } from "../movement";
import { interruptIdleIfChasing } from "./interrupt-idle";
import { tickLaser } from "./tick-laser";

export function tickMovement(deps: CatAnimationDeps, dist: number) {
  const s = deps.stateRef.current;
  refreshGridIfNeeded(deps);
  interruptIdleIfChasing(s, dist);
  recalcPathIfNeeded(deps);
  updateBubble(deps);
  tickLaser(deps, dist);

  if (!updateIdleAnimation(deps) && !freezeLockedState(deps)) {
    followPath(deps, dist);
  }
}
