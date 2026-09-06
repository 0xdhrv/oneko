import { defaultSpriteSets, IDLE_ANIMATION_DURATIONS, SLEEPING_MESSAGES } from "../constants";
import type { CatRuntimeState, IdleActivityState } from "../types";
import { pickFromPool } from "./bubbles";
import type { CatAnimationDeps } from "./deps";
import { clearRotation, setSprite } from "./sprites";

function idleFrameThreshold(s: CatRuntimeState) {
  return Math.max(1, Math.round(s.idleThresholdMs / 100));
}

function wallScratchAnimations(s: CatRuntimeState): IdleActivityState[] {
  return [
    s.nekoPosX <= 18 && "scratchWallW",
    s.nekoPosX >= window.innerWidth - 18 && "scratchWallE",
    s.nekoPosY <= 18 && "scratchWallN",
    s.nekoPosY >= window.innerHeight - 18 && "scratchWallS",
  ].filter(Boolean) as IdleActivityState[];
}

function pickRandomIdleAnimation(s: CatRuntimeState): IdleActivityState {
  const available: IdleActivityState[] = [
    "scratchSelf",
    ...(s.sleepEnabledCfg ? ["tired" as const] : []),
    ...wallScratchAnimations(s),
  ];
  return available[Math.floor(Math.random() * available.length)];
}

function startSleepingAnimation(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  s.idleAnimation = "sleeping";
  if (s.bubbleVisible) {
    deps.bubbleTextEl.textContent = pickFromPool(deps, SLEEPING_MESSAGES);
  }
}

export function maybeStartIdleAnimation(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  const threshold = idleFrameThreshold(s);
  if (s.idleAnimation != null || s.idleTime < threshold || Math.random() >= 0.1) {
    return;
  }

  s.idleAnimationFrame = 0;
  if (s.sleepEnabledCfg && s.idleTime > threshold * 3) {
    startSleepingAnimation(deps);
    return;
  }

  s.idleAnimation = pickRandomIdleAnimation(s);
}

function computeIdleSpriteIndex(
  animName: IdleActivityState,
  frame: number,
  animationSpeed: number,
): number {
  const sprites = defaultSpriteSets[animName as keyof typeof defaultSpriteSets];
  const baseDuration = IDLE_ANIMATION_DURATIONS[animName] ?? (sprites ? sprites.length * 8 : 8);
  const duration = Math.max(1, Math.round(baseDuration / animationSpeed));
  const frameCount = sprites?.length || 1;
  const framesPerSprite = Math.max(1, Math.floor(duration / frameCount));
  return Math.floor(frame / framesPerSprite) % frameCount;
}

function getIdleAnimationDuration(animName: IdleActivityState, animationSpeed: number): number {
  const sprites = defaultSpriteSets[animName as keyof typeof defaultSpriteSets];
  const baseDuration = IDLE_ANIMATION_DURATIONS[animName] ?? (sprites ? sprites.length * 8 : 8);
  return Math.max(1, Math.round(baseDuration / animationSpeed));
}

function resetOrLoopIdleAnimation(
  s: CatRuntimeState,
  animName: IdleActivityState,
  duration: number,
) {
  if (s.idleAnimationFrame < duration || animName === "sleeping") {
    return;
  }

  if (s.stateLocked || s.noFollow) {
    s.idleAnimationFrame = 0;
    return;
  }

  s.idleAnimation = null;
  s.idleAnimationFrame = 0;
}

export function updateIdleAnimation(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  if (!s.sleepEnabledCfg && (s.idleAnimation === "sleeping" || s.idleAnimation === "tired")) {
    s.idleAnimation = null;
    s.idleAnimationFrame = 0;
    s.idleTime = 0;
  }
  if (!s.idleAnimation) {
    return false;
  }

  const animName = s.idleAnimation;
  const spriteIndex = computeIdleSpriteIndex(animName, s.idleAnimationFrame, s.animationSpeedCfg);
  setSprite(deps, animName, spriteIndex);
  clearRotation(deps);
  s.idleAnimationFrame += 1;
  resetOrLoopIdleAnimation(s, animName, getIdleAnimationDuration(animName, s.animationSpeedCfg));
  return true;
}

export function freezeLockedState(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  if (!(s.stateLocked || s.noFollow) || (s.freerunMode && !s.noFollow)) {
    return false;
  }

  s.nekoVelX *= 0.5;
  s.nekoVelY *= 0.5;
  s.idleTime = Math.max(s.idleTime, 1);
  setSprite(deps, "idle", s.frameCount);
  clearRotation(deps);
  return true;
}
