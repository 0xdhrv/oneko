import { debugColor } from "../constants";
import type { CatRuntimeState } from "../types";
import { appendBubbleSection } from "./bubble";
import { appendForceStateSection } from "./force-state";
import { appendPlaybackSection } from "./playback";
import { appendPositionSection } from "./position";
import { appendSpeedSection } from "./speed";
import { BASE_STYLE } from "./ui";

export interface DebugControlsParams {
  stateRef: { current: CatRuntimeState };
  el: HTMLDivElement;
  bubbleEl: HTMLDivElement;
  bubbleTextEl: HTMLDivElement;
  frame: () => void;
  showBubble: () => void;
  hideBubble: () => void;
  bubbleDisplayFrames: number;
}

export function createDebugControls({
  stateRef,
  el,
  bubbleEl,
  bubbleTextEl,
  frame,
  showBubble,
  hideBubble,
  bubbleDisplayFrames,
}: DebugControlsParams): HTMLDivElement {
  const panel = document.createElement("div");
  panel.setAttribute("aria-hidden", "true");
  panel.style.cssText = "user-select:none;pointer-events:auto;";

  const header = document.createElement("div");
  header.style.cssText = `${BASE_STYLE};padding:6px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;`;

  const headerTitle = document.createElement("span");
  headerTitle.textContent = "controls";
  headerTitle.style.cssText = `font-weight:bold;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;color:${debugColor.panelSubtle};`;

  const chevron = document.createElement("span");
  chevron.textContent = "▾";
  chevron.style.cssText = `font-size:10px;color:${debugColor.panelSubtle};`;

  header.appendChild(headerTitle);
  header.appendChild(chevron);
  panel.appendChild(header);

  const body = document.createElement("div");
  body.style.cssText = `${BASE_STYLE};padding:6px 14px 10px;margin-top:4px;`;
  panel.appendChild(body);

  let collapsed = false;
  header.addEventListener("click", () => {
    collapsed = !collapsed;
    body.style.display = collapsed ? "none" : "block";
    chevron.textContent = collapsed ? "▸" : "▾";
  });

  appendPlaybackSection(body, stateRef, frame);
  appendForceStateSection(body, stateRef);
  appendBubbleSection(
    body,
    stateRef,
    bubbleEl,
    bubbleTextEl,
    showBubble,
    hideBubble,
    bubbleDisplayFrames,
  );
  appendPositionSection(body, stateRef, el);
  appendSpeedSection(body, stateRef);

  return panel;
}
