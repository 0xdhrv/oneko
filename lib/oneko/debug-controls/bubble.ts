import { debugColor } from "../constants";
import type { CatRuntimeState } from "../types";
import { makeBtn, makeRow, sectionLabel } from "./ui";

export function appendBubbleSection(
  body: HTMLElement,
  stateRef: { current: CatRuntimeState },
  bubbleEl: HTMLDivElement,
  bubbleTextEl: HTMLDivElement,
  showBubble: () => void,
  hideBubble: () => void,
  bubbleDisplayFrames: number,
) {
  body.appendChild(sectionLabel("bubble"));

  const showBubbleBtn = makeBtn("show", () => showBubble());
  const hideBubbleBtn = makeBtn("hide", () => hideBubble());
  body.appendChild(makeRow(showBubbleBtn, hideBubbleBtn));

  const bubbleInput = document.createElement("input");
  bubbleInput.type = "text";
  bubbleInput.placeholder = "custom text...";
  bubbleInput.style.cssText = [
    `background:${debugColor.controlBg}`,
    `border:1px solid ${debugColor.controlBorder}`,
    `color:${debugColor.panelText}`,
    "border-radius:4px",
    "padding:2px 6px",
    "font-family:inherit",
    "font-size:11px",
    "flex:1",
    "min-width:0",
  ].join(";");

  const setTextBtn = makeBtn("set", () => {
    if (bubbleInput.value.trim()) {
      bubbleTextEl.textContent = bubbleInput.value.trim();
      stateRef.current.bubbleVisible = true;
      stateRef.current.bubbleTimer = bubbleDisplayFrames;
      bubbleEl.style.opacity = "1";
    }
  });

  body.appendChild(makeRow(bubbleInput, setTextBtn));
}
