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

export function pickFromPool(deps: CatAnimationDeps, pool: readonly string[]) {
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
  if (typeof s.customBubbleText === "string") {
    if (s.customBubbleText.trim()) return s.customBubbleText;
  } else {
    const thoughts = [...new Set(s.customBubbleText.filter((text) => text.trim()))];
    if (thoughts.length) return pickFromPool(deps, thoughts);
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
  deps.bubbleEl.style.transformOrigin = "top center";
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
  const vh = window.innerHeight;
  const bubbleW = deps.bubbleEl.offsetWidth || deps.bubbleTextEl.offsetWidth || 100;
  const bubbleH = deps.bubbleEl.offsetHeight || 34;
  const bubbleScale = s.scale * s.bubbleScaleCfg;
  const margin = 6;
  const halfCat = (TILE * s.scale) / 2;

  const aboveY = Math.floor(catY - halfCat - 8 - bubbleH * bubbleScale);
  const belowY = Math.floor(catY + halfCat + 8);
  const showBelow =
    s.bubblePlacementCfg === "below" ||
    (s.bubblePlacementCfg === "auto" && aboveY < margin && catY < vh / 2);
  const top = Math.max(
    margin,
    Math.min(vh - margin - bubbleH * bubbleScale, showBelow ? belowY : aboveY),
  );
  deps.bubbleEl.style.top = `${Math.round(top)}px`;
  deps.bubbleEl.style.transform = `translateX(-50%) scale(${bubbleScale})`;
  applyBubblePlacement(deps, showBelow);

  const halfBubble = (bubbleW * bubbleScale) / 2;
  let left = catX;
  if (halfBubble * 2 > vw - margin * 2) {
    left = vw / 2;
  } else if (catX - halfBubble < margin) {
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
