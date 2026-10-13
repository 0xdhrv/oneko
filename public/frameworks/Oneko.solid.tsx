/**
 * Oneko for Solid and SolidStart: https://oneko.dhrv.pw/docs#frameworks
 * Takes the same options as the React component, e.g. <Oneko skin="calico" meow />.
 * The engine loads from the hosted build in the browser, so it is safe to render during SSR.
 */
import { createEffect, onCleanup, onMount } from "solid-js";

type OnekoInstance = { update(options: object): void; destroy(): void };

const ONEKO_URL = "https://oneko.dhrv.pw/oneko.js";

export default function Oneko(props: Record<string, unknown>) {
  let cat: OnekoInstance | undefined;
  let mounted = true;
  // Spreading reads every prop, so the effect below reruns when any of them changes.
  const options = () => ({ ...props });

  onMount(() => {
    import(/* @vite-ignore */ ONEKO_URL).then(({ createOneko }) => {
      if (mounted) cat = createOneko(options());
    });
  });

  createEffect(() => {
    const next = options();
    cat?.update(next);
  });

  onCleanup(() => {
    mounted = false;
    cat?.destroy();
  });

  // The cat mounts itself on document.body.
  return null;
}
