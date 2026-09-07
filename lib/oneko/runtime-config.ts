import { EMPTY_ZONES } from "./zone-runtime";
import type { OnekoZone } from "./zones";
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
>;

export function defaultRuntimeConfigState(): RuntimeConfigStateFields {
  return {
    pausedCfg: false,
    followCursorCfg: true,
    sleepEnabledCfg: true,
    bubblePlacementCfg: "auto",
    bubbleScaleCfg: 1,
    soundBasePathCfg: "/cat-sounds",
    currentSpeed: 0,
    scale: 1,
    opacity: 1,
    rotationAmount: 0,
    idleThresholdMs: 0,
    freerunChanceCfg: 0,
    freerunDurationCfg: 0,
    bubbleEnabledCfg: true,
    bubbleDisplayFramesCfg: 0,
    bubbleCooldownFramesCfg: 0,
    bubbleChanceCfg: 0,
    followDistanceCfg: 0,
    animationSpeedCfg: 1,
    customBubbleText: "",
    currentRotation: 0,
    enableMeow: true,
    soundVolumeCfg: 0,
    soundCooldown: 0,
    bubbleTimer: 0,
    bubbleCooldown: 0,
    bubbleVisible: false,
    lastBubbleMsg: -1,
    laserPointerCfg: false,
    laserCaught: false,
  };
}

export type CatRuntimeConfig = Pick<
  OnekoProps,
  "paused" | "followCursor" | "sleepEnabled" | "bubblePlacement" | "bubbleScale" | "soundBasePath"
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
  state.pausedCfg = config.paused ?? false;
  state.followCursorCfg = config.followCursor ?? true;
  state.sleepEnabledCfg = config.sleepEnabled ?? true;
  state.bubblePlacementCfg =
    config.bubblePlacement === "above" || config.bubblePlacement === "below"
      ? config.bubblePlacement
      : "auto";
  state.bubbleScaleCfg = Number.isFinite(config.bubbleScale)
    ? Math.max(0.5, Math.min(2, config.bubbleScale!))
    : 1;
  state.soundBasePathCfg = (config.soundBasePath ?? "/cat-sounds").replace(/\/+$/, "");
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
    : 0.3;
  state.zoneState.duration = Number.isFinite(config.zoneAttractionDuration)
    ? Math.max(1, Math.min(600, Math.round(config.zoneAttractionDuration! / 100)))
    : 40;
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
}
