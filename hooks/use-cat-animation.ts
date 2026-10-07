"use client";

import { useEffect } from "react";
import { startCatAnimation } from "@/lib/oneko/start-cat-animation";
import type { CatActivityState, CatLiveState, CatRuntimeState } from "@/lib/oneko/types";

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
}: {
  enabled: boolean;
  stateRef: { current: CatRuntimeState };
  elRef: { current: HTMLDivElement | null };
  lastStateRef: { current: CatActivityState };
  onStateChangeRef: { current: ((state: CatActivityState) => void) | undefined };
  liveStateRef?: { current: CatLiveState };
  persistPosition: boolean;
  storageKey: string;
  zIndex: number;
}) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    return startCatAnimation({
      stateRef,
      elRef,
      lastStateRef,
      onStateChangeRef,
      liveStateRef,
      persistPosition,
      storageKey,
      zIndex,
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
    liveStateRef,
  ]);
}
