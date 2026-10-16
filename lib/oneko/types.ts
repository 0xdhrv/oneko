import type { OnekoZone } from "./zones";
import type { ZoneRuntimeState } from "./zone-runtime";
import type { OnekoSkin } from "./skins";
import type { OnekoSeason } from "./seasons";
import type { Errand, GrabState, Mood } from "./animation/play-types";

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
  /** Enable optional sound assets supplied by the host app. Default false. */
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
  /** With reduced motion: "hide" the cat, or let it "rest" as a still, sleeping sprite. Default "hide" */
  reducedMotion?: "hide" | "rest";
  /** What to chase: the cursor, or the cat mounted just before this one. Default "cursor" */
  chase?: "cursor" | "cat";
  /** Doze off while the visitor types in a field; wake on the next pointer move. Default false */
  napWhileTyping?: boolean;
  /** Walk over to whatever receives keyboard focus. Default false */
  followFocus?: boolean;
  /** Sit on a link or button after the pointer rests on it. Default false */
  perchOnHover?: boolean;
  /** Make the cat a keyboard-reachable "Pet the cat" button. Default false */
  pettable?: boolean;
  /** Wear a holiday hat around Halloween, the winter holidays, and New Year. A season name forces it. Default true */
  seasonal?: boolean | OnekoSeason;
  /** Let visitors pick the cat up and toss it; a click without dragging pets it. Default false */
  grabbable?: boolean;
  /** Double-click empty page space to drop a treat the cat runs over to eat. Default false */
  treats?: boolean;
  /** Follow the visitor's clock: zoomies at dawn and dusk, sleepy late at night. Default false */
  timeOfDay?: boolean;
  /** Remember pets and treats in localStorage and greet returning visitors. Default false */
  affection?: boolean;
  /** Called when the cat is petted by keyboard, click, or pet(). */
  onPet?: (detail: { affection: number }) => void;
  /** Called when the cat catches up with the cursor after a chase. */
  onCatchCursor?: () => void;
  /** Called when the cat falls asleep. */
  onSleep?: () => void;
  /** Called when a visitor throws the cat; speed is in CSS pixels per second. */
  onToss?: (detail: { speed: number }) => void;
  /** Called when the cat eats a treat. */
  onTreat?: (detail: { affection: number }) => void;
}

/** Event callbacks, kept in the runtime state so they update without a restart. */
export type OnekoEventHandlers = Pick<
  OnekoProps,
  "onPet" | "onCatchCursor" | "onSleep" | "onToss" | "onTreat"
>;

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
  chaseCfg: NonNullable<OnekoProps["chase"]>;
  napWhileTypingCfg: boolean;
  followFocusCfg: boolean;
  perchOnHoverCfg: boolean;
  /** Dozing because the visitor is typing; cleared by pointer movement. */
  typingNap: boolean;
  /** Holding still while keyboard focus is on the cat. */
  held: boolean;
  /** Top of the hovered element the cat walks to and sits on. */
  perchTarget: PathPoint | null;
  /** Position of the cat this one chases, when chase is "cat" and one exists. */
  leaderTarget: PathPoint | null;
  seasonalCfg: boolean | OnekoSeason;
  grabbableCfg: boolean;
  treatsCfg: boolean;
  timeOfDayCfg: boolean;
  affectionCfg: boolean;
  handlers: OnekoEventHandlers;
  /** Season currently worn, re-read from the calendar now and then. */
  season: OnekoSeason | null;
  /** Being carried, flying after a toss, or catching its breath after landing. */
  grab: GrabState | null;
  /** Something the cat set out to do: eat a treat, sit in a box, knock something over, or an API request. */
  errand: Errand | null;
  /** Frames until the cat looks for another box or knockable. */
  errandCooldown: number;
  /** Text queued by say() or data-oneko-say, shown on the next tick. */
  sayRequest: { text: string; frames: number } | null;
  /** The bubble was requested explicitly and stays up even when automatic bubbles are off. */
  bubbleForced: boolean;
  petRequest: boolean;
  /** Chasing a cursor that was far away; reaching it counts as a catch. */
  chasingFar: boolean;
  mood: Mood;
  moodCheckedFrame: number;
  affection: number;
  affectionLoaded: boolean;
  /** localStorage key for affection, derived from storageKey. */
  affectionKey: string;
  zIndex: number;
}
