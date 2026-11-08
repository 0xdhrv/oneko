import { createEffect, onCleanup, onMount } from "solid-js";
import type { OnekoControls, OnekoOptions } from "./vanilla";
import { mountWithProps } from "./adapter";

/** Pass ref={(controls) => ...} to get goTo, say, sit, follow, pet, and dropTreat. */
export default function Oneko(props: OnekoOptions & { ref?: (controls: OnekoControls) => void }) {
  let update: ReturnType<typeof mountWithProps>["update"] | undefined;
  const options = () => {
    const { ref: _ref, ...rest } = props;
    return rest;
  };
  onMount(() => {
    const { cat, update: next } = mountWithProps(options());
    update = next;
    props.ref?.(cat);
    onCleanup(() => cat.destroy());
  });
  createEffect(() => update?.(options()));
  return null;
}

export type { OnekoOptions } from "./vanilla";
