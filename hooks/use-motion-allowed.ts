"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia?.(REDUCED_MOTION_QUERY);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return !(window.matchMedia?.(REDUCED_MOTION_QUERY).matches ?? false);
}

export function useMotionAllowed(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
