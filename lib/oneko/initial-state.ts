import { createZoneState } from "./zone-runtime";
import {
  DEFAULT_POSITION,
  DEFAULT_Z_INDEX,
  OBSTACLE_INTERVAL,
  PATH_RECALC_INTERVAL,
} from "./constants";
import {
  applyRuntimeConfig,
  defaultRuntimeConfigState,
  type CatRuntimeConfig,
} from "./runtime-config";
import type { CatRuntimeState, IdleActivityState } from "./types";

type PlayStateFields = Pick<
  CatRuntimeState,
  | "season"
  | "grab"
  | "errand"
  | "errandCooldown"
  | "sayRequest"
  | "bubbleForced"
  | "petRequest"
  | "chasingFar"
  | "mood"
  | "moodCheckedFrame"
  | "affection"
  | "affectionLoaded"
  | "affectionKey"
  | "zIndex"
>;

/** Fresh state for treats, tosses, errands, seasons, and the API. */
export function defaultPlayState(): PlayStateFields {
  return {
    season: null,
    grab: null,
    errand: null,
    errandCooldown: 50,
    sayRequest: null,
    bubbleForced: false,
    petRequest: false,
    chasingFar: false,
    mood: { speed: 1, freerun: 1, idle: 1 },
    moodCheckedFrame: -Infinity,
    affection: 0,
    affectionLoaded: false,
    affectionKey: "oneko:affection",
    zIndex: DEFAULT_Z_INDEX,
  };
}

export type InitialCatStateOptions = CatRuntimeConfig & {
  initialPos?: { x: number; y: number };
};

export function createInitialCatState(options: InitialCatStateOptions): CatRuntimeState {
  const startX = options.initialPos?.x ?? DEFAULT_POSITION.x;
  const startY = options.initialPos?.y ?? DEFAULT_POSITION.y;

  const state: CatRuntimeState = {
    zoneState: createZoneState(),
    nekoPosX: startX,
    nekoPosY: startY,
    nekoVelX: 0,
    nekoVelY: 0,
    mousePosX: startX,
    mousePosY: startY,
    frameCount: 0,
    idleTime: 0,
    idleAnimation: null as IdleActivityState | null,
    idleAnimationFrame: 0,
    obstacleRects: [],
    lastObstacleRefresh: -OBSTACLE_INTERVAL,
    grid: null,
    gridCols: 0,
    gridRows: 0,
    currentPath: [],
    pathWaypointIdx: 0,
    lastPathRecalcFrame: -PATH_RECALC_INTERVAL,
    lastPathTargetCol: -1,
    lastPathTargetRow: -1,
    debugMode: false,
    paused: false,
    stateLocked: false,
    noFollow: false,
    ...defaultRuntimeConfigState(),
    loopPrevAngle: null,
    mouseCircleWinding: 0,
    freerunMode: false,
    freerunTimer: 0,
    lastFreerunMsg: -1,
    typingNap: false,
    held: false,
    perchTarget: null,
    leaderTarget: null,
    ...defaultPlayState(),
  };

  applyRuntimeConfig(state, options);
  return state;
}
