import type { CatActivityState, OnekoSoundEvent } from "../../types";
import { getActivityLabel, playSound } from "../activity";
import type { CatAnimationDeps } from "../deps";

function soundEvent(state: CatActivityState): OnekoSoundEvent {
  return state.startsWith("scratchWall") ? "scratchWall" : (state as OnekoSoundEvent);
}

function tickAmbientSounds(deps: CatAnimationDeps, currentState: CatActivityState) {
  const s = deps.stateRef.current;
  const { idleTime, frameCount } = s;

  if (currentState === "idle" && idleTime > 0 && idleTime % 60 === 0) {
    playSound(deps, "idle");
  } else if (currentState === "sleeping" && frameCount % 100 === 0) {
    playSound(deps, "sleeping");
  } else if (currentState === "moving" && frameCount % 80 === 0) {
    playSound(deps, "moving");
  }
}

export function tickSounds(deps: CatAnimationDeps): CatActivityState {
  const currentState = getActivityLabel(deps);

  if (currentState !== deps.lastStateRef.current) {
    deps.lastStateRef.current = currentState;
    deps.onStateChangeRef.current?.(currentState);
    if (currentState === "sleeping") deps.stateRef.current.handlers.onSleep?.();
    playSound(deps, soundEvent(currentState));
  }

  tickAmbientSounds(deps, currentState);
  return currentState;
}
