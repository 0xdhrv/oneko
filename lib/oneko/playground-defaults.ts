import {
  isRemoteSprite,
  isSavedSprite,
  isSpriteSource,
  MAX_SPRITE_BYTES,
  MAX_THOUGHT_TEXT_LENGTH,
  normalizeThoughts,
  validateThoughts,
} from "./custom-assets";
import { BUBBLE_PLACEMENTS, isOneOf } from "./option-values";
import { parseCustomSounds, type CustomSounds } from "./custom-sounds";
import { isOnekoSkin } from "./skins";
import { isOnekoSeason } from "./seasons";
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
  soundClips: {} as CustomSounds,
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
  napWhileTyping: ONEKO_DEFAULTS.napWhileTyping,
  followFocus: ONEKO_DEFAULTS.followFocus,
  perchOnHover: ONEKO_DEFAULTS.perchOnHover,
  pettable: ONEKO_DEFAULTS.pettable,
  seasonal: ONEKO_DEFAULTS.seasonal,
  grabbable: ONEKO_DEFAULTS.grabbable,
  treats: ONEKO_DEFAULTS.treats,
  timeOfDay: ONEKO_DEFAULTS.timeOfDay,
  affection: ONEKO_DEFAULTS.affection,
  /** Playground only: a second cat that chases the first. */
  friend: false,
};

export type OnekoPlaygroundState = typeof DEFAULT_ONEKO_PLAYGROUND_STATE;

/**
 * The playground friend: a classic-coat kitten that chases your cat. The classic coat ships in
 * every install, so exported code compiles with either registry item.
 */
/** The kitten that trails the main cat: quiet, smaller, and paused or settled along with it. */
export function friendProps(
  state: Pick<
    OnekoPlaygroundState,
    "scale" | "paused" | "followCursor" | "sleepEnabled" | "napWhileTyping" | "persistPosition"
  >,
) {
  return {
    chase: "cat" as const,
    scale: Math.max(0.5, state.scale / 2),
    storageKey: "oneko:friend",
    bubbleEnabled: false,
    paused: state.paused,
    followCursor: state.followCursor,
    sleepEnabled: state.sleepEnabled,
    napWhileTyping: state.napWhileTyping,
    persistPosition: state.persistPosition,
  };
}

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

type Rule<T> = {
  /** Why a value can't be imported, or null when it is valid. */
  invalid: (value: unknown) => string | null;
  /** For saved preferences: a usable value from damaged or older data, or undefined for the default. */
  repair?: (value: unknown) => T | undefined;
};

const flag = (key: string): Rule<boolean> => ({
  invalid: (value) => (typeof value === "boolean" ? null : `${key} must be true or false.`),
});

const ranged = (key: keyof typeof SETTING_RANGES): Rule<number> => {
  const [min, max] = SETTING_RANGES[key];
  return {
    invalid: (value) =>
      typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
        ? null
        : `${key} must be a number between ${min} and ${max}.`,
    repair: (value) =>
      typeof value === "number" && Number.isFinite(value)
        ? Math.min(max, Math.max(min, value))
        : undefined,
  };
};

function spriteProblem(value: unknown): string | null {
  if (value === "" || isRemoteSprite(value)) return null;
  if (!isSavedSprite(value))
    return "spriteSrc must be an embedded 256 × 128 PNG smaller than 256 KB, an https link, or empty.";
  try {
    return atob(value.slice(22)).length > MAX_SPRITE_BYTES
      ? "spriteSrc must be smaller than 256 KB."
      : null;
  } catch {
    return "spriteSrc contains invalid PNG data.";
  }
}

function thoughtsProblem(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_THOUGHT_TEXT_LENGTH || value.includes("\0"))
    return "bubbleText must contain up to 50 thoughts of 120 characters each.";
  try {
    validateThoughts(value);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "The thoughts could not be read.";
  }
}

/**
 * How each setting is checked. Every key needs a rule, so a new setting can't be imported or
 * restored as the wrong type. Imports reject invalid values; saved preferences repair or drop them.
 */
export const SETTING_RULES: { [K in keyof OnekoPlaygroundState]: Rule<OnekoPlaygroundState[K]> } = {
  paused: flag("paused"),
  followCursor: flag("followCursor"),
  sleepEnabled: flag("sleepEnabled"),
  bubblePlacement: {
    invalid: (value) =>
      isOneOf(BUBBLE_PLACEMENTS, value) ? null : "bubblePlacement must be auto, above, or below.",
  },
  bubbleScale: ranged("bubbleScale"),
  skin: {
    invalid: (value) => (isOnekoSkin(value) ? null : "skin must name an available Oneko coat."),
  },
  spriteSrc: {
    invalid: spriteProblem,
    // Saved preferences never held oversized sheets, so only the format is checked.
    repair: (value) => (value === "" || isSpriteSource(value) ? value : undefined),
  },
  spriteName: {
    invalid: (value) =>
      typeof value === "string" && value.length <= 255 && !value.includes("\0")
        ? null
        : "spriteName must be text of up to 255 characters.",
    repair: (value) => (typeof value === "string" ? value.slice(0, 255) : undefined),
  },
  soundClips: {
    invalid: (value) =>
      parseCustomSounds(value)
        ? null
        : "soundClips must name known moments with clips made in the studio.",
    repair: (value) => parseCustomSounds(value) ?? undefined,
  },
  speed: ranged("speed"),
  persistPosition: flag("persistPosition"),
  showCat: flag("showCat"),
  scale: ranged("scale"),
  opacity: ranged("opacity"),
  rotationAmount: ranged("rotationAmount"),
  idleThreshold: ranged("idleThreshold"),
  meow: flag("meow"),
  volume: ranged("volume"),
  laserPointer: flag("laserPointer"),
  bubbleChance: ranged("bubbleChance"),
  followDistance: ranged("followDistance"),
  animationSpeed: ranged("animationSpeed"),
  bubbleText: {
    invalid: thoughtsProblem,
    repair: (value) =>
      typeof value === "string"
        ? normalizeThoughts(value.slice(0, MAX_THOUGHT_TEXT_LENGTH))
        : undefined,
  },
  freerunChance: ranged("freerunChance"),
  freerunDuration: ranged("freerunDuration"),
  bubbleEnabled: flag("bubbleEnabled"),
  bubbleDisplayFrames: ranged("bubbleDisplayFrames"),
  bubbleCooldown: ranged("bubbleCooldown"),
  hueRotate: ranged("hueRotate"),
  zoneAttractionChance: ranged("zoneAttractionChance"),
  zoneAttractionDuration: ranged("zoneAttractionDuration"),
  napWhileTyping: flag("napWhileTyping"),
  followFocus: flag("followFocus"),
  perchOnHover: flag("perchOnHover"),
  pettable: flag("pettable"),
  seasonal: {
    invalid: (value) =>
      typeof value === "boolean" || isOnekoSeason(value)
        ? null
        : "seasonal must be true, false, halloween, winter, or newYear.",
  },
  grabbable: flag("grabbable"),
  treats: flag("treats"),
  timeOfDay: flag("timeOfDay"),
  affection: flag("affection"),
  friend: flag("friend"),
};

const SETTING_KEYS = Object.keys(DEFAULT_ONEKO_PLAYGROUND_STATE) as (keyof OnekoPlaygroundState)[];

/**
 * Check imported settings. Unknown keys are rejected; missing ones use the defaults, so files and
 * links made before a setting existed still open.
 */
export function checkPlaygroundSettings(
  settings: Record<string, unknown>,
): { ok: true; value: OnekoPlaygroundState } | { ok: false; error: string } {
  const unknown = Object.keys(settings).find(
    (key) => !Object.hasOwn(DEFAULT_ONEKO_PLAYGROUND_STATE, key),
  );
  if (unknown !== undefined)
    return { ok: false, error: `Unknown setting: ${JSON.stringify(unknown)}.` };
  const value: Record<string, unknown> = { ...DEFAULT_ONEKO_PLAYGROUND_STATE };
  for (const key of SETTING_KEYS) {
    if (!Object.hasOwn(settings, key)) continue;
    const error = SETTING_RULES[key].invalid(settings[key]);
    if (error) return { ok: false, error };
    value[key] = settings[key];
  }
  return { ok: true, value: value as OnekoPlaygroundState };
}

/** Restore only known, correctly typed values. Old or damaged settings are harmless. */
export function restorePlaygroundState(raw: string | null): OnekoPlaygroundState {
  const state: Record<string, unknown> = { ...DEFAULT_ONEKO_PLAYGROUND_STATE };
  let saved: unknown;
  try {
    saved = JSON.parse(raw ?? "null");
  } catch {
    /* Damaged JSON restores the defaults. */
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved))
    return state as OnekoPlaygroundState;
  for (const key of SETTING_KEYS) {
    const value: unknown = (saved as Record<string, unknown>)[key];
    const rule: Rule<unknown> = SETTING_RULES[key];
    const restored = rule.repair
      ? rule.repair(value)
      : rule.invalid(value) === null
        ? value
        : undefined;
    if (restored !== undefined) state[key] = restored;
  }
  return state as OnekoPlaygroundState;
}
