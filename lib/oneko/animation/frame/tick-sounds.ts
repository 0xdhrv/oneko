import { SOUND_POOLS } from "../../constants";
import type { CatActivityState } from "../../types";
import { getActivityLabel, playSound } from "../activity";
import type { CatAnimationDeps } from "../deps";

function tickAmbientSounds(deps: CatAnimationDeps, currentState: CatActivityState) {
  const s = deps.stateRef.current;
  const { idleTime, frameCount } = s;

  if (currentState === "idle" && idleTime > 0 && idleTime % 60 === 0) {
    playSound(deps, SOUND_POOLS.idle);
  } else if (currentState === "sleeping" && frameCount % 100 === 0) {
    playSound(deps, SOUND_POOLS.sleeping);
  } else if (currentState === "moving" && frameCount % 80 === 0) {
    playSound(deps, SOUND_POOLS.moving);
  }
}

export function tickSounds(deps: CatAnimationDeps): CatActivityState {
  const currentState = getActivityLabel(deps);

  if (currentState !== deps.lastStateRef.current) {
    deps.lastStateRef.current = currentState;
    deps.onStateChangeRef.current?.(currentState);
    const pool = SOUND_POOLS[currentState];
    if (pool) {
      playSound(deps, pool);
    }
  }

  tickAmbientSounds(deps, currentState);
  return currentState;
}
