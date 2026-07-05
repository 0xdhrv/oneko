import { MOUSE_LOOP_WINDING_DECAY } from "../../constants";
import type { CatRuntimeState } from "../../types";

export function tickPrelude(s: CatRuntimeState) {
  s.frameCount += 1;
  s.mouseCircleWinding *= MOUSE_LOOP_WINDING_DECAY;
  if (Math.abs(s.mouseCircleWinding) < 0.35) {
    s.mouseCircleWinding = 0;
    s.loopPrevAngle = null;
  }
  s.soundCooldown = Math.max(0, s.soundCooldown - 1);
}
