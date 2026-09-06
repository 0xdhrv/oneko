import { createZoneState } from "./zone-runtime";
import { DEFAULT_POSITION, OBSTACLE_INTERVAL, PATH_RECALC_INTERVAL } from "./constants";
import {
  applyRuntimeConfig,
  defaultRuntimeConfigState,
  type CatRuntimeConfig,
} from "./runtime-config";
import type { CatRuntimeState, IdleActivityState } from "./types";

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
  };

  applyRuntimeConfig(state, options);
  return state;
}
