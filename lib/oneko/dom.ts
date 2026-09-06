import { CELL_SIZE, debugColor, TILE } from "./constants";
import type { CatRuntimeState } from "./types";

export interface BubbleElements {
  wrapper: HTMLDivElement;
  textEl: HTMLDivElement;
  tailWrap: HTMLDivElement;
}

export function createCatElement(state: CatRuntimeState, zIndex: number): HTMLDivElement {
  const el = document.createElement("div");
  el.id = "oneko-react";
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = [
    `width:${TILE}px`,
    `height:${TILE}px`,
    "position:fixed",
    "pointer-events:none",
    "image-rendering:pixelated",
    `left:${state.nekoPosX - TILE / 2}px`,
    `top:${state.nekoPosY - TILE / 2}px`,
    `z-index:${zIndex}`,
    "background-repeat:no-repeat",
    "background-size:256px 128px",
    "transform:scale(1)",
    "opacity:1",
  ].join(";");
  return el;
}

const SVG_NS = "http://www.w3.org/2000/svg";

export function createDebugSVG(zIndex: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "width:100vw",
    "height:100vh",
    "pointer-events:none",
    `z-index:${zIndex - 1}`,
    "display:none",
  ].join(";");

  const defs = document.createElementNS(SVG_NS, "defs");
  const pattern = document.createElementNS(SVG_NS, "pattern");
  pattern.id = "oneko-grid";
  pattern.setAttribute("width", String(CELL_SIZE));
  pattern.setAttribute("height", String(CELL_SIZE));
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  const patternRect = document.createElementNS(SVG_NS, "rect");
  patternRect.setAttribute("width", String(CELL_SIZE));
  patternRect.setAttribute("height", String(CELL_SIZE));
  patternRect.setAttribute("fill", "none");
  patternRect.setAttribute("stroke", debugColor.gridStroke);
  patternRect.setAttribute("stroke-width", "0.5");
  pattern.appendChild(patternRect);
  defs.appendChild(pattern);
  svg.appendChild(defs);

  const gridBg = document.createElementNS(SVG_NS, "rect");
  gridBg.setAttribute("width", "100%");
  gridBg.setAttribute("height", "100%");
  gridBg.setAttribute("fill", "url(#oneko-grid)");
  svg.appendChild(gridBg);

  const blockedGroup = document.createElementNS(SVG_NS, "g");
  blockedGroup.id = "oneko-blocked";
  svg.appendChild(blockedGroup);

  const obstacleGroup = document.createElementNS(SVG_NS, "g");
  obstacleGroup.id = "oneko-obstacles";
  svg.appendChild(obstacleGroup);

  const pathGroup = document.createElementNS(SVG_NS, "g");
  pathGroup.id = "oneko-path";
  svg.appendChild(pathGroup);

  return svg;
}

export function createBubble(zIndex: number): BubbleElements {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("aria-hidden", "true");
  wrapper.style.cssText = [
    "position:fixed",
    "pointer-events:none",
    `z-index:${zIndex}`,
    "opacity:0",
    "transition:opacity 0.2s ease-out",
    "transform:translateX(-50%)",
    "display:flex",
    "flex-direction:column",
    "align-items:center",
    "outline:none",
  ].join(";");

  const bubble = document.createElement("div");
  bubble.style.cssText = [
    "padding:4px 8px",
    "border-radius:8px",
    "box-sizing:border-box",
    "font-size:9px",
    "line-height:1.25",
    "font-weight:500",
    "font-family:var(--font-geist-pixel-square), monospace",
    "color:var(--foreground)",
    "background-color:var(--background)",
    "border:1px solid var(--border)",
    "max-width:150px",
    "width:max-content",
    "white-space:normal",
    "word-break:break-word",
    "outline:none",
  ].join(";");
  wrapper.appendChild(bubble);

  const tailWrap = document.createElement("div");
  tailWrap.style.cssText = "position:relative;line-height:0;flex-shrink:0;outline:none;";

  const tailSvg = document.createElementNS(SVG_NS, "svg");
  tailSvg.setAttribute("width", "12");
  tailSvg.setAttribute("height", "7");
  tailSvg.setAttribute("viewBox", "0 0 12 7");
  tailSvg.setAttribute("overflow", "visible");
  tailSvg.style.cssText = "display:block;outline:none;";

  const tailPath = document.createElementNS(SVG_NS, "path");
  tailPath.setAttribute("d", "M 6 7 L 1.5 1.5 L 10.5 1.5 Z");
  tailPath.setAttribute("fill", "var(--background)");
  tailPath.setAttribute("stroke", "var(--border)");
  tailPath.setAttribute("stroke-width", "1");
  tailPath.setAttribute("stroke-linejoin", "miter");
  tailPath.setAttribute("stroke-linecap", "butt");
  tailPath.setAttribute("stroke-miterlimit", "2");
  tailPath.style.paintOrder = "stroke fill";
  tailSvg.appendChild(tailPath);
  tailWrap.appendChild(tailSvg);

  wrapper.appendChild(tailWrap);

  return { wrapper, textEl: bubble, tailWrap };
}

export function createDebugHUD(): HTMLDivElement {
  const hud = document.createElement("div");
  hud.setAttribute("aria-hidden", "true");
  hud.style.cssText = [
    "pointer-events:none",
    "font-family:var(--font-mono), monospace",
    "font-size:11px",
    "line-height:1.6",
    "padding:10px 14px",
    "border-radius:6px",
    `background-color:${debugColor.panelBg}`,
    `border:1px solid ${debugColor.panelBorder}`,
    `color:${debugColor.panelText}`,
    "width:190px",
  ].join(";");
  return hud;
}
