/**
 * Hosted script entry (public/oneko.js). Three ways to use it:
 *   <script type="module" src="https://oneko.dhrv.pw/oneko.js" data-skin="calico"></script>
 *   <oneko-cat skin="calico" meow></oneko-cat>
 *   import { createOneko } from "https://oneko.dhrv.pw/oneko.js";
 */
import { ONEKO_DEFAULTS } from "./defaults";
import { createOneko, type OnekoInstance, type OnekoOptions } from "./vanilla";

export { createOneko };
export type { OnekoInstance, OnekoOptions };

// Sounds sit next to the hosted script, so meow works without copying files.
const HOSTED_DEFAULTS: OnekoOptions = {
  soundBasePath: new URL(/* @vite-ignore */ "./cat-sounds", import.meta.url).href,
};

const OPTION_KEYS = [...Object.keys(ONEKO_DEFAULTS), "spriteSrc"] as (keyof OnekoOptions)[];
const kebab = (key: string) => key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** Read options from attributes; types follow the defaults. Thoughts split on "|". */
export function readOptions(get: (name: string) => string | null): OnekoOptions {
  const options: Record<string, unknown> = {};
  for (const key of OPTION_KEYS) {
    const raw = get(kebab(key));
    if (raw === null) continue;
    const fallback = ONEKO_DEFAULTS[key as keyof typeof ONEKO_DEFAULTS];
    if (typeof fallback === "boolean") options[key] = raw !== "false";
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

  #options() {
    return { ...HOSTED_DEFAULTS, ...readOptions((name) => this.getAttribute(name)) };
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
    this.#cat?.update({ ...ONEKO_DEFAULTS, ...this.#options() });
  }
}

if (!customElements.get("oneko-cat")) customElements.define("oneko-cat", OnekoCatElement);

// A bare script tag brings one cat, unless the page uses <oneko-cat> or opts out with data-manual.
const script = [...document.querySelectorAll<HTMLScriptElement>("script[src]")].find(
  (tag) => tag.src === import.meta.url,
);
const autoStart = () => {
  if (!script || script.hasAttribute("data-manual") || document.querySelector("oneko-cat")) return;
  createOneko({
    ...HOSTED_DEFAULTS,
    ...readOptions((name) => script.getAttribute(`data-${name}`)),
  });
};
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoStart);
else autoStart();
