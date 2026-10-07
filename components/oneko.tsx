"use client";

/**
 * Installable React component — the classic “cat follows the cursor” idea comes from
 * oneko.js (MIT): https://github.com/adryd325/oneko.js/
 */

import { useEffect, useRef, useState } from "react";
import { LaserCursor } from "@/components/laser-cursor";
import { useCatAnimation } from "@/hooks/use-cat-animation";
import { useOnekoPropsSync } from "@/hooks/use-oneko-props-sync";
import { ONEKO_DEFAULTS } from "@/lib/oneko/defaults";
import { useMotionAllowed } from "@/hooks/use-motion-allowed";
import { createInitialCatState } from "@/lib/oneko/initial-state";
import type { CatActivityState, CatLiveState, OnekoProps } from "@/lib/oneko/types";

export type { CatActivityState, CatLiveState, OnekoProps };
export type { OnekoSkin } from "@/lib/oneko/skins";
export type { OnekoZone } from "@/lib/oneko/zones";

export default function Oneko({
  paused = ONEKO_DEFAULTS.paused,
  followCursor = ONEKO_DEFAULTS.followCursor,
  sleepEnabled = ONEKO_DEFAULTS.sleepEnabled,
  bubblePlacement = ONEKO_DEFAULTS.bubblePlacement,
  bubbleScale = ONEKO_DEFAULTS.bubbleScale,
  soundBasePath = ONEKO_DEFAULTS.soundBasePath,
  storageKey = ONEKO_DEFAULTS.storageKey,
  zones,
  zoneAttractionChance = ONEKO_DEFAULTS.zoneAttractionChance,
  zoneAttractionDuration = ONEKO_DEFAULTS.zoneAttractionDuration,
  skin = ONEKO_DEFAULTS.skin,
  spriteSrc,
  persistPosition = ONEKO_DEFAULTS.persistPosition,
  /** One below max so fixed UI can sit above the cat. */
  zIndex = ONEKO_DEFAULTS.zIndex,
  initialPos,
  speed = ONEKO_DEFAULTS.speed,
  scale = ONEKO_DEFAULTS.scale,
  opacity = ONEKO_DEFAULTS.opacity,
  rotationAmount = ONEKO_DEFAULTS.rotationAmount,
  idleThreshold = ONEKO_DEFAULTS.idleThreshold,
  meow = ONEKO_DEFAULTS.meow,
  onStateChange,
  freerunChance = ONEKO_DEFAULTS.freerunChance,
  freerunDuration = ONEKO_DEFAULTS.freerunDuration,
  bubbleEnabled = ONEKO_DEFAULTS.bubbleEnabled,
  bubbleDisplayFrames = ONEKO_DEFAULTS.bubbleDisplayFrames,
  bubbleCooldown = ONEKO_DEFAULTS.bubbleCooldown,
  hueRotate = ONEKO_DEFAULTS.hueRotate,
  liveStateRef,
  bubbleChance = ONEKO_DEFAULTS.bubbleChance,
  followDistance = ONEKO_DEFAULTS.followDistance,
  animationSpeed = ONEKO_DEFAULTS.animationSpeed,
  bubbleText = ONEKO_DEFAULTS.bubbleText,
  volume = ONEKO_DEFAULTS.volume,
  laserPointer = ONEKO_DEFAULTS.laserPointer,
}: OnekoProps) {
  const motionAllowed = useMotionAllowed();
  const elRef = useRef<HTMLDivElement | null>(null);
  const lastStateRef = useRef<CatActivityState>("idle");
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const config = {
    paused,
    followCursor,
    sleepEnabled,
    bubblePlacement,
    bubbleScale,
    soundBasePath,
    zones,
    zoneAttractionChance,
    zoneAttractionDuration,
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
    laserPointer: laserPointer && followCursor && !paused,
  };

  const [initialState] = useState(() => createInitialCatState({ initialPos, ...config }));
  const stateRef = useRef(initialState);

  useCatAnimation({
    enabled: motionAllowed,
    stateRef,
    elRef,
    lastStateRef,
    onStateChangeRef,
    liveStateRef,
    persistPosition,
    storageKey,
    zIndex,
  });
  useOnekoPropsSync(stateRef, elRef, {
    ...config,
    hueRotate,
    skin,
    spriteSrc,
  });

  return motionAllowed && config.laserPointer ? <LaserCursor zIndex={zIndex} /> : null;
}
