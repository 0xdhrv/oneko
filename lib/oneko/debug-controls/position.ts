import { debugColor, TILE } from "../constants";
import type { CatRuntimeState } from "../types";
import { makeBtn, makeRow, sectionLabel } from "./ui";

function syncCatElementPosition(el: HTMLDivElement, s: CatRuntimeState) {
  el.style.left = `${s.nekoPosX - TILE / 2}px`;
  el.style.top = `${s.nekoPosY - TILE / 2}px`;
}

function makePosSlider(
  axis: "X" | "Y",
  el: HTMLDivElement,
  stateRef: { current: CatRuntimeState },
  getMax: () => number,
  getVal: () => number,
  setVal: (v: number) => void,
) {
  const lbl = document.createElement("span");
  lbl.textContent = axis;
  lbl.style.cssText = `min-width:10px;color:${debugColor.panelSubtle};font-size:10px;font-weight:bold;`;

  const valLbl = document.createElement("span");
  valLbl.style.cssText = "min-width:28px;text-align:right;font-size:10px;";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "16";
  slider.style.cssText = `flex:1;cursor:pointer;accent-color:${debugColor.accent};`;

  const sync = () => {
    slider.max = String(Math.round(getMax()));
    slider.value = String(Math.round(getVal()));
    valLbl.textContent = String(Math.round(getVal()));
  };
  sync();

  slider.addEventListener("mousedown", sync);
  slider.addEventListener("input", () => {
    const v = Number(slider.value);
    valLbl.textContent = String(v);
    setVal(v);
    syncCatElementPosition(el, stateRef.current);
  });

  return makeRow(lbl, slider, valLbl);
}

export function appendPositionSection(
  body: HTMLElement,
  stateRef: { current: CatRuntimeState },
  el: HTMLDivElement,
) {
  body.appendChild(sectionLabel("position"));

  const teleportCenterBtn = makeBtn("→ center", () => {
    stateRef.current.nekoPosX = window.innerWidth / 2;
    stateRef.current.nekoPosY = window.innerHeight / 2;
    syncCatElementPosition(el, stateRef.current);
  });

  const teleportMouseBtn = makeBtn("→ cursor", () => {
    const s = stateRef.current;
    s.nekoPosX = s.mousePosX;
    s.nekoPosY = s.mousePosY;
    syncCatElementPosition(el, s);
  });

  body.appendChild(makeRow(teleportCenterBtn, teleportMouseBtn));

  body.appendChild(
    makePosSlider(
      "X",
      el,
      stateRef,
      () => window.innerWidth,
      () => stateRef.current.nekoPosX,
      (v) => {
        stateRef.current.nekoPosX = v;
      },
    ),
  );
  body.appendChild(
    makePosSlider(
      "Y",
      el,
      stateRef,
      () => window.innerHeight,
      () => stateRef.current.nekoPosY,
      (v) => {
        stateRef.current.nekoPosY = v;
      },
    ),
  );
}
