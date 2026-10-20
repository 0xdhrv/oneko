"use client";

import { useEffect } from "react";
import { startCatAnimation, type StartCatAnimationOptions } from "@/lib/oneko/start-cat-animation";

export function useCatAnimation({
  enabled,
  stateRef,
  elRef,
  lastStateRef,
  onStateChangeRef,
  liveStateRef,
  persistPosition,
  storageKey,
  zIndex,
  pettable,
}: StartCatAnimationOptions & { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    return startCatAnimation({
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
  }, [
    enabled,
    stateRef,
    elRef,
    lastStateRef,
    onStateChangeRef,
    persistPosition,
    storageKey,
    zIndex,
    pettable,
    liveStateRef,
  ]);
}
