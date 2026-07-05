import {
  ALERT_MESSAGES,
  CIRCLE_LOOP_MESSAGES,
  IDLE_MESSAGES,
  MOUSE_LOOP_WINDING_TRIGGER,
  MOVING_MESSAGES,
  SCRATCHING_MESSAGES,
  SLEEPING_MESSAGES,
  TILE,
  TIRED_MESSAGES,
  WALL_SCRATCH_MESSAGES,
} from "../constants";
import type { CatAnimationDeps } from "./deps";

export function pickFromPool(deps: CatAnimationDeps, pool: string[]) {
  const s = deps.stateRef.current;
  let idx = Math.floor(Math.random() * pool.length);
  if (idx === s.lastBubbleMsg) {
    idx = (idx + 1) % pool.length;
  }
  s.lastBubbleMsg = idx;
  return pool[idx];
}

function messageForIdleAnimation(deps: CatAnimationDeps): string | undefined {
  const s = deps.stateRef.current;

  if (s.idleAnimation === "sleeping") {
    return pickFromPool(deps, SLEEPING_MESSAGES);
  }
  if (s.customBubbleText) {
    return s.customBubbleText;
  }
  if (s.idleAnimation === "tired") {
    return pickFromPool(deps, TIRED_MESSAGES);
  }
  if (s.idleAnimation === "scratchSelf") {
    return pickFromPool(deps, SCRATCHING_MESSAGES);
  }
  if (s.idleAnimation === "alert") {
    return pickFromPool(deps, ALERT_MESSAGES);
  }
  if (s.idleAnimation?.startsWith("scratchWall")) {
    return pickFromPool(deps, WALL_SCRATCH_MESSAGES);
  }

  return undefined;
}

function messageForActivity(deps: CatAnimationDeps): string {
  const s = deps.stateRef.current;
  const idleAnimationMessage = messageForIdleAnimation(deps);
  if (idleAnimationMessage) {
    return idleAnimationMessage;
  }
  if (s.idleTime > 0) {
    return pickFromPool(deps, IDLE_MESSAGES);
  }
  if (Math.abs(s.mouseCircleWinding) >= MOUSE_LOOP_WINDING_TRIGGER) {
    return pickFromPool(deps, CIRCLE_LOOP_MESSAGES);
  }
  return pickFromPool(deps, MOVING_MESSAGES);
}

function pickBubbleMessage(deps: CatAnimationDeps) {
  return messageForActivity(deps);
}

export function showBubble(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  s.bubbleVisible = true;
  s.bubbleTimer = s.bubbleDisplayFramesCfg;
  deps.bubbleTextEl.textContent = pickBubbleMessage(deps);
  deps.bubbleEl.style.opacity = "1";
}

export function hideBubble(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  s.bubbleVisible = false;
  deps.bubbleEl.style.opacity = "0";
  s.bubbleCooldown = s.bubbleCooldownFramesCfg;
}

function applyBubblePlacement(deps: CatAnimationDeps, showBelow: boolean) {
  deps.bubbleEl.style.transformOrigin = showBelow ? "bottom center" : "top center";
  deps.bubbleEl.style.flexDirection = showBelow ? "column-reverse" : "column";
  deps.bubbleTail.style.cssText = showBelow
    ? "transform:scaleY(-1);margin-top:0;margin-bottom:-2px;"
    : "transform:none;margin-top:-2px;margin-bottom:0;";
}

function positionBubble(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  const catX = Math.floor(s.nekoPosX);
  const catY = Math.floor(s.nekoPosY);
  const vw = window.innerWidth;
  const bubbleW = deps.bubbleEl.offsetWidth || deps.bubbleTextEl.offsetWidth || 100;
  const margin = 6;
  const halfCat = (TILE * s.scale) / 2;

  const aboveY = Math.floor(catY - halfCat - 42);
  const belowY = Math.floor(catY + halfCat + 8);
  const showBelow = aboveY < margin;
  deps.bubbleEl.style.top = `${Math.round(showBelow ? belowY : aboveY)}px`;
  deps.bubbleEl.style.transform = `translateX(-50%) scale(${s.scale})`;
  applyBubblePlacement(deps, showBelow);

  const halfBubble = (bubbleW * s.scale) / 2;
  let left = catX;
  if (catX - halfBubble < margin) {
    left = margin + halfBubble;
  } else if (catX + halfBubble > vw - margin) {
    left = vw - margin - halfBubble;
  }
  deps.bubbleEl.style.left = `${Math.round(left)}px`;
}

function tickVisibleBubble(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  s.bubbleTimer -= 1;
  if (s.bubbleTimer <= 0) {
    hideBubble(deps);
  }
}

function tickBubbleCooldown(deps: CatAnimationDeps) {
  deps.stateRef.current.bubbleCooldown -= 1;
}

function shouldTriggerBubble(deps: CatAnimationDeps): boolean {
  const s = deps.stateRef.current;
  const idleFrameThreshold = Math.max(1, Math.round(s.idleThresholdMs / 100));
  const idleRate = s.bubbleChanceCfg * 0.16;
  const moveRate = s.bubbleChanceCfg * 0.01;
  const loopW = Math.abs(s.mouseCircleWinding);
  const loopComplaining = s.idleTime === 0 && loopW >= MOUSE_LOOP_WINDING_TRIGGER;
  const moveRateBoost = loopComplaining ? 4.2 : 1;

  if (s.idleTime > idleFrameThreshold && Math.random() < idleRate) {
    return true;
  }
  return s.idleTime === 0 && Math.random() < moveRate * moveRateBoost;
}

export function updateBubble(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  if (!s.bubbleEnabledCfg) {
    if (s.bubbleVisible) {
      hideBubble(deps);
    }
    return;
  }

  positionBubble(deps);

  if (s.bubbleVisible) {
    tickVisibleBubble(deps);
    return;
  }

  if (s.bubbleCooldown > 0) {
    tickBubbleCooldown(deps);
    return;
  }

  if (shouldTriggerBubble(deps)) {
    showBubble(deps);
  }
}
