import { playSound } from "../activity";
import type { CatAnimationDeps } from "../deps";

export function tickLaser(deps: CatAnimationDeps, dist: number) {
  const s = deps.stateRef.current;
  if (!s.cfg.laserPointer) {
    return;
  }

  const close = dist < s.cfg.followDistance + 4;
  if (close && !s.laserCaught) {
    s.laserCaught = true;
    playSound(deps, "eat");
  } else if (!close && dist > s.cfg.followDistance + 24) {
    s.laserCaught = false;
  }
}
