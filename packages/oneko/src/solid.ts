import { createEffect, onCleanup, onMount } from "solid-js";
import { createOneko, type OnekoOptions } from "./vanilla";
import { createPropsUpdater } from "./adapter";

export default function Oneko(props: OnekoOptions) {
  let update: ReturnType<typeof createPropsUpdater> | undefined;
  onMount(() => {
    const cat = createOneko();
    update = createPropsUpdater(cat);
    update({ ...props });
    onCleanup(() => cat.destroy());
  });
  createEffect(() => update?.({ ...props }));
  return null;
}

export type { OnekoOptions } from "./vanilla";
