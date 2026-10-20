import {
  affectionTier,
  greetingFor,
  MAX_AFFECTION,
  readAffection,
  writeAffection,
} from "../affection";
import { HISS_POOL, LASER_CATCH_POOL, PET_MESSAGES, PET_SOUND_POOL, TILE } from "../constants";
import { moodForHour, NEUTRAL_MOOD } from "../mood";
import { isNearestCat } from "../pack";
import {
  BOX_MESSAGES,
  FOND_PET_MESSAGES,
  HELD_MESSAGES,
  KNOCK_MESSAGES,
  KNOCK_STARE_MESSAGES,
  TOSS_HARD_MESSAGES,
  TOSS_SOFT_MESSAGES,
  TREAT_MESSAGES,
} from "../play-messages";
import { HAT_HEIGHT, HAT_WIDTH, hatSVG, resolveSeason } from "../seasons";
import { dropTreat, eatTreat, nearestTreat, type Treat } from "../treats";
import { constrainZoneMovement, containsPoint } from "../zones";
import type { CatRuntimeState } from "../types";
import { playSound } from "./activity";
import { pickFromPool } from "./bubbles";
import type { CatAnimationDeps } from "./deps";
import { errandPoint } from "./errand-point";
import { clearRotation, setSprite } from "./sprites";

/** Ticks between calendar and clock checks (one minute at 10fps). */
const CLOCK_CHECK_FRAMES = 600;
/** Ticks between looks for a box or something to knock over. */
const ERRAND_CHECK_FRAMES = 50;
const ERRAND_CHANCE = 0.25;
const ERRAND_REST_FRAMES = 300;
const BOX_NAP_FRAMES = 150;
const KNOCK_STARE_FRAMES = 12;
const KNOCKED_DOWN_MS = 5000;
/** Release speed in CSS pixels per millisecond. */
const MAX_TOSS_SPEED = 3;
const HARD_TOSS_SPEED = 1.6;
const TYPING_TARGETS =
  "a,button,input,select,textarea,label,summary,[role='button'],[contenteditable]";

/** Show a bubble now, when automatic bubbles are allowed. */
function speak(deps: CatAnimationDeps, pool: readonly string[]) {
  const s = deps.stateRef.current;
  if (!s.bubbleEnabledCfg) return;
  s.bubbleVisible = true;
  s.bubbleTimer = s.bubbleDisplayFramesCfg;
  s.bubbleCooldown = 0;
  deps.bubbleTextEl.textContent = pickFromPool(deps, pool);
  deps.bubbleEl.style.opacity = "1";
}

function bumpAffection(s: CatRuntimeState): number {
  s.affection = Math.min(MAX_AFFECTION, s.affection + 1);
  if (s.affectionCfg) writeAffection(s.affectionKey, s.affection);
  return s.affection;
}

/** Wake the cat from whatever it was doing, so a reaction reads clearly. */
function rouse(s: CatRuntimeState) {
  s.typingNap = false;
  s.freerunMode = false;
  s.idleAnimation = null;
  s.idleAnimationFrame = 0;
  s.idleTime = Math.max(s.idleTime, 1);
}

/** Pet the cat: a purr, a bubble, and a little more affection. */
export function petCat(deps: CatAnimationDeps): void {
  const s = deps.stateRef.current;
  rouse(s);
  const affection = bumpAffection(s);
  speak(deps, s.affectionCfg && affectionTier(affection) >= 2 ? FOND_PET_MESSAGES : PET_MESSAGES);
  playSound(deps, PET_SOUND_POOL);
  s.handlers.onPet?.({ affection });
}

const knocked = new Map<Element, Animation>();

/** Push an element off its shelf. It lies at the bottom of the screen for a while, then returns. */
function knockOver(el: Element, direction: 1 | -1) {
  if (knocked.has(el) || !(el instanceof HTMLElement || el instanceof SVGElement)) return;
  const rect = el.getBoundingClientRect();
  const fall = Math.max(0, window.innerHeight - rect.bottom - 4);
  const animation = el.animate(
    [
      { transform: "none", offset: 0 },
      {
        transform: `translateX(${direction * 6}px) rotate(${direction * 12}deg)`,
        offset: 0.25,
      },
      {
        transform: `translate(${direction * 48}px, ${fall}px) rotate(${direction * 100}deg)`,
        offset: 1,
      },
    ],
    {
      duration: 700,
      easing: "cubic-bezier(0.5, 0, 0.9, 0.6)",
      fill: "forwards",
    },
  );
  knocked.set(el, animation);
  setTimeout(() => {
    // A hooman tidied up.
    animation.playbackRate = 2;
    animation.reverse();
    animation.finished.then(
      () => {
        animation.cancel();
        knocked.delete(el);
      },
      () => knocked.delete(el),
    );
  }, KNOCKED_DOWN_MS);
}

/** Put every knocked-over element back, for when the last cat leaves. */
export function restoreKnocked(): void {
  for (const animation of knocked.values()) animation.cancel();
  knocked.clear();
}

function isVisible(el: Element) {
  const rect = el.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

const handledEvents = new WeakSet<Event>();

/** True when a viewport point is on a run of text rather than empty space. */
function isOverText(x: number, y: number): boolean {
  const node = document.caretRangeFromPoint?.(x, y)?.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return false;
  const range = document.createRange();
  range.selectNodeContents(node);
  return [...range.getClientRects()].some(
    (rect) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom,
  );
}

export function createPlay(deps: CatAnimationDeps) {
  const s = () => deps.stateRef.current;
  const { el } = deps;
  let seasonKey = "";
  let seasonCheckedFrame = -Infinity;
  let grabbable: boolean | null = null;
  let flight = 0;
  let sayTarget: Element | null = null;
  let sayTimer: ReturnType<typeof setTimeout> | undefined;
  /** Treats this cat could not reach, for example behind a keep-out zone. */
  const unreachable = new WeakSet<Treat>();

  const wearHat = () => {
    const state = s();
    const key = String(state.seasonalCfg);
    if (key === seasonKey && state.frameCount - seasonCheckedFrame < CLOCK_CHECK_FRAMES) return;
    seasonKey = key;
    seasonCheckedFrame = state.frameCount;
    const season = resolveSeason(state.seasonalCfg);
    if (season === state.season && (deps.hat || !season)) return;
    state.season = season;
    deps.hat?.remove();
    deps.hat = undefined;
    if (!season) return;
    const hat = document.createElement("div");
    hat.setAttribute("data-oneko-hat", season);
    hat.style.cssText = `position:absolute;left:0;top:0;width:${HAT_WIDTH}px;height:${HAT_HEIGHT}px;pointer-events:none;display:none`;
    hat.innerHTML = hatSVG(season);
    el.appendChild(hat);
    deps.hat = hat;
  };

  const readClock = () => {
    const state = s();
    if (!state.timeOfDayCfg) {
      state.mood = NEUTRAL_MOOD;
      state.moodCheckedFrame = -Infinity;
    } else if (state.frameCount - state.moodCheckedFrame >= CLOCK_CHECK_FRAMES) {
      state.mood = moodForHour(new Date().getHours());
      state.moodCheckedFrame = state.frameCount;
    }
  };

  const greet = () => {
    const state = s();
    if (!state.affectionCfg) {
      state.affectionLoaded = false;
      return;
    }
    if (state.affectionLoaded) return;
    state.affectionLoaded = true;
    const saved = readAffection(state.affectionKey);
    state.affection = Math.max(state.affection, saved?.affection ?? 0);
    const greeting = greetingFor(saved);
    writeAffection(state.affectionKey, state.affection);
    if (greeting && state.bubbleEnabledCfg)
      state.sayRequest = {
        text: greeting,
        frames: state.bubbleDisplayFramesCfg,
      };
  };

  const syncGrabbable = () => {
    const on = s().grabbableCfg;
    if (on === grabbable) return;
    grabbable = on;
    el.style.pointerEvents = on ? "auto" : "none";
    el.style.cursor = on ? "grab" : "";
    el.style.touchAction = on ? "none" : "";
    if (!on) el.removeAttribute("title");
    else if (!el.hasAttribute("aria-label")) el.title = "Drag to toss, click to pet";
  };

  /** Look for a treat to eat, or now and then a box to sit in or something to knock over. */
  const chooseErrand = () => {
    const state = s();
    if (state.grab || !state.followCursorCfg || state.typingNap || state.held) return;
    const current = state.errand?.kind;
    if (current === "goTo" || current === "sit") return;
    const treat = nearestTreat(state.nekoPosX, state.nekoPosY, (item) => unreachable.has(item));
    if (treat && current !== "treat") {
      rouse(state);
      state.errand = { kind: "treat", treat, frames: 0 };
      return;
    }
    if (state.errand || state.laserPointerCfg || state.perchTarget || state.zoneState.targetId)
      return;
    if (--state.errandCooldown > 0) return;
    state.errandCooldown = ERRAND_CHECK_FRAMES;
    if (state.idleTime === 0 || Math.random() >= ERRAND_CHANCE) return;
    const size = TILE * state.scale;
    const boxes = [...document.querySelectorAll("[data-oneko-box]")].filter((box) => {
      const rect = box.getBoundingClientRect();
      return isVisible(box) && rect.width >= size * 0.75 && rect.height >= size * 0.5;
    });
    const knockables = [...document.querySelectorAll("[data-oneko-knockable]")].filter(
      (item) => isVisible(item) && !knocked.has(item),
    );
    const pick = [...boxes, ...knockables][
      Math.floor(Math.random() * (boxes.length + knockables.length))
    ];
    if (!pick) return;
    if (boxes.includes(pick)) {
      state.errand = { kind: "box", el: pick, frames: 0, arrived: false };
    } else {
      const rect = pick.getBoundingClientRect();
      state.errand = {
        kind: "knock",
        el: pick,
        frames: 0,
        phase: "approach",
        // Approach from the side the cat is already on, then push the other way.
        direction: state.nekoPosX <= rect.left + rect.width / 2 ? 1 : -1,
      };
    }
  };

  /** Per-tick upkeep before the movement target is chosen. */
  const upkeep = () => {
    const state = s();
    wearHat();
    readClock();
    greet();
    syncGrabbable();
    if (state.petRequest) {
      state.petRequest = false;
      petCat(deps);
    }
    chooseErrand();
  };

  const endErrand = (cooldown = 0) => {
    const state = s();
    state.errand = null;
    if (cooldown) state.errandCooldown = cooldown;
  };

  /** Arrivals and timeouts for the current errand, after the cat has moved. */
  const tickErrand = () => {
    const state = s();
    const errand = state.errand;
    const chasingCursor =
      !errand &&
      state.followCursorCfg &&
      !state.typingNap &&
      !state.held &&
      !state.perchTarget &&
      !state.leaderTarget &&
      !state.zoneState.targetId;
    const toCursor = Math.hypot(state.mousePosX - state.nekoPosX, state.mousePosY - state.nekoPosY);
    if (!chasingCursor) state.chasingFar = false;
    else if (toCursor > 160 && state.idleTime === 0) state.chasingFar = true;
    else if (state.chasingFar && state.idleTime > 0) {
      state.chasingFar = false;
      state.handlers.onCatchCursor?.();
    }

    if (!errand || errand.kind === "sit") return;
    const point = errandPoint(state, errand);
    if (!point) {
      if (errand.kind === "goTo") errand.resolve?.(false);
      endErrand();
      return;
    }
    const distance = Math.hypot(point.x - state.nekoPosX, point.y - state.nekoPosY);
    // Close enough, or stopped as near as the path allows.
    const arrived = distance < 14 || (state.idleTime > 2 && distance < 64);
    switch (errand.kind) {
      case "goTo":
        if (!errand.arrived && (arrived || (state.idleTime > 2 && ++errand.frames > 30))) {
          errand.arrived = true;
          errand.resolve?.(true);
          errand.resolve = undefined;
        }
        return;
      case "treat":
        if (arrived) {
          if (eatTreat(errand.treat)) {
            const affection = bumpAffection(state);
            speak(deps, TREAT_MESSAGES);
            playSound(deps, LASER_CATCH_POOL);
            state.handlers.onTreat?.({ affection });
          }
          endErrand();
        } else if (++errand.frames > 300 || state.idleTime > 20) {
          // Resting short of the treat means the way is blocked; leave it for another cat.
          unreachable.add(errand.treat);
          endErrand();
        }
        return;
      case "box":
        if (!errand.arrived) {
          if (arrived) {
            errand.arrived = true;
            errand.frames = 0;
            speak(deps, BOX_MESSAGES);
            if (state.sleepEnabledCfg) {
              state.idleAnimation = "sleeping";
              state.idleAnimationFrame = 0;
            }
          } else if (++errand.frames > 100) endErrand(ERRAND_REST_FRAMES);
        } else if (++errand.frames > BOX_NAP_FRAMES) endErrand(ERRAND_REST_FRAMES);
        return;
      case "knock":
        if (errand.phase === "approach") {
          if (arrived) {
            errand.phase = "stare";
            errand.frames = 0;
            rouse(state);
            speak(deps, KNOCK_STARE_MESSAGES);
          } else if (++errand.frames > 100) endErrand(ERRAND_REST_FRAMES);
          return;
        }
        // Stare at the visitor, then paw the thing off its shelf.
        setSprite(
          deps,
          ++errand.frames >= KNOCK_STARE_FRAMES ? (errand.direction === 1 ? "E" : "W") : "idle",
          errand.frames,
        );
        if (errand.frames >= KNOCK_STARE_FRAMES) {
          knockOver(errand.el, errand.direction);
          speak(deps, KNOCK_MESSAGES);
          playSound(deps, HISS_POOL);
          endErrand(ERRAND_REST_FRAMES);
        }
        return;
    }
  };

  const place = (x: number, y: number) => {
    const state = s();
    state.nekoPosX = x;
    state.nekoPosY = y;
    el.style.left = `${Math.floor(x - TILE / 2)}px`;
    el.style.top = `${Math.floor(y - TILE / 2)}px`;
  };

  const land = (hard: boolean) => {
    const state = s();
    cancelAnimationFrame(flight);
    flight = 0;
    state.grab = { phase: "landed", frames: 8 };
    state.nekoVelX = state.nekoVelY = 0;
    state.currentPath = [];
    clearRotation(deps);
    speak(deps, hard ? TOSS_HARD_MESSAGES : TOSS_SOFT_MESSAGES);
    playSound(deps, hard ? HISS_POOL : PET_SOUND_POOL);
  };

  /** Flight runs on animation frames so a toss looks smooth; the cat walks at 10fps. */
  const fly = (vx: number, vy: number, hard: boolean) => {
    let last = performance.now();
    let spin = 0;
    const step = (now: number) => {
      const state = s();
      if (state.grab?.phase !== "flying") return;
      const dt = Math.min(50, now - last);
      last = now;
      if (state.pausedCfg) {
        flight = requestAnimationFrame(step);
        return;
      }
      const from = { x: state.nekoPosX, y: state.nekoPosY };
      let x = from.x + vx * dt;
      let y = from.y + vy * dt;
      const maxX = window.innerWidth - 16;
      const maxY = window.innerHeight - 16;
      if (x < 16 || x > maxX) {
        vx *= -0.5;
        x = Math.max(16, Math.min(maxX, x));
      }
      if (y < 16 || y > maxY) {
        vy *= -0.5;
        y = Math.max(16, Math.min(maxY, y));
      }
      const safe = constrainZoneMovement(from, { x, y }, state.zoneState.blocked);
      if (safe.x !== x || safe.y !== y) vx = vy = 0;
      place(safe.x, safe.y);
      const drag = Math.exp(-dt / 260);
      vx *= drag;
      vy *= drag;
      spin += vx * dt * 0.9;
      el.style.transform = `scale(${state.scale}) rotate(${spin}deg)`;
      if (Math.hypot(vx, vy) < 0.06) land(hard);
      else flight = requestAnimationFrame(step);
    };
    flight = requestAnimationFrame(step);
  };

  /** Runs instead of walking while the cat is carried, flying, or catching its breath. */
  const tickGrab = (): boolean => {
    const state = s();
    const grab = state.grab;
    if (!grab) return false;
    state.idleAnimation = null;
    state.freerunMode = false;
    if (grab.phase === "landed") {
      setSprite(deps, "idle", 0);
      state.idleTime = Math.max(state.idleTime, 1);
      if (--grab.frames <= 0) state.grab = null;
      return true;
    }
    setSprite(deps, "alert", 0);
    state.idleTime = 0;
    return true;
  };

  const onPointerDown = (event: PointerEvent) => {
    const state = s();
    if (!state.grabbableCfg || event.button > 0 || state.pausedCfg) return;
    event.preventDefault();
    el.setPointerCapture?.(event.pointerId);
    cancelAnimationFrame(flight);
    rouse(state);
    if (state.errand?.kind === "box" || state.errand?.kind === "knock") endErrand();
    state.grab = {
      phase: "held",
      samples: [{ x: event.clientX, y: event.clientY, t: event.timeStamp }],
      startT: event.timeStamp,
      travel: 0,
    };
    el.style.cursor = "grabbing";
    setSprite(deps, "alert", 0);
    clearRotation(deps);
  };

  const onPointerMove = (event: PointerEvent) => {
    const state = s();
    const grab = state.grab;
    if (grab?.phase !== "held") return;
    const previous = grab.samples.at(-1)!;
    grab.travel += Math.hypot(event.clientX - previous.x, event.clientY - previous.y);
    grab.samples.push({
      x: event.clientX,
      y: event.clientY,
      t: event.timeStamp,
    });
    if (grab.samples.length > 8) grab.samples.shift();
    place(
      Math.max(16, Math.min(window.innerWidth - 16, event.clientX)),
      Math.max(16, Math.min(window.innerHeight - 16, event.clientY)),
    );
    // Let the cat chase from where it was dropped, not from where the pointer was before.
    state.mousePosX = event.clientX;
    state.mousePosY = event.clientY;
    if (grab.travel > 40 && !state.bubbleVisible && Math.random() < 0.02)
      speak(deps, HELD_MESSAGES);
  };

  const onPointerUp = (event: PointerEvent) => {
    const state = s();
    const grab = state.grab;
    if (grab?.phase !== "held") return;
    el.style.cursor = "grab";
    if (grab.travel < 6 && event.timeStamp - grab.startT < 500) {
      state.grab = null;
      petCat(deps);
      return;
    }
    const recent = grab.samples.filter((sample) => event.timeStamp - sample.t < 100);
    const first = recent[0] ?? grab.samples.at(-1)!;
    const elapsed = Math.max(16, event.timeStamp - first.t);
    let vx = (event.clientX - first.x) / elapsed;
    let vy = (event.clientY - first.y) / elapsed;
    const speed = Math.hypot(vx, vy);
    if (speed > MAX_TOSS_SPEED) {
      vx = (vx / speed) * MAX_TOSS_SPEED;
      vy = (vy / speed) * MAX_TOSS_SPEED;
    }
    if (speed < 0.25) {
      land(false);
      return;
    }
    const hard = speed > HARD_TOSS_SPEED;
    state.grab = { phase: "flying", vx, vy, spin: 0, hard };
    state.handlers.onToss?.({
      speed: Math.round(Math.min(speed, MAX_TOSS_SPEED) * 1000),
    });
    fly(vx, vy, hard);
  };

  const onPointerCancel = () => {
    if (s().grab?.phase === "held") land(false);
  };

  const onDoubleClick = (event: MouseEvent) => {
    const state = s();
    if (!state.treatsCfg || handledEvents.has(event)) return;
    if (event.target instanceof Element && event.target.closest(TYPING_TARGETS)) return;
    // Double-clicking text selects a word; leave reading alone.
    if (window.getSelection()?.toString().trim() || isOverText(event.clientX, event.clientY))
      return;
    const point = { x: event.clientX, y: event.clientY };
    if (state.zoneState.blocked.some((rect) => containsPoint(rect, point))) return;
    handledEvents.add(event);
    dropTreat(point.x, point.y, state.zIndex);
  };

  const requestSay = (target: Element) => {
    const state = s();
    const text = target.getAttribute("data-oneko-say")?.trim();
    if (!text || !state.bubbleEnabledCfg || state.pausedCfg) return;
    const rect = target.getBoundingClientRect();
    if (
      !isNearestCat(state, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    )
      return;
    state.sayRequest = {
      text: text.slice(0, 200),
      frames: state.bubbleDisplayFramesCfg,
    };
  };

  const onMouseOver = (event: MouseEvent) => {
    const target =
      event.target instanceof Element ? event.target.closest("[data-oneko-say]") : null;
    if (target === sayTarget) return;
    sayTarget = target;
    clearTimeout(sayTimer);
    if (target) sayTimer = setTimeout(() => requestSay(target), 350);
  };

  const onFocusIn = (event: FocusEvent) => {
    const target =
      event.target instanceof Element ? event.target.closest("[data-oneko-say]") : null;
    if (target) requestSay(target);
  };

  syncGrabbable();
  el.addEventListener("pointerdown", onPointerDown);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerup", onPointerUp);
  el.addEventListener("pointercancel", onPointerCancel);
  document.addEventListener("dblclick", onDoubleClick);
  document.addEventListener("mouseover", onMouseOver);
  document.addEventListener("focusin", onFocusIn);

  const dispose = () => {
    const state = s();
    cancelAnimationFrame(flight);
    clearTimeout(sayTimer);
    el.removeEventListener("pointerdown", onPointerDown);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerup", onPointerUp);
    el.removeEventListener("pointercancel", onPointerCancel);
    document.removeEventListener("dblclick", onDoubleClick);
    document.removeEventListener("mouseover", onMouseOver);
    document.removeEventListener("focusin", onFocusIn);
    if (state.affectionCfg && state.affectionLoaded)
      writeAffection(state.affectionKey, state.affection);
    // A remount starts fresh; requests made through the API are told they will not finish.
    if (state.errand?.kind === "goTo") state.errand.resolve?.(false);
    state.errand = null;
    state.grab = null;
    state.season = null;
    deps.hat?.remove();
    deps.hat = undefined;
  };

  return { upkeep, tickGrab, tickErrand, dispose };
}

export type CatPlay = ReturnType<typeof createPlay>;
