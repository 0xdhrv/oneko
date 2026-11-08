import { createOneko, type OnekoInstance, type OnekoOptions } from "./vanilla";

/**
 * Mount a cat with its first props, so construction-time options (initialPos, storageKey,
 * persistPosition) apply from the start. The returned update treats removed props as undefined,
 * which returns them to the engine defaults.
 */
export function mountWithProps(initial: OnekoOptions) {
  const cat: OnekoInstance = createOneko(initial);
  let previous: OnekoOptions = initial;
  const update = (next: OnekoOptions) => {
    const reset = Object.fromEntries(Object.keys(previous).map((key) => [key, undefined]));
    cat.update({ ...reset, ...next });
    previous = next;
  };
  return { cat, update };
}
