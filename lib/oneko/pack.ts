import { TILE } from "./constants";
import type { CatRuntimeState, PathPoint } from "./types";

/** Every running cat on the page, in mount order. A cat with chase="cat" follows the one before it. */
const pack: CatRuntimeState[] = [];
// Restarting a cat (for example after a zIndex change) keeps its first place in line.
const firstSeen = new WeakMap<CatRuntimeState, number>();
let arrivals = 0;

export function joinPack(state: CatRuntimeState): () => void {
  if (!firstSeen.has(state)) firstSeen.set(state, arrivals++);
  if (!pack.includes(state)) {
    pack.push(state);
    pack.sort((a, b) => firstSeen.get(a)! - firstSeen.get(b)!);
  }
  return () => {
    const index = pack.indexOf(state);
    if (index !== -1) pack.splice(index, 1);
    for (const cat of pack) cat.leaderTarget = null;
  };
}

/** Where the cat ahead of this one is, or null when it leads (or chases the cursor). */
export function leaderPosition(state: CatRuntimeState): PathPoint | null {
  if (state.chaseCfg !== "cat") return null;
  const leader = pack[pack.indexOf(state) - 1];
  return leader ? { x: leader.nekoPosX, y: leader.nekoPosY } : null;
}

/** True when no other running cat is closer to a point, so only one cat answers a page event. */
export function isNearestCat(state: CatRuntimeState, point: PathPoint): boolean {
  const distance = (cat: CatRuntimeState) =>
    Math.hypot(cat.nekoPosX - point.x, cat.nekoPosY - point.y);
  const mine = distance(state);
  const order = pack.indexOf(state);
  return pack.every(
    (cat, index) =>
      cat === state || distance(cat) > mine || (distance(cat) === mine && index > order),
  );
}

export function packSize(): number {
  return pack.length;
}

/** True when another cat is asleep close enough to curl up next to. */
export function napmateNearby(state: CatRuntimeState): boolean {
  const reach = TILE * Math.max(1, state.scale) * 2;
  return pack.some(
    (cat) =>
      cat !== state &&
      cat.idleAnimation === "sleeping" &&
      Math.hypot(cat.nekoPosX - state.nekoPosX, cat.nekoPosY - state.nekoPosY) < reach,
  );
}

/** Visitor preference, shared by every cat on the site and remembered across visits. */
export const HIDDEN_STORAGE_KEY = "oneko:hidden";
const HIDDEN_EVENT = "oneko:hiddenchange";
let hiddenWithoutStorage = false;

export function areCatsHidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_STORAGE_KEY) === "1";
  } catch {
    return hiddenWithoutStorage;
  }
}

export function setCatsHidden(hidden: boolean): void {
  hiddenWithoutStorage = hidden;
  try {
    if (hidden) localStorage.setItem(HIDDEN_STORAGE_KEY, "1");
    else localStorage.removeItem(HIDDEN_STORAGE_KEY);
  } catch {
    /* Storage can be unavailable; the event still updates this page. */
  }
  window.dispatchEvent(new CustomEvent(HIDDEN_EVENT, { detail: { hidden } }));
}

/** Calls back when cats are hidden or shown, in this tab or another one. */
export function onCatsHiddenChange(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === HIDDEN_STORAGE_KEY || event.key === null) callback();
  };
  window.addEventListener(HIDDEN_EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(HIDDEN_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}
