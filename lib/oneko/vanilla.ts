/**
 * Framework-free Oneko: the same engine as the React component, driven by a small imperative API.
 * Built to public/oneko.js by scripts/build-vanilla.mjs; not part of the React registry items.
 */
import { TILE } from "./constants";
import { ONEKO_DEFAULTS } from "./defaults";
import { createInitialCatState } from "./initial-state";
import { mountLaserCursor } from "./laser-cursor-dom";
import { readPersistedPosition } from "./persistence";
import { applyRuntimeConfig } from "./runtime-config";
import { getSkinSource, loadSkinSource } from "./skins";
import { startCatAnimation } from "./start-cat-animation";
import type { CatActivityState, OnekoProps } from "./types";

export type OnekoOptions = Omit<OnekoProps, "liveStateRef">;

export interface OnekoInstance {
  /** Merge new options into the running cat. Engine-level options restart it in place. */
  update(options: OnekoOptions): void;
  /** Remove the cat, bubble, laser, and listeners. Saves the position when persistence is on. */
  destroy(): void;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
type Defaults = typeof ONEKO_DEFAULTS;
type Resolved = Omit<OnekoOptions, keyof Defaults> & {
  [K in keyof Defaults]: K extends keyof OnekoOptions ? NonNullable<OnekoOptions[K]> : Defaults[K];
};

export function createOneko(initial: OnekoOptions = {}): OnekoInstance {
  let options: Resolved = { ...ONEKO_DEFAULTS, ...defined(initial) };
  const stateRef = { current: createInitialCatState(runtimeConfig(options)) };
  const elRef: { current: HTMLDivElement | null } = { current: null };
  const lastStateRef = { current: "idle" as CatActivityState };
  const onStateChangeRef = { current: options.onStateChange };
  const motionQuery = window.matchMedia?.(REDUCED_MOTION_QUERY);

  let stopEngine: (() => void) | undefined;
  let stopLaser: (() => void) | undefined;
  let resting: HTMLDivElement | undefined;
  let skinRequest = 0;
  let destroyed = false;

  const reducedMotion = () => motionQuery?.matches ?? false;

  /** Apply sprite, size, tint, and opacity to whichever cat element is showing. */
  const paint = () => {
    const el = elRef.current ?? resting;
    if (!el) return;
    const rotation = resting ? 0 : stateRef.current.currentRotation;
    el.style.transform = `scale(${options.scale}) rotate(${rotation}deg)`;
    el.style.opacity = String(options.opacity);
    el.style.filter = options.hueRotate ? `hue-rotate(${options.hueRotate}deg)` : "";
    const source = options.spriteSrc || getSkinSource(options.skin);
    if (source) {
      el.style.backgroundImage = `url(${JSON.stringify(source)})`;
      return;
    }
    const request = ++skinRequest;
    loadSkinSource(options.skin).then(
      () => request === skinRequest && !destroyed && paint(),
      () => {},
    );
  };

  const stop = () => {
    stopEngine?.();
    stopLaser?.();
    resting?.remove();
    stopEngine = stopLaser = resting = undefined;
    elRef.current = null;
  };

  const start = () => {
    stop();
    if (reducedMotion()) {
      if (options.reducedMotion === "rest") {
        resting = createRestingCat(options);
        document.body.appendChild(resting);
        paint();
      }
      return;
    }
    stopEngine = startCatAnimation({
      stateRef,
      elRef,
      lastStateRef,
      onStateChangeRef,
      persistPosition: options.persistPosition,
      storageKey: options.storageKey,
      zIndex: options.zIndex,
    });
    if (options.laserPointer && options.followCursor && !options.paused)
      stopLaser = mountLaserCursor(options.zIndex);
    paint();
  };

  motionQuery?.addEventListener("change", start);
  start();

  return {
    update(next) {
      if (destroyed) return;
      const previous = options;
      options = { ...options, ...defined(next) };
      onStateChangeRef.current = options.onStateChange;
      applyRuntimeConfig(stateRef.current, runtimeConfig(options));
      const restart = (
        ["zIndex", "storageKey", "persistPosition", "reducedMotion", "laserPointer"] as const
      ).some((key) => previous[key] !== options[key]);
      const laserChanged =
        previous.followCursor !== options.followCursor || previous.paused !== options.paused;
      if (restart || (laserChanged && options.laserPointer)) start();
      else paint();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      motionQuery?.removeEventListener("change", start);
      stop();
    },
  };
}

function runtimeConfig(options: Resolved) {
  return {
    ...options,
    laserPointer: options.laserPointer && options.followCursor && !options.paused,
  };
}

/** Drop undefined values so they fall back to defaults instead of overriding them. */
function defined(options: OnekoOptions): OnekoOptions {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined),
  ) as OnekoOptions;
}

/** Still, sleeping cat for visitors who prefer reduced motion, matching the React component. */
function createRestingCat(options: Resolved): HTMLDivElement {
  const position =
    (options.persistPosition && readPersistedPosition(options.storageKey)) || options.initialPos;
  const inset = (TILE * options.scale) / 2 + 16 - TILE / 2;
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = [
    "position:fixed",
    position ? `left:${position.x - TILE / 2}px` : `right:${inset}px`,
    position ? `top:${position.y - TILE / 2}px` : `bottom:${inset}px`,
    `width:${TILE}px`,
    `height:${TILE}px`,
    "pointer-events:none",
    "image-rendering:pixelated",
    "background-repeat:no-repeat",
    "background-size:256px 128px",
    `background-position:-${2 * TILE}px 0`,
    `z-index:${options.zIndex}`,
  ].join(";");
  return el;
}
