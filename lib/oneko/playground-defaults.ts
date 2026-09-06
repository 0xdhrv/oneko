import type { OnekoSkin } from "./skins";
import { isOnekoSkin } from "./skins";
import type { OnekoProps } from "./types";

export const DEFAULT_ONEKO_PLAYGROUND_STATE = {
  paused: false,
  followCursor: true,
  sleepEnabled: true,
  bubblePlacement: "auto" as NonNullable<OnekoProps["bubblePlacement"]>,
  bubbleScale: 1,
  skin: "classic" as OnekoSkin,
  speed: 10,
  persistPosition: true,
  showCat: true,
  scale: 1,
  opacity: 1,
  rotationAmount: 15,
  idleThreshold: 1000,
  meow: false,
  volume: 0.5,
  laserPointer: false,
  bubbleChance: 0.5,
  followDistance: 20,
  animationSpeed: 1,
  bubbleText: "purr patrol",
  freerunChance: 0.06,
  freerunDuration: 40,
  bubbleEnabled: true,
  bubbleDisplayFrames: 180,
  bubbleCooldown: 120,
  hueRotate: 0,
  zoneAttractionChance: 0.3,
  zoneAttractionDuration: 4000,
};

export type OnekoPlaygroundState = typeof DEFAULT_ONEKO_PLAYGROUND_STATE;

export const PLAYGROUND_STORAGE_KEY = "oneko:playground:v1";

export const SETTING_RANGES = {
  bubbleScale: [0.5, 2, 0.1],
  speed: [1, 30, 1],
  scale: [0.5, 3, 0.5],
  opacity: [0.1, 1, 0.05],
  rotationAmount: [0, 45, 1],
  idleThreshold: [100, 5000, 100],
  volume: [0, 1, 0.05],
  bubbleChance: [0, 1, 0.05],
  followDistance: [10, 200, 5],
  animationSpeed: [0.5, 2, 0.1],
  freerunChance: [0, 0.3, 0.005],
  freerunDuration: [10, 200, 5],
  bubbleDisplayFrames: [30, 600, 10],
  bubbleCooldown: [0, 500, 10],
  hueRotate: [0, 360, 1],
  zoneAttractionChance: [0, 1, 0.05],
  zoneAttractionDuration: [1000, 10000, 500],
} as const;

/** Restore only known, correctly typed values. Old or damaged settings are harmless. */
export function restorePlaygroundState(raw: string | null): OnekoPlaygroundState {
  const state = { ...DEFAULT_ONEKO_PLAYGROUND_STATE };
  try {
    const saved: unknown = JSON.parse(raw ?? "null");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return state;
    for (const key of Object.keys(state) as (keyof OnekoPlaygroundState)[]) {
      const value = (saved as Record<string, unknown>)[key];
      if (key === "skin") {
        if (isOnekoSkin(value)) state.skin = value;
      } else if (key === "bubblePlacement") {
        if (value === "auto" || value === "above" || value === "below")
          state.bubblePlacement = value;
      } else if (key === "bubbleText") {
        if (typeof value === "string") state.bubbleText = value.slice(0, 120);
      } else if (key in SETTING_RANGES) {
        if (typeof value !== "number" || !Number.isFinite(value)) continue;
        const [min, max] = SETTING_RANGES[key as keyof typeof SETTING_RANGES];
        Object.assign(state, { [key]: Math.min(max, Math.max(min, value)) });
      } else if (typeof value === "boolean") {
        Object.assign(state, { [key]: value });
      }
    }
  } catch {
    /* Storage can be unavailable or contain an older format. */
  }
  return state;
}
