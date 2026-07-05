"use client";

import { useEffect } from "react";
import { startCatAnimation } from "@/lib/oneko/start-cat-animation";
import type { CatActivityState, CatLiveState, CatRuntimeState } from "@/lib/oneko/types";

export function useCatAnimation({
  stateRef,
  elRef,
  lastStateRef,
  onStateChangeRef,
  liveStateRef,
  persistPosition,
  zIndex,
}: {
  stateRef: { current: CatRuntimeState };
  elRef: { current: HTMLDivElement | null };
  lastStateRef: { current: CatActivityState };
  onStateChangeRef: { current: ((state: CatActivityState) => void) | undefined };
  liveStateRef?: { current: CatLiveState };
  persistPosition: boolean;
  zIndex: number;
}) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReduced) {
      return;
    }

    return startCatAnimation({
      stateRef,
      elRef,
      lastStateRef,
      onStateChangeRef,
      liveStateRef,
      persistPosition,
      zIndex,
    });
  }, [stateRef, elRef, lastStateRef, onStateChangeRef, persistPosition, zIndex, liveStateRef]);
}
