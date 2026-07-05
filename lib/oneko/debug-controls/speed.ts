import { debugColor } from "../constants";
import type { CatRuntimeState } from "../types";
import { makeRow, sectionLabel } from "./ui";

export function appendSpeedSection(body: HTMLElement, stateRef: { current: CatRuntimeState }) {
  body.appendChild(sectionLabel("speed"));

  const speedLabel = document.createElement("span");
  speedLabel.textContent = String(stateRef.current.currentSpeed);
  speedLabel.style.cssText = "min-width:20px;text-align:right;";

  const speedSlider = document.createElement("input");
  speedSlider.type = "range";
  speedSlider.min = "1";
  speedSlider.max = "40";
  speedSlider.value = String(stateRef.current.currentSpeed);
  speedSlider.style.cssText = `flex:1;cursor:pointer;accent-color:${debugColor.accent};`;
  speedSlider.addEventListener("input", () => {
    const val = Number(speedSlider.value);
    speedLabel.textContent = String(val);
    stateRef.current.currentSpeed = val;
  });

  body.appendChild(makeRow(speedSlider, speedLabel));
}
