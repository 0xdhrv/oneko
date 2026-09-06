"use client";

import { useEffect, useRef } from "react";
import { createUiSoundPlayer, type UiSound } from "@/lib/ui-sounds";

export function GlobalClickSound({
  enabled = true,
  volume = 0.5,
}: {
  enabled?: boolean;
  volume?: number;
}) {
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  enabledRef.current = enabled;
  volumeRef.current = volume;

  useEffect(() => {
    const player = createUiSoundPlayer();
    let lastTick = -Infinity;
    const play = (kind: UiSound) => {
      if (kind === "tick") {
        const now = performance.now();
        if (now - lastTick < 60) return;
        lastTick = now;
      }
      void player.play(kind, volumeRef.current).catch(() => {
        // An unavailable audio device must not interrupt a control.
      });
    };
    const isQuiet = (element: Element) =>
      Boolean(element.closest('[data-no-click-sound], [disabled], [aria-disabled="true"]'));
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || isQuiet(event.target)) return;
      const control = event.target.closest(
        'button,a[href],summary,input[type="checkbox"],input[type="radio"],[role="button"],[role="switch"]',
      );
      if (!control) return;
      const isEnablingSound = control.matches('[data-sound-toggle][aria-checked="false"]');
      if ((!enabledRef.current && !isEnablingSound) || volumeRef.current <= 0) return;
      const isToggle = control.matches('input,[role="switch"],[aria-pressed],[aria-expanded]');
      play(isToggle ? "toggle" : "tap");
    };
    const onInput = (event: Event) => {
      if (
        event.target instanceof HTMLInputElement &&
        event.target.type === "range" &&
        !isQuiet(event.target) &&
        enabledRef.current &&
        volumeRef.current > 0
      )
        play("tick");
    };
    const onChange = (event: Event) => {
      if (
        event.target instanceof HTMLSelectElement &&
        !isQuiet(event.target) &&
        enabledRef.current &&
        volumeRef.current > 0
      )
        play("toggle");
    };
    // Click also covers keyboard activation. Empty page space stays quiet.
    // Capture lets the Sound switch unlock Audio Kit before React updates its state.
    window.addEventListener("click", onClick, true);
    window.addEventListener("input", onInput);
    window.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("input", onInput);
      window.removeEventListener("change", onChange);
      player.stop();
    };
  }, []);

  return null;
}
