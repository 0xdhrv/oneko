import { defaultSpriteSets, DIRECTION_RANGES, TILE } from "../constants";
import type { CatAnimationDeps } from "./deps";

export function setSprite(
  deps: CatAnimationDeps,
  name: keyof typeof defaultSpriteSets | string,
  frame: number,
) {
  const sprites = defaultSpriteSets[name as keyof typeof defaultSpriteSets];
  if (!sprites?.length) {
    return;
  }
  const sprite = sprites[frame % sprites.length];
  deps.el.style.backgroundPosition = `${sprite[0] * TILE}px ${sprite[1] * TILE}px`;
}

function getDirectionFromAngle(angle: number): string {
  if (angle >= 157.5 || angle < -157.5) {
    return "W";
  }
  for (const range of DIRECTION_RANGES) {
    if (angle >= range.min && angle < range.max) {
      return range.dir;
    }
  }
  return "E";
}

export function directionFromDelta(dx: number, dy: number) {
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
    return null;
  }
  return getDirectionFromAngle(Math.atan2(dy, dx) * (180 / Math.PI));
}

export function clearRotation(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  if (s.currentRotation !== 0) {
    s.currentRotation = 0;
    deps.el.style.transform = `scale(${s.scale}) rotate(0deg)`;
  }
}
