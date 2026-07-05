import type { CatRuntimeState } from "./types";

type RuntimeConfigStateFields = Pick<
  CatRuntimeState,
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

export type CatRuntimeConfig = {
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
  bubbleText: string;
  meow: boolean;
  volume: number;
  laserPointer: boolean;
};

export function applyRuntimeConfig(state: CatRuntimeState, config: CatRuntimeConfig): void {
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
