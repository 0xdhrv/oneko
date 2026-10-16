"use client";

/**
 * Installable React component — the classic “cat follows the cursor” idea comes from
 * oneko.js (MIT): https://github.com/adryd325/oneko.js/
 */

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type Ref,
} from "react";
import { LaserCursor } from "@/components/laser-cursor";
import { useCatAnimation } from "@/hooks/use-cat-animation";
import { useOnekoPropsSync } from "@/hooks/use-oneko-props-sync";
import { useSkinSource } from "@/hooks/use-skin-source";
import { ONEKO_DEFAULTS } from "@/lib/oneko/defaults";
import { useMotionAllowed, useReducedMotion } from "@/hooks/use-motion-allowed";
import { TILE } from "@/lib/oneko/constants";
import { createCatControls, type OnekoControls } from "@/lib/oneko/controls";
import { createInitialCatState } from "@/lib/oneko/initial-state";
import { areCatsHidden, onCatsHiddenChange, setCatsHidden } from "@/lib/oneko/pack";
import { readPersistedPosition } from "@/lib/oneko/persistence";
import type { CatActivityState, CatLiveState, OnekoProps } from "@/lib/oneko/types";

export type { CatActivityState, CatLiveState, OnekoControls, OnekoProps };
export type { OnekoSeason } from "@/lib/oneko/seasons";
export type { OnekoSkin } from "@/lib/oneko/skins";
export type { OnekoZone } from "@/lib/oneko/zones";
export { setCatsHidden };

/** The visitor's remembered choice to hide every cat on the site. Pair with setCatsHidden. */
export function useCatsHidden(): boolean {
  return useSyncExternalStore(onCatsHiddenChange, areCatsHidden, () => false);
}

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
  reducedMotion = ONEKO_DEFAULTS.reducedMotion,
  chase = ONEKO_DEFAULTS.chase,
  napWhileTyping = ONEKO_DEFAULTS.napWhileTyping,
  followFocus = ONEKO_DEFAULTS.followFocus,
  perchOnHover = ONEKO_DEFAULTS.perchOnHover,
  pettable = ONEKO_DEFAULTS.pettable,
  seasonal = ONEKO_DEFAULTS.seasonal,
  grabbable = ONEKO_DEFAULTS.grabbable,
  treats = ONEKO_DEFAULTS.treats,
  timeOfDay = ONEKO_DEFAULTS.timeOfDay,
  affection = ONEKO_DEFAULTS.affection,
  onPet,
  onCatchCursor,
  onSleep,
  onToss,
  onTreat,
  ref,
}: OnekoProps & {
  /** Imperative controls: goTo, say, sit, follow, pet, and dropTreat. */
  ref?: Ref<OnekoControls>;
}) {
  const hidden = useCatsHidden();
  const motionAllowed = useMotionAllowed() && !hidden;
  const prefersReducedMotion = useReducedMotion();
  const restingSource = useSkinSource(skin, spriteSrc);
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
    chase,
    napWhileTyping,
    followFocus,
    perchOnHover,
    seasonal,
    grabbable,
    treats,
    timeOfDay,
    affection,
    onPet,
    onCatchCursor,
    onSleep,
    onToss,
    onTreat,
  };

  const [initialState] = useState(() => createInitialCatState({ initialPos, ...config }));
  const stateRef = useRef(initialState);
  useImperativeHandle(ref, () => createCatControls(stateRef), []);

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
    pettable,
  });
  useOnekoPropsSync(stateRef, elRef, {
    ...config,
    hueRotate,
    skin,
    spriteSrc,
  });

  if (!hidden && prefersReducedMotion && reducedMotion === "rest" && restingSource) {
    return (
      <RestingCat
        source={restingSource}
        position={(persistPosition && readPersistedPosition(storageKey)) || initialPos}
        scale={scale}
        opacity={opacity}
        hueRotate={hueRotate}
        zIndex={zIndex}
      />
    );
  }

  return motionAllowed && config.laserPointer ? <LaserCursor zIndex={zIndex} /> : null;
}

/** Still, sleeping cat for visitors who prefer reduced motion. */
function RestingCat({
  source,
  position,
  scale,
  opacity,
  hueRotate,
  zIndex,
}: {
  source: string;
  position?: { x: number; y: number };
  scale: number;
  opacity: number;
  hueRotate: number;
  zIndex: number;
}) {
  const inset = (TILE * scale) / 2 + 16;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: position ? position.x - TILE / 2 : undefined,
        top: position ? position.y - TILE / 2 : undefined,
        right: position ? undefined : inset - TILE / 2,
        bottom: position ? undefined : inset - TILE / 2,
        width: TILE,
        height: TILE,
        pointerEvents: "none",
        imageRendering: "pixelated",
        backgroundImage: `url(${JSON.stringify(source)})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "256px 128px",
        // Sleeping frame, matching defaultSpriteSets.sleeping[0].
        backgroundPosition: `-${2 * TILE}px 0`,
        transform: `scale(${scale})`,
        opacity,
        filter: hueRotate ? `hue-rotate(${hueRotate}deg)` : undefined,
        zIndex,
      }}
    />
  );
}
