"use client";

/**
 * Playground implementation — the classic “cat follows the cursor” idea comes from
 * oneko.js (MIT): https://github.com/adryd325/oneko.js/
 */

import { useEffect, useRef } from "react";
import { LaserCursor } from "@/components/laser-cursor";
import { useCatAnimation } from "@/hooks/use-cat-animation";
import { useOnekoPropsSync } from "@/hooks/use-oneko-props-sync";
import {
  BUBBLE_COOLDOWN_FRAMES,
  BUBBLE_DISPLAY_FRAMES,
  DEFAULT_ANIMATION_SPEED,
  DEFAULT_BUBBLE_CHANCE,
  DEFAULT_FOLLOW_DISTANCE,
  DEFAULT_IDLE_THRESHOLD_MS,
  DEFAULT_OPACITY,
  DEFAULT_ROTATION_AMOUNT,
  DEFAULT_SCALE,
  DEFAULT_SPEED,
  DEFAULT_VOLUME,
  DEFAULT_Z_INDEX,
  FREERUN_CHANCE,
  FREERUN_DURATION,
} from "@/lib/oneko/constants";
import { createInitialCatState } from "@/lib/oneko/initial-state";
import type { CatActivityState, CatLiveState, OnekoProps } from "@/lib/oneko/types";

export type { CatLiveState, OnekoProps };

export default function Oneko({
  persistPosition = true,
  /** One below max so fixed UI can sit above the cat. */
  zIndex = DEFAULT_Z_INDEX,
  initialPos,
  speed = DEFAULT_SPEED,
  scale = DEFAULT_SCALE,
  opacity = DEFAULT_OPACITY,
  rotationAmount = DEFAULT_ROTATION_AMOUNT,
  idleThreshold = DEFAULT_IDLE_THRESHOLD_MS,
  meow = true,
  onStateChange,
  freerunChance = FREERUN_CHANCE,
  freerunDuration = FREERUN_DURATION,
  bubbleEnabled = true,
  bubbleDisplayFrames = BUBBLE_DISPLAY_FRAMES,
  bubbleCooldown = BUBBLE_COOLDOWN_FRAMES,
  hueRotate = 0,
  liveStateRef,
  bubbleChance = DEFAULT_BUBBLE_CHANCE,
  followDistance = DEFAULT_FOLLOW_DISTANCE,
  animationSpeed = DEFAULT_ANIMATION_SPEED,
  bubbleText = "",
  volume = DEFAULT_VOLUME,
  laserPointer = false,
}: OnekoProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const lastStateRef = useRef<CatActivityState>("idle");
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const stateRef = useRef(
    createInitialCatState({
      initialPos,
      speed,
      scale,
      opacity,
      rotationAmount,
      idleThreshold,
      freerunChance,
      freerunDuration,
      bubbleEnabled,
      bubbleDisplayFrames,
      bubbleCooldown,
      bubbleChance,
      followDistance,
      animationSpeed,
      bubbleText,
      meow,
      volume,
      laserPointer,
    }),
  );

  useCatAnimation({
    stateRef,
    elRef,
    lastStateRef,
    onStateChangeRef,
    liveStateRef,
    persistPosition,
    zIndex,
  });
  useOnekoPropsSync(stateRef, elRef, {
    speed,
    scale,
    opacity,
    rotationAmount,
    idleThreshold,
    hueRotate,
    freerunChance,
    freerunDuration,
    bubbleEnabled,
    bubbleDisplayFrames,
    bubbleCooldown,
    bubbleChance,
    followDistance,
    animationSpeed,
    bubbleText,
    meow,
    volume,
    laserPointer,
  });

  return laserPointer ? <LaserCursor zIndex={zIndex} /> : null;
}
