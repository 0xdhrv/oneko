import { dropTreat } from "./treats";
import type { CatRuntimeState } from "./types";

/** Imperative controls for a running cat, for tours, games, and onboarding. */
export interface OnekoControls {
  /**
   * Walk to an element (or a CSS selector, or a viewport point) and stay there until follow() or
   * another request. Resolves true on arrival, false if the cat is sent elsewhere first or the
   * target disappears.
   */
  goTo(target: Element | string | { x: number; y: number }): Promise<boolean>;
  /** Show a bubble now, even when automatic bubbles are off. Duration defaults to bubbleDisplayFrames. */
  say(text: string, options?: { duration?: number }): void;
  /** Sit where the cat is until follow(). */
  sit(): void;
  /** Go back to chasing the cursor after goTo() or sit(). */
  follow(): void;
  /** Pet the cat, as if a visitor did. */
  pet(): void;
  /** Drop a treat at a viewport point, or at the cursor. Works without the treats option. */
  dropTreat(x?: number, y?: number): void;
}

export function createCatControls(stateRef: { current: CatRuntimeState }): OnekoControls {
  const s = () => stateRef.current;
  const release = () => {
    const errand = s().errand;
    if (errand?.kind === "goTo") errand.resolve?.(false);
    s().errand = null;
  };
  return {
    goTo(target) {
      const resolved = typeof target === "string" ? document.querySelector(target) : target;
      release();
      if (!resolved) return Promise.resolve(false);
      return new Promise((resolve) => {
        const state = s();
        state.errand = {
          kind: "goTo",
          target: resolved,
          frames: 0,
          arrived: false,
          resolve,
        };
        state.typingNap = false;
      });
    },
    say(text, options = {}) {
      const state = s();
      const frames = Number.isFinite(options.duration)
        ? Math.max(1, Math.round(options.duration! / 100))
        : state.bubbleDisplayFramesCfg;
      state.sayRequest = { text: String(text).slice(0, 280), frames };
    },
    sit() {
      release();
      s().errand = { kind: "sit" };
    },
    follow: release,
    pet() {
      s().petRequest = true;
    },
    dropTreat(x, y) {
      const state = s();
      dropTreat(x ?? state.mousePosX, y ?? state.mousePosY, state.zIndex);
    },
  };
}
