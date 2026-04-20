"use client";

import { useEffect, useRef } from "react";
import clickSoftUrl from "@/components/sounds/click-soft.mp3";

const VOLUME = 0.35;

export function GlobalClickSound() {
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);

    const audio = new Audio(clickSoftUrl);
    audio.preload = "auto";
    audio.volume = VOLUME;

    const onPointerDown = (event: PointerEvent) => {
      if (reducedMotionRef.current) return;
      const el = event.target;
      if (!(el instanceof Element)) return;
      if (el.closest("[data-no-click-sound]")) return;

      audio.currentTime = 0;
      void audio.play().catch(() => {
        /* autoplay policy or missing asset */
      });
    };

    window.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      mq.removeEventListener("change", sync);
    };
  }, []);

  return null;
}
