/**
 * Hosted script entry (public/oneko.js). Three ways to use it:
 *   <script type="module" src="https://oneko.dhrv.pw/oneko.js" data-skin="calico"></script>
 *   <oneko-cat skin="calico" meow></oneko-cat>
 *   import { createOneko } from "https://oneko.dhrv.pw/oneko.js";
 * Any element with data-oneko-toggle hides or shows every cat, and the choice is remembered.
 */
import { ONEKO_DEFAULTS } from "./defaults";
import { isOnekoSeason } from "./seasons";
import { areCatsHidden, onCatsHiddenChange, setCatsHidden } from "./pack";
import { createOneko as createCat, type OnekoInstance, type OnekoOptions } from "./vanilla";

export type { OnekoControls } from "./controls";
export type { OnekoInstance, OnekoOptions };
export { areCatsHidden, setCatsHidden };

// Sounds sit next to the hosted script, so meow works without copying files.
const HOSTED_DEFAULTS: OnekoOptions = {
  soundBasePath: new URL(/* @vite-ignore */ "./cat-sounds", import.meta.url).href,
};

/** Mount a cat. Options passed as undefined, now or in update(), use the defaults. */
export function createOneko(options: OnekoOptions = {}): OnekoInstance {
  return createCat(options, HOSTED_DEFAULTS);
}

const OPTION_KEYS = [...Object.keys(ONEKO_DEFAULTS), "spriteSrc"] as (keyof OnekoOptions)[];
const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** Read options from attributes; types follow the defaults. Thoughts split on "|". */
export function readOptions(get: (name: string) => string | null): OnekoOptions {
  const options: Record<string, unknown> = {};
  for (const key of OPTION_KEYS) {
    const raw = get(kebab(key));
    if (raw === null) continue;
    const fallback = ONEKO_DEFAULTS[key as keyof typeof ONEKO_DEFAULTS];
    if (key === "seasonal" && isOnekoSeason(raw)) options[key] = raw;
    else if (typeof fallback === "boolean") options[key] = raw !== "false";
    else if (typeof fallback === "number") {
      const value = Number(raw);
      if (raw.trim() !== "" && Number.isFinite(value)) options[key] = value;
    } else if (key === "bubbleText") options[key] = raw.includes("|") ? raw.split("|") : raw;
    else options[key] = raw;
  }
  return options as OnekoOptions;
}

class OnekoCatElement extends HTMLElement {
  static observedAttributes = OPTION_KEYS.map(kebab);
  #cat: OnekoInstance | undefined;

  #options(): OnekoOptions {
    const emit = (type: string) => (detail?: object) =>
      this.dispatchEvent(new CustomEvent(type, { detail }));
    return {
      ...readOptions((name) => this.getAttribute(name)),
      // Lets frameworks without a wrapper listen with addEventListener("statechange", ...).
      onStateChange: (state) => emit("statechange")({ state }),
      onPet: emit("pet"),
      onCatchCursor: emit("catchcursor"),
      onSleep: emit("sleep"),
      onToss: emit("toss"),
      onTreat: emit("treat"),
    };
  }

  /** Walk to an element, selector, or point; see OnekoControls. Resolves false before connecting. */
  goTo(target: Parameters<OnekoInstance["goTo"]>[0]) {
    return this.#cat?.goTo(target) ?? Promise.resolve(false);
  }

  say(text: string, options?: { duration?: number }) {
    this.#cat?.say(text, options);
  }

  sit() {
    this.#cat?.sit();
  }

  follow() {
    this.#cat?.follow();
  }

  pet() {
    this.#cat?.pet();
  }

  dropTreat(x?: number, y?: number) {
    this.#cat?.dropTreat(x, y);
  }

  connectedCallback() {
    this.#cat ??= createOneko(this.#options());
  }

  disconnectedCallback() {
    this.#cat?.destroy();
    this.#cat = undefined;
  }

  attributeChangedCallback() {
    // Attributes removed since the last update return to their defaults.
    const reset = Object.fromEntries(OPTION_KEYS.map((key) => [key, undefined]));
    this.#cat?.update({ ...reset, ...this.#options() });
  }
}

if (!customElements.get("oneko-cat")) customElements.define("oneko-cat", OnekoCatElement);

// A bare script tag brings one cat, unless the page uses <oneko-cat> or opts out with data-manual.
const script = [...document.querySelectorAll<HTMLScriptElement>("script[src]")].find(
  (tag) => tag.src === import.meta.url,
);
const autoStart = () => {
  if (!script || script.hasAttribute("data-manual") || document.querySelector("oneko-cat")) return;
  createOneko(readOptions((name) => script.getAttribute(`data-${name}`)));
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoStart);
else autoStart();

// <button data-oneko-toggle>Hide cat</button> works without any JavaScript of your own.
const syncToggles = () => {
  for (const toggle of document.querySelectorAll("[data-oneko-toggle]"))
    toggle.setAttribute("aria-pressed", String(areCatsHidden()));
};
document.addEventListener("click", (event) => {
  const toggle = event.target instanceof Element && event.target.closest("[data-oneko-toggle]");
  if (toggle) setCatsHidden(!areCatsHidden());
});
onCatsHiddenChange(syncToggles);
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncToggles);
else syncToggles();
