import { SOUND_POOLS } from "../constants";
import type { CatActivityState, CatRuntimeState, OnekoSoundEvent } from "../types";
import type { CatAnimationDeps } from "./deps";

export function getActivityLabel(deps: CatAnimationDeps): CatActivityState {
  const s = deps.stateRef.current;
  if (s.grab && s.grab.phase !== "landed") {
    return "alert";
  }
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

/** A full URL for this moment: the host's own clip, or a built-in file under soundBasePath. */
function pickSound(s: CatRuntimeState, event: OnekoSoundEvent): string | undefined {
  const custom = s.cfg.sounds[event];
  const pool = custom ?? SOUND_POOLS[event];
  const url = typeof pool === "string" ? pool : pool[Math.floor(Math.random() * pool.length)];
  if (!url || custom !== undefined) return url;
  return `${s.cfg.soundBasePath}/${url.slice(url.lastIndexOf("/") + 1)}`;
}

export function playSound(deps: CatAnimationDeps, event: OnekoSoundEvent) {
  const s = deps.stateRef.current;
  if (!s.cfg.meow || s.soundCooldown > 0) return;
  const url = pickSound(s, event);
  if (!url) return;
  const audio = new Audio(url);
  audio.volume = s.cfg.volume;
  s.soundCooldown = 20;
  audio.play().catch(() => {
    s.soundCooldown = 0;
  });
}
