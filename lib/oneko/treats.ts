import { pixelArtSVG } from "./pixel-art";

/** A treat on the page, shared by every cat: the first to reach it eats it. */
export interface Treat {
  x: number;
  y: number;
  el: HTMLDivElement;
  eaten: boolean;
}

const FISH = pixelArtSVG([".OO...O", "OOOO.OO", "OBOOOOO", "OOOO.OO", ".OO...O"], {
  O: "#f4a261",
  B: "#1b1b1b",
});
/** Each fish pixel is drawn this many CSS pixels wide. */
const PIXEL = 2;
const MAX_TREATS = 5;
const treats: Treat[] = [];

/** The uneaten treat closest to a point, or undefined when the floor is clean. */
export function nearestTreat(
  x: number,
  y: number,
  skip?: (treat: Treat) => boolean,
): Treat | undefined {
  let best: Treat | undefined;
  for (const treat of treats)
    if (skip?.(treat)) continue;
    else if (!best || Math.hypot(treat.x - x, treat.y - y) < Math.hypot(best.x - x, best.y - y))
      best = treat;
  return best;
}

/** Drop a treat at a viewport point. Older treats disappear past five on the floor. */
export function dropTreat(x: number, y: number, zIndex: number): Treat {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.setAttribute("data-oneko-treat", "");
  el.innerHTML = FISH;
  const width = 9 * PIXEL;
  const height = 7 * PIXEL;
  const clampedX = Math.max(width, Math.min(window.innerWidth - width, x));
  const clampedY = Math.max(height, Math.min(window.innerHeight - height, y));
  el.style.cssText = [
    "position:fixed",
    "pointer-events:none",
    `left:${clampedX - width / 2}px`,
    `top:${clampedY - height / 2}px`,
    `width:${width}px`,
    `height:${height}px`,
    `z-index:${zIndex}`,
  ].join(";");
  document.body.appendChild(el);
  el.animate?.(
    [
      { transform: "translateY(-14px)", opacity: 0 },
      { transform: "none", opacity: 1 },
    ],
    { duration: 220, easing: "cubic-bezier(0.3, 1.4, 0.6, 1)" },
  );
  const treat = { x: clampedX, y: clampedY, el, eaten: false };
  treats.push(treat);
  while (treats.length > MAX_TREATS) removeTreat(treats[0]);
  return treat;
}

function removeTreat(treat: Treat) {
  treat.eaten = true;
  treat.el.remove();
  const index = treats.indexOf(treat);
  if (index !== -1) treats.splice(index, 1);
}

/** Eat a treat. Returns false when another cat got there first. */
export function eatTreat(treat: Treat): boolean {
  if (treat.eaten) return false;
  removeTreat(treat);
  return true;
}

export function clearTreats(): void {
  while (treats.length) removeTreat(treats[0]);
}
