import { TILE } from "./constants";
import type { ObstacleRect, PathPoint } from "./types";

export type OnekoZone = {
  id: string;
  type: "avoid" | "attract";
  /** CSS selector. All matching visible elements become zones. */
  selector?: string;
  /** Fixed viewport coordinates in CSS pixels; selector takes precedence. */
  rect?: ObstacleRect;
  /** Extra space outside a keep-out zone, in pixels. */
  padding?: number;
};

export type ResolvedZone = { id: string; type: OnekoZone["type"]; rect: ObstacleRect };

export function isValidRect(rect: ObstacleRect): boolean {
  return (
    Object.values(rect).every(Number.isFinite) && rect.right > rect.left && rect.bottom > rect.top
  );
}

export function expandRect(rect: ObstacleRect, padding: number): ObstacleRect {
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
  };
}

export function containsPoint(rect: ObstacleRect, point: PathPoint): boolean {
  return point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom;
}

/** Conservative radius also protects the corners when a scaled cat tilts. */
export function catZoneRadius(scale: number): number {
  return (TILE / 2) * Math.max(0.1, Number.isFinite(scale) ? scale : 1) * Math.SQRT2 + 1;
}

const elementIds = new WeakMap<Element, number>();
let nextElementId = 0;
function zoneElementId(element: Element): number {
  if (!elementIds.has(element)) elementIds.set(element, ++nextElementId);
  return elementIds.get(element)!;
}

export function collectZones(zones: readonly OnekoZone[]): ResolvedZone[] {
  const result: ResolvedZone[] = [];
  const add = (id: string, type: OnekoZone["type"], rect: ObstacleRect, padding = 0) => {
    if (!isValidRect(rect)) return;
    const extra = Number.isFinite(padding) ? Math.max(0, padding) : 0;
    result.push({ id, type, rect: expandRect(rect, type === "avoid" ? extra : 0) });
  };
  const addElement = (id: string, type: OnekoZone["type"], element: Element, padding = 0) => {
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") return;
    const { left, top, right, bottom } = element.getBoundingClientRect();
    add(id, type, { left, top, right, bottom }, padding);
  };
  for (const zone of zones) {
    if (zone.type !== "avoid" && zone.type !== "attract") continue;
    if (zone.selector) {
      try {
        document
          .querySelectorAll(zone.selector)
          .forEach((element) =>
            addElement(`${zone.id}:${zoneElementId(element)}`, zone.type, element, zone.padding),
          );
      } catch {
        /* A stale or invalid selector must not stop the cat. */
      }
    } else if (zone.rect) add(zone.id, zone.type, zone.rect, zone.padding);
  }
  document
    .querySelectorAll('[data-oneko-zone="avoid"], [data-oneko-zone="attract"]')
    .forEach((element) => {
      addElement(
        `data-zone:${zoneElementId(element)}`,
        element.getAttribute("data-oneko-zone") as OnekoZone["type"],
        element,
      );
    });
  return result;
}

/** Find a safe center even when zones overlap or appear around a resting cat. */
export function nearestSafePoint(
  point: PathPoint,
  blocked: ObstacleRect[],
  width: number,
  height: number,
  margin: number,
): PathPoint | null {
  if (width < margin * 2 || height < margin * 2) return null;
  const clampX = (x: number) => Math.max(margin, Math.min(width - margin, x));
  const clampY = (y: number) => Math.max(margin, Math.min(height - margin, y));
  const origin = { x: clampX(point.x), y: clampY(point.y) };
  if (!blocked.some((rect) => containsPoint(rect, origin))) return origin;
  const xs = [
    origin.x,
    margin,
    width - margin,
    ...blocked.flatMap((rect) => [rect.left, rect.right]),
  ].map(clampX);
  const ys = [
    origin.y,
    margin,
    height - margin,
    ...blocked.flatMap((rect) => [rect.top, rect.bottom]),
  ].map(clampY);
  let closest: PathPoint | null = null;
  let distance = Infinity;
  for (const x of xs)
    for (const y of ys) {
      const candidate = { x, y };
      if (blocked.some((rect) => containsPoint(rect, candidate))) continue;
      const nextDistance = Math.hypot(x - point.x, y - point.y);
      if (nextDistance < distance) {
        distance = nextDistance;
        closest = candidate;
      }
    }
  return closest;
}

/** Swept collision: a fast cat cannot jump over a thin forbidden zone between ticks. */
export function constrainZoneMovement(
  from: PathPoint,
  to: PathPoint,
  blocked: ObstacleRect[],
): PathPoint {
  let limit = 1;
  const dx = to.x - from.x,
    dy = to.y - from.y;
  for (const rect of blocked) {
    let enter = -Infinity,
      leave = Infinity;
    let misses = false;
    for (const [position, delta, min, max] of [
      [from.x, dx, rect.left, rect.right],
      [from.y, dy, rect.top, rect.bottom],
    ]) {
      if (Math.abs(delta) < 1e-9) {
        if (position <= min || position >= max) {
          misses = true;
          break;
        }
      } else {
        const a = (min - position) / delta,
          b = (max - position) / delta;
        enter = Math.max(enter, Math.min(a, b));
        leave = Math.min(leave, Math.max(a, b));
      }
    }
    if (!misses && enter < leave && leave > 0 && enter >= 0 && enter < limit)
      limit = Math.max(0, enter - 0.001);
  }
  return { x: from.x + dx * limit, y: from.y + dy * limit };
}
