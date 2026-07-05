import { debugColor } from "../constants";

export const BASE_STYLE = [
  "font-family:var(--font-mono), monospace",
  "font-size:11px",
  "line-height:1.6",
  "border-radius:6px",
  `background:${debugColor.panelBg}`,
  `border:1px solid ${debugColor.panelBorder}`,
  `color:${debugColor.panelText}`,
  "width:190px",
].join(";");

const btnStyle = [
  `background:${debugColor.controlBg}`,
  `border:1px solid ${debugColor.controlBorder}`,
  `color:${debugColor.panelText}`,
  "border-radius:4px",
  "padding:2px 8px",
  "font-family:inherit",
  "font-size:11px",
  "cursor:pointer",
].join(";");

export const selectStyle = [
  `background:${debugColor.controlBg}`,
  `border:1px solid ${debugColor.controlBorder}`,
  `color:${debugColor.panelText}`,
  "border-radius:4px",
  "padding:2px 4px",
  "font-family:inherit",
  "font-size:11px",
  "cursor:pointer",
  "flex:1",
].join(";");

export function sectionLabel(text: string) {
  const d = document.createElement("div");
  d.textContent = text;
  d.style.cssText = `color:${debugColor.panelSubtle};font-weight:bold;margin-top:8px;margin-bottom:3px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;`;
  return d;
}

export function makeRow(...children: HTMLElement[]) {
  const r = document.createElement("div");
  r.style.cssText = "display:flex;gap:4px;align-items:center;margin-bottom:3px;";
  for (const c of children) {
    r.appendChild(c);
  }
  return r;
}

export function makeBtn(label: string, onClick: () => void) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.cssText = btnStyle;
  btn.addEventListener("click", onClick);
  return btn;
}
