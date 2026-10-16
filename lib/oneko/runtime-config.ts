import { ONEKO_DEFAULTS } from "./defaults";
import { EMPTY_ZONES } from "./zone-runtime";
import type { OnekoZone } from "./zones";
import { isOnekoSeason } from "./seasons";
import type { CatRuntimeState, OnekoProps } from "./types";

type RuntimeConfigStateFields = Pick<
  CatRuntimeState,
  | "pausedCfg"
  | "followCursorCfg"
  | "sleepEnabledCfg"
  | "bubblePlacementCfg"
  | "bubbleScaleCfg"
  | "soundBasePathCfg"
  | "currentSpeed"
  | "scale"
  | "opacity"
  | "rotationAmount"
  | "idleThresholdMs"
  | "freerunChanceCfg"
  | "freerunDurationCfg"
  | "bubbleEnabledCfg"
  | "bubbleDisplayFramesCfg"
  | "bubbleCooldownFramesCfg"
  | "bubbleChanceCfg"
  | "followDistanceCfg"
  | "animationSpeedCfg"
  | "customBubbleText"
  | "currentRotation"
  | "enableMeow"
  | "soundVolumeCfg"
  | "soundCooldown"
  | "bubbleTimer"
  | "bubbleCooldown"
  | "bubbleVisible"
  | "lastBubbleMsg"
  | "laserPointerCfg"
  | "laserCaught"
  | "chaseCfg"
  | "napWhileTypingCfg"
  | "followFocusCfg"
  | "perchOnHoverCfg"
  | "seasonalCfg"
  | "grabbableCfg"
  | "treatsCfg"
  | "timeOfDayCfg"
  | "affectionCfg"
  | "handlers"
>;

export function defaultRuntimeConfigState(): RuntimeConfigStateFields {
  return {
    pausedCfg: ONEKO_DEFAULTS.paused,
    followCursorCfg: ONEKO_DEFAULTS.followCursor,
    sleepEnabledCfg: ONEKO_DEFAULTS.sleepEnabled,
    bubblePlacementCfg: ONEKO_DEFAULTS.bubblePlacement,
    bubbleScaleCfg: ONEKO_DEFAULTS.bubbleScale,
    soundBasePathCfg: ONEKO_DEFAULTS.soundBasePath,
    currentSpeed: ONEKO_DEFAULTS.speed,
    scale: ONEKO_DEFAULTS.scale,
    opacity: ONEKO_DEFAULTS.opacity,
    rotationAmount: ONEKO_DEFAULTS.rotationAmount,
    idleThresholdMs: ONEKO_DEFAULTS.idleThreshold,
    freerunChanceCfg: ONEKO_DEFAULTS.freerunChance,
    freerunDurationCfg: ONEKO_DEFAULTS.freerunDuration,
    bubbleEnabledCfg: ONEKO_DEFAULTS.bubbleEnabled,
    bubbleDisplayFramesCfg: ONEKO_DEFAULTS.bubbleDisplayFrames,
    bubbleCooldownFramesCfg: ONEKO_DEFAULTS.bubbleCooldown,
    bubbleChanceCfg: ONEKO_DEFAULTS.bubbleChance,
    followDistanceCfg: ONEKO_DEFAULTS.followDistance,
    animationSpeedCfg: ONEKO_DEFAULTS.animationSpeed,
    customBubbleText: ONEKO_DEFAULTS.bubbleText,
    currentRotation: 0,
    enableMeow: ONEKO_DEFAULTS.meow,
    soundVolumeCfg: ONEKO_DEFAULTS.volume,
    soundCooldown: 0,
    bubbleTimer: 0,
    bubbleCooldown: 0,
    bubbleVisible: false,
    lastBubbleMsg: -1,
    laserPointerCfg: ONEKO_DEFAULTS.laserPointer,
    laserCaught: false,
    chaseCfg: ONEKO_DEFAULTS.chase,
    napWhileTypingCfg: ONEKO_DEFAULTS.napWhileTyping,
    followFocusCfg: ONEKO_DEFAULTS.followFocus,
    perchOnHoverCfg: ONEKO_DEFAULTS.perchOnHover,
    seasonalCfg: ONEKO_DEFAULTS.seasonal,
    grabbableCfg: ONEKO_DEFAULTS.grabbable,
    treatsCfg: ONEKO_DEFAULTS.treats,
    timeOfDayCfg: ONEKO_DEFAULTS.timeOfDay,
    affectionCfg: ONEKO_DEFAULTS.affection,
    handlers: {},
  };
}

export type CatRuntimeConfig = Pick<
  OnekoProps,
  | "paused"
  | "followCursor"
  | "sleepEnabled"
  | "bubblePlacement"
  | "bubbleScale"
  | "soundBasePath"
  | "chase"
  | "napWhileTyping"
  | "followFocus"
  | "perchOnHover"
  | "seasonal"
  | "grabbable"
  | "treats"
  | "timeOfDay"
  | "affection"
  | "onPet"
  | "onCatchCursor"
  | "onSleep"
  | "onToss"
  | "onTreat"
> & {
  zones?: readonly OnekoZone[];
  zoneAttractionChance?: number;
  zoneAttractionDuration?: number;
  speed: number;
  scale: number;
  opacity: number;
  rotationAmount: number;
  idleThreshold: number;
  freerunChance: number;
  freerunDuration: number;
  bubbleEnabled: boolean;
  bubbleDisplayFrames: number;
  bubbleCooldown: number;
  bubbleChance: number;
  followDistance: number;
  animationSpeed: number;
  bubbleText: NonNullable<OnekoProps["bubbleText"]>;
  meow: boolean;
  volume: number;
  laserPointer: boolean;
};

export function applyRuntimeConfig(state: CatRuntimeState, config: CatRuntimeConfig): void {
  state.pausedCfg = config.paused ?? ONEKO_DEFAULTS.paused;
  state.followCursorCfg = config.followCursor ?? ONEKO_DEFAULTS.followCursor;
  state.sleepEnabledCfg = config.sleepEnabled ?? ONEKO_DEFAULTS.sleepEnabled;
  state.bubblePlacementCfg =
    config.bubblePlacement === "above" || config.bubblePlacement === "below"
      ? config.bubblePlacement
      : ONEKO_DEFAULTS.bubblePlacement;
  state.bubbleScaleCfg = Number.isFinite(config.bubbleScale)
    ? Math.max(0.5, Math.min(2, config.bubbleScale!))
    : ONEKO_DEFAULTS.bubbleScale;
  state.soundBasePathCfg = (config.soundBasePath ?? ONEKO_DEFAULTS.soundBasePath).replace(
    /\/+$/,
    "",
  );
  if (!state.followCursorCfg) {
    state.freerunMode = false;
    state.freerunTimer = 0;
    state.currentPath = [];
    state.pathWaypointIdx = 0;
    state.nekoVelX = 0;
    state.nekoVelY = 0;
  }
  state.zoneState.definitions = config.zones ?? EMPTY_ZONES;
  state.zoneState.chance = Number.isFinite(config.zoneAttractionChance)
    ? Math.max(0, Math.min(1, config.zoneAttractionChance!))
    : ONEKO_DEFAULTS.zoneAttractionChance;
  state.zoneState.duration = Number.isFinite(config.zoneAttractionDuration)
    ? Math.max(1, Math.min(600, Math.round(config.zoneAttractionDuration! / 100)))
    : ONEKO_DEFAULTS.zoneAttractionDuration / 100;
  state.currentSpeed = config.speed;
  state.scale = config.scale;
  state.opacity = config.opacity;
  state.rotationAmount = config.rotationAmount;
  state.idleThresholdMs = config.idleThreshold;
  state.freerunChanceCfg = config.freerunChance;
  state.freerunDurationCfg = config.freerunDuration;
  state.bubbleEnabledCfg = config.bubbleEnabled;
  state.bubbleDisplayFramesCfg = config.bubbleDisplayFrames;
  state.bubbleCooldownFramesCfg = config.bubbleCooldown;
  state.bubbleChanceCfg = config.bubbleChance;
  state.followDistanceCfg = config.followDistance;
  state.animationSpeedCfg = config.animationSpeed;
  state.customBubbleText = config.bubbleText;
  state.enableMeow = config.meow;
  state.soundVolumeCfg = config.volume;
  state.laserPointerCfg = config.laserPointer;
  if (!config.laserPointer) {
    state.laserCaught = false;
  }
  state.chaseCfg = config.chase === "cat" ? "cat" : "cursor";
  state.napWhileTypingCfg = config.napWhileTyping ?? ONEKO_DEFAULTS.napWhileTyping;
  state.followFocusCfg = config.followFocus ?? ONEKO_DEFAULTS.followFocus;
  state.perchOnHoverCfg = config.perchOnHover ?? ONEKO_DEFAULTS.perchOnHover;
  if (!state.napWhileTypingCfg) state.typingNap = false;
  if (!state.perchOnHoverCfg) state.perchTarget = null;
  const seasonal = config.seasonal ?? ONEKO_DEFAULTS.seasonal;
  state.seasonalCfg = typeof seasonal === "boolean" || isOnekoSeason(seasonal) ? seasonal : true;
  state.grabbableCfg = config.grabbable ?? ONEKO_DEFAULTS.grabbable;
  state.treatsCfg = config.treats ?? ONEKO_DEFAULTS.treats;
  state.timeOfDayCfg = config.timeOfDay ?? ONEKO_DEFAULTS.timeOfDay;
  state.affectionCfg = config.affection ?? ONEKO_DEFAULTS.affection;
  state.handlers = {
    onPet: config.onPet,
    onCatchCursor: config.onCatchCursor,
    onSleep: config.onSleep,
    onToss: config.onToss,
    onTreat: config.onTreat,
  };
  if (!state.grabbableCfg && state.grab?.phase === "held") state.grab = null;
}
