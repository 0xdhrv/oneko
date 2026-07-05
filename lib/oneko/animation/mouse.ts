import { MOUSE_LOOP_MIN_STEP, MOUSE_LOOP_WINDING_CAP } from "../constants";
import type { CatAnimationDeps } from "./deps";

export function createMouseMoveHandler(deps: CatAnimationDeps) {
  return (ev: MouseEvent) => {
    const mx = ev.clientX;
    const my = ev.clientY;
    const s = deps.stateRef.current;
    const px = s.mousePosX;
    const py = s.mousePosY;
    const dx = mx - px;
    const dy = my - py;
    const dist = Math.hypot(dx, dy);
    if (dist >= MOUSE_LOOP_MIN_STEP) {
      const ang = Math.atan2(dy, dx);
      if (s.loopPrevAngle !== null) {
        let d = ang - s.loopPrevAngle;
        while (d > Math.PI) {
          d -= 2 * Math.PI;
        }
        while (d < -Math.PI) {
          d += 2 * Math.PI;
        }
        s.mouseCircleWinding += d;
        if (s.mouseCircleWinding > MOUSE_LOOP_WINDING_CAP) {
          s.mouseCircleWinding = MOUSE_LOOP_WINDING_CAP;
        } else if (s.mouseCircleWinding < -MOUSE_LOOP_WINDING_CAP) {
          s.mouseCircleWinding = -MOUSE_LOOP_WINDING_CAP;
        }
      }
      s.loopPrevAngle = ang;
    }
    s.mousePosX = mx;
    s.mousePosY = my;
  };
}
