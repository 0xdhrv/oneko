import { TILE } from "./constants";
import { ONEKO_DEFAULTS } from "./defaults";
import type { CatRuntimeState } from "./types";

export type PersistedPosition = { version: 1; x: number; y: number };

export function parsePersistedPosition(value: unknown): PersistedPosition | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== undefined && record.version !== 1) return null;
  const x = record.version === 1 ? record.x : record.nekoPosX;
  const y = record.version === 1 ? record.y : record.nekoPosY;
  if (typeof x !== "number" || !Number.isFinite(x)) return null;
  if (typeof y !== "number" || !Number.isFinite(y)) return null;
  return { version: 1, x, y };
}

export function loadPersistedCatState(
  stateRef: { current: CatRuntimeState },
  el: HTMLDivElement,
  storageKey = ONEKO_DEFAULTS.storageKey,
): void {
  let position: PersistedPosition | null;
  try {
    position = parsePersistedPosition(
      JSON.parse(window.localStorage.getItem(storageKey) ?? "null"),
    );
  } catch {
    return;
  }
  if (!position) return;

  const clamp = (value: number, extent: number) => {
    const inset = Math.min(TILE / 2, Math.max(0, extent / 2));
    return Math.max(inset, Math.min(Math.max(inset, extent - inset), value));
  };
  const state = stateRef.current;
  state.nekoPosX = state.mousePosX = clamp(position.x, window.innerWidth);
  state.nekoPosY = state.mousePosY = clamp(position.y, window.innerHeight);
  state.nekoVelX = state.nekoVelY = 0;
  state.currentPath = [];
  state.pathWaypointIdx = 0;
  el.style.left = `${state.nekoPosX - TILE / 2}px`;
  el.style.top = `${state.nekoPosY - TILE / 2}px`;
}

export function createPersistHandler(
  stateRef: { current: CatRuntimeState },
  storageKey = ONEKO_DEFAULTS.storageKey,
): () => void {
  return () => {
    const state = stateRef.current;
    const position = parsePersistedPosition({ version: 1, x: state.nekoPosX, y: state.nekoPosY });
    if (!position) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(position));
    } catch {
      // Position persistence is optional when browser storage is unavailable.
    }
  };
}
