import type { OnekoZone } from "./zones";
import type { ZoneRuntimeState } from "./zone-runtime";
import type { OnekoSkin } from "./skins";

export type CatActivityState =
  | "idle"
  | "moving"
  | "sleeping"
  | "scratchSelf"
  | "tired"
  | "alert"
  | "scratchWallN"
  | "scratchWallS"
  | "scratchWallE"
  | "scratchWallW"
  | "freerun";

export type IdleActivityState = Exclude<CatActivityState, "idle" | "moving" | "freerun">;

export interface CatLiveState {
  state: CatActivityState;
  posX: number;
  posY: number;
  velMag: number;
  idleTime: number;
  distToMouse: number;
  frameCount: number;
  freerunActive: boolean;
  freerunTimer: number;
  bubbleVisible: boolean;
  pathLength: number;
  obstacleCount: number;
}

export interface OnekoProps {
  /** Freeze animation in place without unmounting. Default false. */
  paused?: boolean;
  /** Chase the pointer and visit favorite spots. False keeps the cat resting in place. Default true. */
  followCursor?: boolean;
  /** Allow the cat to nap while idle. Default true. */
  sleepEnabled?: boolean;
  /** Preferred bubble side; auto chooses the side with room. Default auto. */
  bubblePlacement?: "auto" | "above" | "below";
  /** Bubble size multiplier, in addition to scale (0.5–2). Default 1. */
  bubbleScale?: number;
  /** Directory URL for the optional .ogg sounds. Default /cat-sounds. */
  soundBasePath?: string;
  /** localStorage key for position persistence. Default oneko. */
  storageKey?: string;
  /** Strict keep-out areas and occasional favorite spots. DOM data-oneko-zone attributes also work. */
  zones?: readonly OnekoZone[];
  /** Chance to visit a favorite at each five-second check (0–1). Default 0.3. */
  zoneAttractionChance?: number;
  /** Time spent pursuing a favorite, in milliseconds. Default 4000. */
  zoneAttractionDuration?: number;
  /** Built-in pixel-art skin. Default classic. */
  skin?: OnekoSkin;
  /** Custom 256×128 sprite-sheet URL using the classic 8×4 layout. Overrides skin. */
  spriteSrc?: string;
  persistPosition?: boolean;
  zIndex?: number;
  initialPos?: { x: number; y: number };
  speed?: number;
  scale?: number;
  opacity?: number;
  rotationAmount?: number;
  idleThreshold?: number;
  meow?: boolean;
  onStateChange?: (state: CatActivityState) => void;
  /** Probability per frame cat enters freerun mode (0–1). Default 0.06 */
  freerunChance?: number;
  /** Duration of freerun in frames. Default 40 */
  freerunDuration?: number;
  /** Whether chat bubbles are enabled. Default true */
  bubbleEnabled?: boolean;
  /** How many frames a bubble stays visible. Default 180 */
  bubbleDisplayFrames?: number;
  /** Cooldown frames between bubbles. Default 120 */
  bubbleCooldown?: number;
  /** CSS hue-rotate degrees (0–360). Default 0 */
  hueRotate?: number;
  /** Mutable ref that oneko writes live state to every frame */
  liveStateRef?: { current: CatLiveState };
  /** Bubble trigger probability while idle (0–1). Default 0.5 */
  bubbleChance?: number;
  /** Distance in px at which cat stops chasing cursor. Default 20 */
  followDistance?: number;
  /** Multiplier for idle animation speed (0.5–2). Default 1 */
  animationSpeed?: number;
  /** Custom awake bubble text, or a pool of thoughts picked without immediate repeats. */
  bubbleText?: string | readonly string[];
  /** Sound volume (0–1). Default 0.5 */
  volume?: number;
  /** Show a red laser dot in place of the system cursor. Default false */
  laserPointer?: boolean;
}

export interface ObstacleRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface CatRuntimeState {
  zoneState: ZoneRuntimeState;
  nekoPosX: number;
  nekoPosY: number;
  nekoVelX: number;
  nekoVelY: number;
  mousePosX: number;
  mousePosY: number;
  frameCount: number;
  idleTime: number;
  idleAnimation: IdleActivityState | null;
  idleAnimationFrame: number;
  obstacleRects: ObstacleRect[];
  lastObstacleRefresh: number;
  grid: Uint8Array | null;
  gridCols: number;
  gridRows: number;
  currentPath: PathPoint[];
  pathWaypointIdx: number;
  lastPathRecalcFrame: number;
  lastPathTargetCol: number;
  lastPathTargetRow: number;
  debugMode: boolean;
  paused: boolean;
  pausedCfg: boolean;
  followCursorCfg: boolean;
  sleepEnabledCfg: boolean;
  bubblePlacementCfg: NonNullable<OnekoProps["bubblePlacement"]>;
  bubbleScaleCfg: number;
  soundBasePathCfg: string;
  stateLocked: boolean;
  noFollow: boolean;
  currentSpeed: number;
  scale: number;
  opacity: number;
  rotationAmount: number;
  idleThresholdMs: number;
  freerunChanceCfg: number;
  freerunDurationCfg: number;
  bubbleEnabledCfg: boolean;
  bubbleDisplayFramesCfg: number;
  bubbleCooldownFramesCfg: number;
  bubbleChanceCfg: number;
  followDistanceCfg: number;
  animationSpeedCfg: number;
  customBubbleText: string | readonly string[];
  currentRotation: number;
  enableMeow: boolean;
  soundVolumeCfg: number;
  soundCooldown: number;
  bubbleTimer: number;
  bubbleCooldown: number;
  bubbleVisible: boolean;
  lastBubbleMsg: number;
  loopPrevAngle: number | null;
  mouseCircleWinding: number;
  freerunMode: boolean;
  freerunTimer: number;
  lastFreerunMsg: number;
  laserPointerCfg: boolean;
  laserCaught: boolean;
}
