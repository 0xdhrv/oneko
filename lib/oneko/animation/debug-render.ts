import { CELL_SIZE, debugColor } from "../constants";
import type { ObstacleRect, PathPoint } from "../types";
import { getActivityLabel, getBubbleStatus } from "./activity";
import type { CatAnimationDeps } from "./deps";

const SVG_NS = "http://www.w3.org/2000/svg";

function clearSVGGroup(deps: CatAnimationDeps, id: string) {
  const group = deps.debugSVG.querySelector(`#${id}`);
  if (group) {
    group.innerHTML = "";
  }
}

function updateBlockedCells(deps: CatAnimationDeps, grid: Uint8Array, cols: number, rows: number) {
  const group = deps.debugSVG.querySelector("#oneko-blocked");
  if (!group) {
    return;
  }
  group.innerHTML = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r * cols + c] === 1) {
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(c * CELL_SIZE + 0.5));
        rect.setAttribute("y", String(r * CELL_SIZE + 0.5));
        rect.setAttribute("width", String(CELL_SIZE - 1));
        rect.setAttribute("height", String(CELL_SIZE - 1));
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", debugColor.dangerSoft);
        rect.setAttribute("stroke-width", "0.5");
        group.appendChild(rect);
      }
    }
  }
}

function updateObstacleOutlines(deps: CatAnimationDeps, rects: ObstacleRect[]) {
  const group = deps.debugSVG.querySelector("#oneko-obstacles");
  if (!group) {
    return;
  }
  group.innerHTML = "";
  for (const r of rects) {
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(r.left));
    rect.setAttribute("y", String(r.top));
    rect.setAttribute("width", String(r.right - r.left));
    rect.setAttribute("height", String(r.bottom - r.top));
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke", debugColor.dangerSoft);
    rect.setAttribute("stroke-width", "0.5");
    rect.setAttribute("stroke-dasharray", "3 3");
    group.appendChild(rect);
  }
}

function updateDebugPath(deps: CatAnimationDeps, path: PathPoint[], catX: number, catY: number) {
  const group = deps.debugSVG.querySelector("#oneko-path");
  if (!group) {
    return;
  }
  group.innerHTML = "";
  if (path.length === 0) {
    return;
  }

  const points = `${catX},${catY} ${path.map((p) => `${p.x},${p.y}`).join(" ")}`;
  const line = document.createElementNS(SVG_NS, "polyline");
  line.setAttribute("points", points);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", debugColor.trail);
  line.setAttribute("stroke-width", "1.5");
  line.style.transition = "all 0.15s ease";
  group.appendChild(line);

  for (const pt of path) {
    const dot = document.createElementNS(SVG_NS, "circle");
    dot.setAttribute("cx", String(pt.x));
    dot.setAttribute("cy", String(pt.y));
    dot.setAttribute("r", "2");
    dot.setAttribute("fill", debugColor.trailDot);
    group.appendChild(dot);
  }
}

function updateDebugHUD(deps: CatAnimationDeps) {
  const s = deps.stateRef.current;
  const activity = getActivityLabel(deps);
  const stateColor = s.freerunMode ? debugColor.danger : debugColor.accent;
  const td = "padding:1px 0;";
  const labelTd = `${td}font-weight:bold;color:${debugColor.panelSubtle};padding-right:12px;`;
  const valueTd = `${td}text-align:right;`;
  const row = (label: string, value: string, color?: string) => {
    const valStyle = color ? `${valueTd}color:${color}` : valueTd;
    return `<tr><td style="${labelTd}">${label}</td><td style="${valStyle}">${value}</td></tr>`;
  };

  const speed = Math.hypot(s.nekoVelX, s.nekoVelY);
  const distToMouse = Math.hypot(s.mousePosX - s.nekoPosX, s.mousePosY - s.nekoPosY);

  deps.debugHUD.innerHTML = `<table style="border-collapse:collapse;width:100%">${[
    row("state", activity, stateColor),
    row("pos", `${Math.round(s.nekoPosX)}, ${Math.round(s.nekoPosY)}`),
    row("vel", `${s.nekoVelX.toFixed(1)}, ${s.nekoVelY.toFixed(1)}`),
    row("speed", speed.toFixed(1)),
    row("target", `${Math.round(s.mousePosX)}, ${Math.round(s.mousePosY)}`),
    row("dist", `${Math.round(distToMouse)}px`),
    row("idle", `${s.idleTime}f`),
    row("frame", `${s.frameCount}`),
    row("trail", `${s.currentPath.length} pts`),
    row("step", `${s.pathWaypointIdx}/${s.currentPath.length}`),
    row("obstacles", `${s.obstacleRects.length}`),
    row("grid", `${s.gridCols} x ${s.gridRows}`),
    row("freerun", s.freerunMode ? `${s.freerunTimer}f left` : "off"),
    row("bubble", getBubbleStatus(s)),
  ].join("")}</table>`;
}

export function createDebugRenderer(deps: CatAnimationDeps) {
  let lastBlockedGrid: Uint8Array | null = null;

  const renderDebug = () => {
    const s = deps.stateRef.current;
    if (s.grid !== lastBlockedGrid) {
      lastBlockedGrid = s.grid;
      if (s.grid) {
        updateBlockedCells(deps, s.grid, s.gridCols, s.gridRows);
      } else {
        clearSVGGroup(deps, "oneko-blocked");
      }
      updateObstacleOutlines(deps, s.obstacleRects);
    }
    updateDebugPath(deps, s.currentPath, s.nekoPosX, s.nekoPosY);
    updateDebugHUD(deps);
  };

  const maybeRenderDebug = () => {
    if (deps.stateRef.current.debugMode) {
      renderDebug();
    }
  };

  return { renderDebug, maybeRenderDebug };
}
