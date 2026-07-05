import { LASER_CATCH_POOL } from "../../constants";
import { playSound } from "../activity";
import type { CatAnimationDeps } from "../deps";

export function tickLaser(deps: CatAnimationDeps, dist: number) {
  const s = deps.stateRef.current;
  if (!s.laserPointerCfg) {
    return;
  }

  const close = dist < s.followDistanceCfg + 4;
  if (close && !s.laserCaught) {
    s.laserCaught = true;
    playSound(deps, LASER_CATCH_POOL);
  } else if (!close && dist > s.followDistanceCfg + 24) {
    s.laserCaught = false;
  }
}
