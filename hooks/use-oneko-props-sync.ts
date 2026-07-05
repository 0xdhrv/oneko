import { useEffect } from "react";
import { applyRuntimeConfig, type CatRuntimeConfig } from "@/lib/oneko/runtime-config";
import type { CatRuntimeState } from "@/lib/oneko/types";

type SyncableProps = CatRuntimeConfig & {
  hueRotate: number;
};

export function useOnekoPropsSync(
  stateRef: { current: CatRuntimeState },
  elRef: { current: HTMLDivElement | null },
  props: SyncableProps,
) {
  const {
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
  } = props;

  useEffect(() => {
    const s = stateRef.current;
    if (elRef.current) {
      const er = elRef.current;
      er.style.transform = `scale(${scale}) rotate(${s.currentRotation}deg)`;
      er.style.opacity = String(opacity);
      er.style.filter = hueRotate ? `hue-rotate(${hueRotate}deg)` : "";
    }
    applyRuntimeConfig(s, {
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
    });
  }, [
    stateRef,
    elRef,
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
  ]);
}
