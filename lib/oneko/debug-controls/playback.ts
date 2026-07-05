import { debugColor } from "../constants";
import type { CatRuntimeState } from "../types";
import { makeBtn, makeRow, sectionLabel } from "./ui";

export function appendPlaybackSection(
  body: HTMLElement,
  stateRef: { current: CatRuntimeState },
  frame: () => void,
) {
  body.appendChild(sectionLabel("playback"));

  const pauseBtn = makeBtn("⏸ pause", () => {
    stateRef.current.paused = !stateRef.current.paused;
    pauseBtn.textContent = stateRef.current.paused ? "▶ play" : "⏸ pause";
    stepBtn.style.opacity = stateRef.current.paused ? "1" : "0.3";
    stepBtn.style.pointerEvents = stateRef.current.paused ? "auto" : "none";
  });

  const stepBtn = makeBtn("→ step", () => {
    if (stateRef.current.paused) {
      frame();
    }
  });
  stepBtn.style.opacity = "0.3";
  stepBtn.style.pointerEvents = "none";

  body.appendChild(makeRow(pauseBtn, stepBtn));

  const followBtn = makeBtn("⛶ stop following", () => {
    stateRef.current.noFollow = !stateRef.current.noFollow;
    const on = stateRef.current.noFollow;
    if (on) {
      stateRef.current.freerunMode = false;
      stateRef.current.freerunTimer = 0;
    }
    followBtn.textContent = on ? "⛶ resume following" : "⛶ stop following";
    followBtn.style.color = on ? debugColor.accentStrong : debugColor.panelText;
  });
  followBtn.style.width = "100%";
  body.appendChild(makeRow(followBtn));
}
