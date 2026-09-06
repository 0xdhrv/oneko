import { constrainZoneMovement } from "../zones";
import {
  CELL_SIZE,
  FREERUN_MESSAGES,
  MAX_VEL_FACTOR,
  STEER_LERP,
  TILE,
  WAYPOINT_REACH_DIST,
} from "../constants";
import { findRoute, nearestWalkable, worldToCell } from "../pathfinding";
import type { CatAnimationDeps } from "./deps";
import { maybeStartIdleAnimation } from "./idle";
import { clearRotation, directionFromDelta, setSprite } from "./sprites";

export function recalculatePath(deps: CatAnimationDeps): void {
  const s = deps.stateRef.current;
  const { grid, gridCols: cols, gridRows: rows } = s;
  if (!grid || cols === 0 || rows === 0) {
    s.currentPath = [];
    return;
  }

  const catCell = nearestWalkable(
    worldToCell(s.nekoPosX, s.nekoPosY, cols, rows),
    grid,
    cols,
    rows,
  );
  const mouseCell = nearestWalkable(
    worldToCell(s.zoneState.movementTarget.x, s.zoneState.movementTarget.y, cols, rows),
    grid,
    cols,
    rows,
  );

  s.currentPath = findRoute(catCell, mouseCell, grid, cols, rows);
  s.pathWaypointIdx = 0;
  s.lastPathRecalcFrame = s.frameCount;
  s.lastPathTargetCol = Math.floor(s.zoneState.movementTarget.x / CELL_SIZE);
  s.lastPathTargetRow = Math.floor(s.zoneState.movementTarget.y / CELL_SIZE);
}

function getNextWaypointTarget(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  const { currentPath: path } = s;
  if (path.length === 0) {
    return { x: s.zoneState.movementTarget.x, y: s.zoneState.movementTarget.y };
  }
  while (s.pathWaypointIdx < path.length - 1) {
    const wp = path[s.pathWaypointIdx];
    if (Math.hypot(wp.x - s.nekoPosX, wp.y - s.nekoPosY) < WAYPOINT_REACH_DIST) {
      s.pathWaypointIdx++;
    } else {
      break;
    }
  }
  return path[s.pathWaypointIdx];
}

function moveToward(deps: CatAnimationDeps, targetX: number, targetY: number) {
  const s = deps.stateRef.current;
  const dx = targetX - s.nekoPosX;
  const dy = targetY - s.nekoPosY;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) {
    s.nekoVelX *= 0.5;
    s.nekoVelY *= 0.5;
    return;
  }
  const currentSpeed = s.currentSpeed;
  s.nekoVelX += ((dx / dist) * currentSpeed - s.nekoVelX) * STEER_LERP;
  s.nekoVelY += ((dy / dist) * currentSpeed - s.nekoVelY) * STEER_LERP;
  const velMag = Math.hypot(s.nekoVelX, s.nekoVelY);
  const maxVel = currentSpeed * MAX_VEL_FACTOR;
  const clampedMag = Math.min(velMag, maxVel);
  if (velMag > maxVel) {
    s.nekoVelX = (s.nekoVelX / velMag) * maxVel;
    s.nekoVelY = (s.nekoVelY / velMag) * maxVel;
  }
  const from = { x: s.nekoPosX, y: s.nekoPosY };
  const proposed = {
    x: Math.max(16, Math.min(window.innerWidth - 16, s.nekoPosX + s.nekoVelX)),
    y: Math.max(16, Math.min(window.innerHeight - 16, s.nekoPosY + s.nekoVelY)),
  };
  const safe = constrainZoneMovement(from, proposed, s.zoneState.blocked);
  if (safe.x !== proposed.x || safe.y !== proposed.y) {
    s.nekoVelX = 0;
    s.nekoVelY = 0;
  }
  if (safe.x === from.x && safe.y === from.y && (safe.x !== proposed.x || safe.y !== proposed.y)) {
    restNearCursor(deps);
    return;
  }
  s.nekoPosX = safe.x;
  s.nekoPosY = safe.y;
  s.nekoPosX = Math.max(16, Math.min(window.innerWidth - 16, s.nekoPosX));
  s.nekoPosY = Math.max(16, Math.min(window.innerHeight - 16, s.nekoPosY));
  deps.el.style.left = `${Math.floor(s.nekoPosX - TILE / 2)}px`;
  deps.el.style.top = `${Math.floor(s.nekoPosY - TILE / 2)}px`;
  const dir = directionFromDelta(s.nekoVelX, s.nekoVelY) ?? "idle";
  setSprite(deps, dir, s.frameCount);
  if (clampedMag > 0.5 && s.rotationAmount > 0) {
    const velAngle = Math.atan2(s.nekoVelY, s.nekoVelX) * (180 / Math.PI);
    s.currentRotation = (velAngle / 180) * s.rotationAmount;
  } else {
    s.currentRotation = 0;
  }
  deps.el.style.transform = `scale(${s.scale}) rotate(${s.currentRotation}deg)`;
  s.idleTime = 0;
}

function pickFreerunMessage(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  let idx = Math.floor(Math.random() * FREERUN_MESSAGES.length);
  if (idx === s.lastFreerunMsg) {
    idx = (idx + 1) % FREERUN_MESSAGES.length;
  }
  s.lastFreerunMsg = idx;
  return FREERUN_MESSAGES[idx];
}

function enterFreerun(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  s.freerunMode = true;
  s.freerunTimer = s.freerunDurationCfg;
  s.bubbleVisible = true;
  s.bubbleTimer = s.freerunDurationCfg;
  s.bubbleCooldown = 0;
  deps.bubbleTextEl.textContent = pickFreerunMessage(deps);
  deps.bubbleEl.style.opacity = "1";
}

function tickFreerun(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  s.freerunTimer -= 1;
  if (s.freerunTimer <= 0) {
    const keepAlive = s.stateLocked;
    s.freerunMode = keepAlive;
    if (keepAlive) {
      s.freerunTimer = s.freerunDurationCfg;
    }
  }
  moveToward(deps, s.zoneState.movementTarget.x, s.zoneState.movementTarget.y);
}

function restNearCursor(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  setSprite(deps, "idle", s.frameCount);
  clearRotation(deps);
  s.nekoVelX *= 0.5;
  s.nekoVelY *= 0.5;
  s.idleTime += 1;
  if (!(s.stateLocked || s.noFollow)) {
    s.freerunMode = false;
  }
  maybeStartIdleAnimation(deps);
}

function chaseCursor(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  if (s.freerunMode) {
    tickFreerun(deps);
    return;
  }
  if (!s.noFollow && Math.random() < s.freerunChanceCfg) {
    enterFreerun(deps);
    moveToward(deps, s.zoneState.movementTarget.x, s.zoneState.movementTarget.y);
    return;
  }
  const target = getNextWaypointTarget(deps);
  moveToward(deps, target.x, target.y);
}

export function followPath(deps: CatAnimationDeps, overallDist: number) {
  const s = deps.stateRef.current;
  const lastWaypoint = s.currentPath.at(-1);
  const reachedPathEnd =
    !s.freerunMode &&
    lastWaypoint &&
    s.pathWaypointIdx === s.currentPath.length - 1 &&
    Math.hypot(lastWaypoint.x - s.nekoPosX, lastWaypoint.y - s.nekoPosY) < s.followDistanceCfg;
  if (overallDist < s.followDistanceCfg || reachedPathEnd) {
    restNearCursor(deps);
    return;
  }
  chaseCursor(deps);
}
