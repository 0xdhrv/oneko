import { TILE } from "../constants";
import { leaderPosition } from "../pack";
import type { CatRuntimeState } from "../types";
import type { CatAnimationDeps } from "./deps";
import { petCat } from "./play";

/** Links and buttons the cat may sit on when the pointer rests over them. */
const PERCH_SELECTOR = "a[href],button,[role='button'],[data-oneko-perch]";
const PERCH_DELAY_MS = 700;
const NOT_TYPED_INPUTS = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/** How close the cat gets before it settles, depending on what it is after. */
export function stopDistance(s: CatRuntimeState): number {
  if (s.errand || s.perchTarget) return Math.min(s.followDistanceCfg, 8);
  if (s.leaderTarget) return Math.max(s.followDistanceCfg, TILE * s.scale);
  return s.followDistanceCfg;
}

/** Per-frame upkeep for page reactions; runs before the movement target is chosen. */
export function tickAttention(deps: CatAnimationDeps): void {
  const s = deps.stateRef.current;
  s.leaderTarget = leaderPosition(s);
  if (s.typingNap && s.sleepEnabledCfg && s.idleAnimation !== "sleeping") {
    s.freerunMode = false;
    s.idleAnimation = "sleeping";
    s.idleAnimationFrame = 0;
    s.idleTime = Math.max(s.idleTime, 1);
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
  return target instanceof HTMLInputElement && !NOT_TYPED_INPUTS.has(target.type);
}

function isTypingKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  return event.key.length === 1 || event.key === "Backspace" || event.key === "Delete";
}

function matchesFocusVisible(el: Element): boolean {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}

/**
 * Listens to the page for typing, keyboard focus, and resting pointers. Options are read from
 * the runtime state on every event, so toggling them needs no restart.
 */
export function watchPage(deps: CatAnimationDeps): () => void {
  const s = () => deps.stateRef.current;
  let perchTimer: ReturnType<typeof setTimeout> | undefined;
  let napAt: { x: number; y: number } | null = null;

  const onKeyDown = (event: KeyboardEvent) => {
    const state = s();
    if (!state.napWhileTypingCfg || !isTypingTarget(event.target) || !isTypingKey(event)) return;
    state.typingNap = true;
    state.perchTarget = null;
    napAt = { x: state.mousePosX, y: state.mousePosY };
  };

  const onMouseMove = (event: MouseEvent) => {
    const state = s();
    // Browsers can send mousemove without real movement, so wake only after the pointer travels.
    if (
      state.typingNap &&
      (!napAt || Math.hypot(event.clientX - napAt.x, event.clientY - napAt.y) > 4)
    ) {
      state.typingNap = false;
    }
    state.perchTarget = null;
    clearTimeout(perchTimer);
    if (!state.perchOnHoverCfg) return;
    const { clientX: x, clientY: y } = event;
    perchTimer = setTimeout(() => {
      const current = s();
      const target = document.elementFromPoint(x, y)?.closest(PERCH_SELECTOR);
      if (!current.perchOnHoverCfg || !target || target === deps.el) return;
      const rect = target.getBoundingClientRect();
      if (rect.width === 0 || rect.width > window.innerWidth * 0.6) return;
      current.perchTarget = {
        x: rect.left + rect.width / 2,
        y: Math.max(16, rect.top - (TILE * current.scale) / 2 + 4),
      };
    }, PERCH_DELAY_MS);
  };

  const onFocusIn = (event: FocusEvent) => {
    const state = s();
    const target = event.target;
    if (!state.followFocusCfg || !(target instanceof Element) || target === deps.el) return;
    if (!matchesFocusVisible(target)) return;
    const rect = target.getBoundingClientRect();
    const reach = (TILE * state.scale) / 2 + 8;
    const below = rect.bottom + reach;
    state.mousePosX = Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2));
    state.mousePosY = below < window.innerHeight - 16 ? below : Math.max(16, rect.top - reach);
    state.perchTarget = null;
  };

  const onScroll = () => {
    s().perchTarget = null;
  };

  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("focusin", onFocusIn);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    clearTimeout(perchTimer);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("focusin", onFocusIn);
    window.removeEventListener("scroll", onScroll);
    const state = s();
    state.typingNap = false;
    state.perchTarget = null;
    state.held = false;
  };
}

const VISUALLY_HIDDEN =
  "position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap";

/** Turns the cat into a focusable "Pet the cat" button. It holds still while focused. */
export function makePettable(deps: CatAnimationDeps): () => void {
  const { el } = deps;
  const announcer = document.createElement("span");
  announcer.setAttribute("aria-live", "polite");
  announcer.style.cssText = VISUALLY_HIDDEN;
  el.appendChild(announcer);
  el.removeAttribute("aria-hidden");
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", "Pet the cat");
  el.tabIndex = 0;
  let pets = 0;

  const onFocus = () => {
    deps.stateRef.current.held = true;
    if (matchesFocusVisible(el)) {
      el.style.outline = "2px solid var(--ring, Highlight)";
      el.style.outlineOffset = "2px";
    }
  };
  const onBlur = () => {
    deps.stateRef.current.held = false;
    el.style.outline = "";
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (!event.repeat) pet();
  };

  const pet = () => {
    petCat(deps);
    // Alternate the text so screen readers announce every pet, not just the first.
    announcer.textContent = ++pets % 2 ? "The cat purrs." : "The cat purrs happily.";
  };

  el.addEventListener("focus", onFocus);
  el.addEventListener("blur", onBlur);
  el.addEventListener("keydown", onKeyDown);
  return () => {
    el.removeEventListener("focus", onFocus);
    el.removeEventListener("blur", onBlur);
    el.removeEventListener("keydown", onKeyDown);
    announcer.remove();
    deps.stateRef.current.held = false;
  };
}
