const DOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true" focusable="false" style="display:block;width:100%;height:100%"><rect x="3" y="0" width="1" height="1" fill="var(--destructive)"/><rect x="2" y="1" width="3" height="1" fill="var(--destructive)"/><rect x="1" y="2" width="5" height="1" fill="var(--destructive)"/><rect x="0" y="3" width="7" height="1" fill="var(--destructive)"/><rect x="1" y="4" width="5" height="1" fill="var(--destructive)"/><rect x="2" y="5" width="3" height="1" fill="var(--destructive)"/><rect x="3" y="6" width="1" height="1" fill="var(--destructive)"/><rect x="2" y="2" width="1" height="1" fill="var(--accent)"/></svg>`;

const LASER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 5" shape-rendering="crispEdges" aria-hidden="true" focusable="false" style="display:block;width:100%;height:100%"><rect x="2" y="0" width="16" height="1" fill="var(--destructive)"/><rect x="1" y="1" width="18" height="1" fill="var(--destructive)"/><rect x="0" y="2" width="20" height="1" fill="var(--destructive)"/><rect x="1" y="3" width="18" height="1" fill="var(--destructive)"/><rect x="2" y="4" width="16" height="1" fill="var(--destructive)"/><rect x="11" y="1" width="1" height="1" fill="var(--primary-foreground)"/><rect x="13" y="1" width="1" height="1" fill="var(--primary-foreground)"/><rect x="15" y="1" width="1" height="1" fill="var(--primary-foreground)"/><rect x="11" y="2" width="1" height="1" fill="var(--primary-foreground)"/><rect x="13" y="2" width="1" height="1" fill="var(--primary-foreground)"/><rect x="15" y="2" width="1" height="1" fill="var(--primary-foreground)"/><rect x="11" y="3" width="1" height="1" fill="var(--primary-foreground)"/><rect x="13" y="3" width="1" height="1" fill="var(--primary-foreground)"/><rect x="15" y="3" width="1" height="1" fill="var(--primary-foreground)"/><rect x="4" y="0" width="3" height="1" fill="var(--primary)"/><rect x="4" y="1" width="3" height="1" fill="var(--primary)"/><rect x="18" y="1" width="3" height="1" fill="var(--accent)"/><rect x="18" y="2" width="3" height="1" fill="var(--accent)"/><rect x="18" y="3" width="3" height="1" fill="var(--accent)"/></svg>`;

const DOT_SIZE = 9;
const LASER_W = 88;
const LASER_H = 20;
const ANCHOR_INSET = 10;
const TRAIL_LEN = 22;

function makeDot(zIndex: number, size: number, opacity: number, glow: boolean) {
  const d = document.createElement("div");
  d.setAttribute("aria-hidden", "true");
  d.style.cssText = [
    "position:fixed",
    `width:${size}px`,
    `height:${size}px`,
    "pointer-events:none",
    `z-index:${zIndex}`,
    "left:0",
    "top:0",
    "image-rendering:pixelated",
    `opacity:${opacity}`,
    "transform:translate(-50%,-50%) translate(-100px,-100px)",
    "will-change:transform",
    glow
      ? "filter:drop-shadow(0 0 4px var(--destructive)) drop-shadow(0 0 12px color-mix(in srgb, var(--destructive) 55%, transparent))"
      : "",
  ].join(";");
  d.innerHTML = DOT_SVG;
  return d;
}

function createTrail(zIndex: number) {
  const trail: HTMLDivElement[] = [];
  for (let i = 1; i <= TRAIL_LEN; i++) {
    const t = i / (TRAIL_LEN + 1);
    const size = Math.max(2, DOT_SIZE * (1 - t * 0.85));
    const opacity = 0.55 * (1 - t);
    trail.push(makeDot(zIndex, size, opacity, false));
  }
  return trail;
}

function createLaserBody(zIndex: number) {
  const laser = document.createElement("div");
  laser.setAttribute("aria-hidden", "true");
  laser.style.cssText = [
    "position:fixed",
    `width:${LASER_W}px`,
    `height:${LASER_H}px`,
    "pointer-events:none",
    `z-index:${zIndex}`,
    "left:0",
    "top:0",
    "image-rendering:pixelated",
    "transform-origin:100% 50%",
    "filter:drop-shadow(0 0 6px color-mix(in srgb, var(--destructive) 45%, transparent))",
    "will-change:transform",
  ].join(";");
  laser.innerHTML = LASER_SVG;
  return laser;
}

export function mountLaserCursor(zIndex: number): () => void {
  const dot = makeDot(zIndex, DOT_SIZE, 1, true);
  const trail = createTrail(zIndex);
  const laser = createLaserBody(zIndex);

  document.body.appendChild(laser);
  for (const t of trail) {
    document.body.appendChild(t);
  }
  document.body.appendChild(dot);
  const previousCursor = document.body.style.getPropertyValue("cursor");
  const previousPriority = document.body.style.getPropertyPriority("cursor");
  document.body.style.setProperty("cursor", "none");

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;

  // Ring buffer of recent pointer positions; slot `head` is the newest.
  const SLOTS = TRAIL_LEN + 1;
  const historyX = new Float64Array(SLOTS).fill(pointerX);
  const historyY = new Float64Array(SLOTS).fill(pointerY);
  let head = 0;

  const positionLaser = () => {
    const anchorX = ANCHOR_INSET + LASER_W;
    const anchorY = ANCHOR_INSET + LASER_H / 2;
    const dx = pointerX - anchorX;
    const dy = pointerY - anchorY;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
    laser.style.transform = `translate(${ANCHOR_INSET}px, ${ANCHOR_INSET}px) rotate(${angle}deg)`;
  };

  let rafId = 0;
  /** Frames since the pointer last moved; once the trail has caught up, the loop sleeps. */
  let stillFrames = 0;
  const place = (el: HTMLDivElement, slot: number) => {
    el.style.transform = `translate(-50%,-50%) translate(${historyX[slot]}px, ${historyY[slot]}px)`;
  };
  const tick = () => {
    head = (head + SLOTS - 1) % SLOTS;
    historyX[head] = pointerX;
    historyY[head] = pointerY;
    place(dot, head);
    for (let i = 0; i < trail.length; i++) place(trail[i], (head + i + 1) % SLOTS);
    stillFrames++;
    rafId = stillFrames > SLOTS ? 0 : window.requestAnimationFrame(tick);
  };
  const wake = () => {
    stillFrames = 0;
    if (!rafId) rafId = window.requestAnimationFrame(tick);
  };

  const onMove = (e: MouseEvent) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    positionLaser();
    wake();
  };

  positionLaser();
  rafId = window.requestAnimationFrame(tick);

  document.addEventListener("mousemove", onMove);
  window.addEventListener("resize", positionLaser);
  window.addEventListener("scroll", positionLaser, { passive: true });

  return () => {
    window.cancelAnimationFrame(rafId);
    document.removeEventListener("mousemove", onMove);
    window.removeEventListener("resize", positionLaser);
    window.removeEventListener("scroll", positionLaser);
    if (dot.parentNode) {
      dot.parentNode.removeChild(dot);
    }
    for (const t of trail) {
      if (t.parentNode) {
        t.parentNode.removeChild(t);
      }
    }
    if (laser.parentNode) {
      laser.parentNode.removeChild(laser);
    }
    if (previousCursor) {
      document.body.style.setProperty("cursor", previousCursor, previousPriority);
    } else {
      document.body.style.removeProperty("cursor");
    }
  };
}
