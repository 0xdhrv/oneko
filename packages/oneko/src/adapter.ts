import type { OnekoInstance, OnekoOptions } from "./vanilla";

/** Removed props return to engine defaults, just like a prop explicitly set to undefined. */
export function createPropsUpdater(cat: OnekoInstance) {
  let previous: OnekoOptions = {};
  return (next: OnekoOptions) => {
    const reset = Object.fromEntries(Object.keys(previous).map((key) => [key, undefined]));
    cat.update({ ...reset, ...next });
    previous = next;
  };
}
