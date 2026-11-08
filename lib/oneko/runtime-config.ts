import { ONEKO_DEFAULTS } from "./defaults";
import { EMPTY_ZONES } from "./zone-runtime";
import type { OnekoZone } from "./zones";
import { isOnekoSeason } from "./seasons";
import { BUBBLE_PLACEMENTS, CHASE_TARGETS, isOneOf } from "./option-values";
import type { CatRuntimeState, OnekoEventHandlers, OnekoProps } from "./types";

/** Options the running engine reads every tick. Each one is resolved below, so none can be missed. */
type CatConfigKey =
  | "paused"
  | "followCursor"
  | "sleepEnabled"
  | "bubblePlacement"
  | "bubbleScale"
  | "soundBasePath"
  | "sounds"
  | "speed"
  | "scale"
  | "opacity"
  | "rotationAmount"
  | "idleThreshold"
  | "freerunChance"
  | "freerunDuration"
  | "bubbleEnabled"
  | "bubbleDisplayFrames"
  | "bubbleCooldown"
  | "bubbleChance"
  | "followDistance"
  | "animationSpeed"
  | "bubbleText"
  | "meow"
  | "volume"
  | "laserPointer"
  | "chase"
  | "napWhileTyping"
  | "followFocus"
  | "perchOnHover"
  | "seasonal"
  | "grabbable"
  | "treats"
  | "timeOfDay"
  | "affection";

/** Resolved options: defaults filled in, numbers clamped to what the engine and browser accept. */
export type CatConfig = { [K in CatConfigKey]-?: NonNullable<OnekoProps[K]> };

/** Options as a host passes them. Undefined means the default. */
export type CatRuntimeConfig = Pick<
  OnekoProps,
  | CatConfigKey
  | "zones"
  | "zoneAttractionChance"
  | "zoneAttractionDuration"
  | keyof OnekoEventHandlers
> & { zones?: readonly OnekoZone[] };

/** A finite number within [min, max], or the fallback. */
function bounded(value: number | undefined, fallback: number, min: number, max = Infinity) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}

export function resolveCatConfig(config: CatRuntimeConfig): CatConfig {
  const d = ONEKO_DEFAULTS;
  const seasonal = config.seasonal ?? d.seasonal;
  return {
    paused: config.paused ?? d.paused,
    followCursor: config.followCursor ?? d.followCursor,
    sleepEnabled: config.sleepEnabled ?? d.sleepEnabled,
    bubblePlacement: isOneOf(BUBBLE_PLACEMENTS, config.bubblePlacement)
      ? config.bubblePlacement
      : d.bubblePlacement,
    bubbleScale: bounded(config.bubbleScale, d.bubbleScale, 0.5, 2),
    soundBasePath: (config.soundBasePath ?? d.soundBasePath).replace(/\/+$/, ""),
    sounds: config.sounds ?? {},
    speed: bounded(config.speed, d.speed, 0),
    scale: bounded(config.scale, d.scale, 0.1, 20),
    opacity: bounded(config.opacity, d.opacity, 0, 1),
    rotationAmount: bounded(config.rotationAmount, d.rotationAmount, 0, 180),
    idleThreshold: bounded(config.idleThreshold, d.idleThreshold, 0),
    freerunChance: bounded(config.freerunChance, d.freerunChance, 0, 1),
    freerunDuration: bounded(config.freerunDuration, d.freerunDuration, 0),
    bubbleEnabled: config.bubbleEnabled ?? d.bubbleEnabled,
    bubbleDisplayFrames: bounded(config.bubbleDisplayFrames, d.bubbleDisplayFrames, 1),
    bubbleCooldown: bounded(config.bubbleCooldown, d.bubbleCooldown, 0),
    bubbleChance: bounded(config.bubbleChance, d.bubbleChance, 0, 1),
    followDistance: bounded(config.followDistance, d.followDistance, 0),
    animationSpeed: bounded(config.animationSpeed, d.animationSpeed, 0.5, 2),
    bubbleText: config.bubbleText ?? d.bubbleText,
    meow: config.meow ?? d.meow,
    // HTMLMediaElement.volume throws outside 0–1.
    volume: bounded(config.volume, d.volume, 0, 1),
    laserPointer: config.laserPointer ?? d.laserPointer,
    chase: isOneOf(CHASE_TARGETS, config.chase) ? config.chase : d.chase,
    napWhileTyping: config.napWhileTyping ?? d.napWhileTyping,
    followFocus: config.followFocus ?? d.followFocus,
    perchOnHover: config.perchOnHover ?? d.perchOnHover,
    seasonal: typeof seasonal === "boolean" || isOnekoSeason(seasonal) ? seasonal : true,
    grabbable: config.grabbable ?? d.grabbable,
    treats: config.treats ?? d.treats,
    timeOfDay: config.timeOfDay ?? d.timeOfDay,
    affection: config.affection ?? d.affection,
  };
}

export function applyRuntimeConfig(state: CatRuntimeState, config: CatRuntimeConfig): void {
  const cfg = resolveCatConfig(config);
  const previous = state.cfg;
  state.cfg = cfg;
  if (!cfg.followCursor) {
    state.freerunMode = false;
    state.freerunTimer = 0;
    state.currentPath = [];
    state.pathWaypointIdx = 0;
    state.nekoVelX = 0;
    state.nekoVelY = 0;
  }
  const definitions = config.zones ?? EMPTY_ZONES;
  if (definitions !== state.zoneState.definitions || cfg.scale !== previous.scale)
    state.zoneState.collectedFrame = -Infinity;
  state.zoneState.definitions = definitions;
  state.zoneState.chance = bounded(
    config.zoneAttractionChance,
    ONEKO_DEFAULTS.zoneAttractionChance,
    0,
    1,
  );
  state.zoneState.duration = Number.isFinite(config.zoneAttractionDuration)
    ? Math.max(1, Math.min(600, Math.round(config.zoneAttractionDuration! / 100)))
    : ONEKO_DEFAULTS.zoneAttractionDuration / 100;
  if (!cfg.laserPointer) state.laserCaught = false;
  if (!cfg.napWhileTyping) state.typingNap = false;
  if (!cfg.perchOnHover) state.perchTarget = null;
  if (!cfg.followFocus) state.focusTarget = null;
  state.handlers = {
    onPet: config.onPet,
    onCatchCursor: config.onCatchCursor,
    onSleep: config.onSleep,
    onToss: config.onToss,
    onTreat: config.onTreat,
  };
  if (!cfg.grabbable && state.grab?.phase === "held") state.grab = null;
}
