/**
 * Oneko for Solid and SolidStart: https://oneko.dhrv.pw/docs#frameworks
 * Takes the same options as the React component, e.g. <Oneko skin="calico" meow />.
 * Pass ref={(controls) => ...} to get goTo, say, sit, follow, pet, and dropTreat.
 * The engine loads from the hosted build in the browser, so it is safe to render during SSR.
 */
import { createEffect, onCleanup, onMount } from "solid-js";

type OnekoControls = {
  goTo(target: Element | string | { x: number; y: number }): Promise<boolean>;
  say(text: string, options?: { duration?: number }): void;
  sit(): void;
  follow(): void;
  pet(): void;
  dropTreat(x?: number, y?: number): void;
};
type OnekoInstance = OnekoControls & { update(options: object): void; destroy(): void };

const ONEKO_URL = "https://oneko.dhrv.pw/oneko.js";

export default function Oneko(
  props: Record<string, unknown> & { ref?: (controls: OnekoControls) => void },
) {
  let cat: OnekoInstance | undefined;
  let mounted = true;
  // Spreading reads every prop, so the effect below reruns when any of them changes.
  const options = () => {
    const { ref: _ref, ...rest } = props;
    return rest;
  };

  onMount(() => {
    import(/* @vite-ignore */ ONEKO_URL).then(({ createOneko }) => {
      if (!mounted) return;
      const created: OnekoInstance = createOneko(options());
      cat = created;
      props.ref?.(created);
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
