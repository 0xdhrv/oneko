import { isSavedSprite, normalizeThoughts, MAX_THOUGHT_TEXT_LENGTH } from "./custom-assets";
import { isOnekoSkin } from "./skins";
import { ONEKO_DEFAULTS } from "./defaults";

export const DEFAULT_ONEKO_PLAYGROUND_STATE = {
  paused: ONEKO_DEFAULTS.paused,
  followCursor: ONEKO_DEFAULTS.followCursor,
  sleepEnabled: ONEKO_DEFAULTS.sleepEnabled,
  bubblePlacement: ONEKO_DEFAULTS.bubblePlacement,
  bubbleScale: ONEKO_DEFAULTS.bubbleScale,
  skin: ONEKO_DEFAULTS.skin,
  spriteSrc: "",
  spriteName: "",
  speed: ONEKO_DEFAULTS.speed,
  persistPosition: ONEKO_DEFAULTS.persistPosition,
  showCat: true,
  scale: ONEKO_DEFAULTS.scale,
  opacity: ONEKO_DEFAULTS.opacity,
  rotationAmount: ONEKO_DEFAULTS.rotationAmount,
  idleThreshold: ONEKO_DEFAULTS.idleThreshold,
  meow: ONEKO_DEFAULTS.meow,
  volume: ONEKO_DEFAULTS.volume,
  laserPointer: ONEKO_DEFAULTS.laserPointer,
  bubbleChance: ONEKO_DEFAULTS.bubbleChance,
  followDistance: ONEKO_DEFAULTS.followDistance,
  animationSpeed: ONEKO_DEFAULTS.animationSpeed,
  bubbleText: "purr patrol",
  freerunChance: ONEKO_DEFAULTS.freerunChance,
  freerunDuration: ONEKO_DEFAULTS.freerunDuration,
  bubbleEnabled: ONEKO_DEFAULTS.bubbleEnabled,
  bubbleDisplayFrames: ONEKO_DEFAULTS.bubbleDisplayFrames,
  bubbleCooldown: ONEKO_DEFAULTS.bubbleCooldown,
  hueRotate: ONEKO_DEFAULTS.hueRotate,
  zoneAttractionChance: ONEKO_DEFAULTS.zoneAttractionChance,
  zoneAttractionDuration: ONEKO_DEFAULTS.zoneAttractionDuration,
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
        if (typeof value === "string")
          state.bubbleText = normalizeThoughts(value.slice(0, MAX_THOUGHT_TEXT_LENGTH));
      } else if (key === "spriteSrc") {
        if (isSavedSprite(value)) state.spriteSrc = value;
      } else if (key === "spriteName") {
        if (typeof value === "string") state.spriteName = value.slice(0, 255);
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
