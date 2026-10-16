import { TILE } from "../constants";
import type { CatRuntimeState, PathPoint } from "../types";
import type { Errand } from "./play-types";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(Math.max(min, max), value));

function visibleRect(el: Element): DOMRect | null {
  if (!el.isConnected) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  if (rect.bottom < 0 || rect.right < 0 || rect.top > window.innerHeight) return null;
  if (rect.left > window.innerWidth) return null;
  return rect;
}

/**
 * Where an errand takes the cat, in viewport coordinates, or null when its element is gone or
 * off screen. Element targets are re-read every tick, so they follow scrolling and layout.
 */
export function errandPoint(s: CatRuntimeState, errand: Errand): PathPoint | null {
  const half = (TILE * s.scale) / 2;
  const maxX = window.innerWidth - 16;
  const maxY = window.innerHeight - 16;
  switch (errand.kind) {
    case "sit":
      return { x: s.nekoPosX, y: s.nekoPosY };
    case "treat":
      return errand.treat.eaten ? null : { x: errand.treat.x, y: errand.treat.y };
    case "goTo": {
      const { target } = errand;
      if (!(target instanceof Element))
        return { x: clamp(target.x, 16, maxX), y: clamp(target.y, 16, maxY) };
      const rect = visibleRect(target);
      if (!rect) return null;
      // Settle just below the element, or above it when there is no room below.
      const below = rect.bottom + half + 4;
      return {
        x: clamp(rect.left + rect.width / 2, 16, maxX),
        y: below < maxY ? below : clamp(rect.top - half - 4, 16, maxY),
      };
    }
    case "box": {
      const rect = visibleRect(errand.el);
      if (!rect) return null;
      return {
        x: clamp(rect.left + rect.width / 2, 16, maxX),
        y: clamp(Math.max(rect.top + half, rect.bottom - half - 2), 16, maxY),
      };
    }
    case "knock": {
      const rect = visibleRect(errand.el);
      if (!rect) return null;
      // Stand beside the element, feet level with its bottom, on the side it gets pushed from.
      const x = errand.direction === 1 ? rect.left - half * 0.75 : rect.right + half * 0.75;
      return {
        x: clamp(x, 16, maxX),
        y: clamp(Math.max(rect.top + half / 2, rect.bottom - half), 16, maxY),
      };
    }
  }
}
