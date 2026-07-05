import { debugColor } from "../constants";
import type { CatActivityState, CatRuntimeState, IdleActivityState } from "../types";
import { makeBtn, makeRow, sectionLabel, selectStyle } from "./ui";

const ALL_STATES = [
  "moving",
  "idle",
  "sleeping",
  "scratchSelf",
  "tired",
  "alert",
  "scratchWallN",
  "scratchWallS",
  "scratchWallE",
  "scratchWallW",
  "freerun",
] as const;

function applyForcedState(s: CatRuntimeState, chosen: CatActivityState, locked: boolean) {
  s.idleAnimation = null;
  s.idleAnimationFrame = 0;
  s.freerunMode = false;
  s.freerunTimer = 0;

  if (chosen === "moving") {
    s.idleTime = 0;
    s.stateLocked = locked;
    return;
  }

  if (chosen === "idle") {
    s.idleTime = 200;
    s.stateLocked = locked;
    return;
  }

  if (chosen === "freerun") {
    s.freerunMode = true;
    s.freerunTimer = 600;
    s.stateLocked = locked;
    return;
  }

  s.idleTime = 200;
  s.idleAnimation = chosen as IdleActivityState;
  s.idleAnimationFrame = 0;
  s.stateLocked = locked;
}

export function appendForceStateSection(body: HTMLElement, stateRef: { current: CatRuntimeState }) {
  body.appendChild(sectionLabel("force state"));

  const stateSelect = document.createElement("select");
  stateSelect.style.cssText = selectStyle;
  for (const name of ALL_STATES) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    stateSelect.appendChild(opt);
  }

  const lockChk = document.createElement("input");
  lockChk.type = "checkbox";
  lockChk.title = "lock state (prevent auto-reset)";
  lockChk.style.cssText = `cursor:pointer;accent-color:${debugColor.accent};`;
  lockChk.addEventListener("change", () => {
    stateRef.current.stateLocked = lockChk.checked;
  });

  const lockLbl = document.createElement("label");
  lockLbl.title = "lock state";
  lockLbl.style.cssText = `display:flex;align-items:center;gap:3px;cursor:pointer;font-size:10px;color:${debugColor.accent};white-space:nowrap;`;
  lockLbl.appendChild(lockChk);
  lockLbl.append("lock");

  body.appendChild(makeRow(stateSelect));

  const forceStateBtn = makeBtn("apply", () => {
    applyForcedState(stateRef.current, stateSelect.value as CatActivityState, lockChk.checked);
  });

  body.appendChild(makeRow(forceStateBtn, lockLbl));
}
