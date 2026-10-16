import { createEffect, onCleanup, onMount } from "solid-js";
import { createOneko, type OnekoControls, type OnekoOptions } from "./vanilla";
import { createPropsUpdater } from "./adapter";

/** Pass ref={(controls) => ...} to get goTo, say, sit, follow, pet, and dropTreat. */
export default function Oneko(props: OnekoOptions & { ref?: (controls: OnekoControls) => void }) {
  let update: ReturnType<typeof createPropsUpdater> | undefined;
  const options = () => {
    const { ref: _ref, ...rest } = props;
    return rest;
  };
  onMount(() => {
    const cat = createOneko();
    update = createPropsUpdater(cat);
    update(options());
    props.ref?.(cat);
    onCleanup(() => cat.destroy());
  });
  createEffect(() => update?.(options()));
  return null;
}

export type { OnekoOptions } from "./vanilla";
