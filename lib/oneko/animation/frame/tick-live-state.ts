import type { CatActivityState } from "../../types";
import type { CatAnimationDeps } from "../deps";

export function tickLiveState(
  deps: CatAnimationDeps,
  dist: number,
  currentState: CatActivityState,
) {
  if (!deps.liveStateRef?.current) {
    return;
  }

  const s = deps.stateRef.current;
  const ls = deps.liveStateRef.current;
  ls.state = currentState;
  ls.posX = s.nekoPosX;
  ls.posY = s.nekoPosY;
  ls.velMag = Math.hypot(s.nekoVelX, s.nekoVelY);
  ls.idleTime = s.idleTime;
  ls.distToMouse = dist;
  ls.frameCount = s.frameCount;
  ls.freerunActive = s.freerunMode;
  ls.freerunTimer = s.freerunTimer;
  ls.bubbleVisible = s.bubbleVisible;
  ls.pathLength = s.currentPath.length;
  ls.obstacleCount = s.obstacleRects.length;
}
