import type { CatActivityState, CatRuntimeState } from "../types";
import type { CatAnimationDeps } from "./deps";

export function getActivityLabel(deps: CatAnimationDeps): CatActivityState {
  const s = deps.stateRef.current;
  if (s.freerunMode) {
    return "freerun";
  }
  if (s.idleAnimation === "sleeping") {
    return "sleeping";
  }
  if (s.idleAnimation) {
    return s.idleAnimation;
  }
  if (s.idleTime > 0) {
    return "idle";
  }
  return "moving";
}

export function getBubbleStatus(s: CatRuntimeState) {
  if (s.bubbleVisible) {
    return "showing";
  }
  if (s.bubbleCooldown > 0) {
    return `cd ${s.bubbleCooldown}f`;
  }
  return "ready";
}

export function playSound(deps: CatAnimationDeps, pool: string[]) {
  const s = deps.stateRef.current;
  if (!s.enableMeow || s.soundCooldown > 0 || pool.length === 0) return;
  const url = pool[Math.floor(Math.random() * pool.length)];
  const filename = url.slice(url.lastIndexOf("/") + 1);
  const audio = new Audio(`${s.soundBasePathCfg}/${filename}`);
  audio.volume = s.soundVolumeCfg;
  s.soundCooldown = 20;
  audio.play().catch(() => {
    s.soundCooldown = 0;
  });
}
