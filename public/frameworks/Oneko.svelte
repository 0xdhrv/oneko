<!--
  Oneko for Svelte 5 and SvelteKit: https://oneko.dhrv.pw/docs#frameworks
  Takes the same options as the React component, e.g. <Oneko skin="calico" meow />.
  The engine loads from the hosted build in the browser, so it is safe to render during SSR.
-->
<script lang="ts">
  import { onMount } from "svelte";

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
  const props: Record<string, unknown> = $props();
  let cat = $state.raw<OnekoInstance>();

  // bind:this gives the controls: cat.goTo("#pricing"), cat.say("hi").
  export const goTo: OnekoControls["goTo"] = (target) => cat?.goTo(target) ?? Promise.resolve(false);
  export const say: OnekoControls["say"] = (text, options) => cat?.say(text, options);
  export const sit = () => cat?.sit();
  export const follow = () => cat?.follow();
  export const pet = () => cat?.pet();
  export const dropTreat: OnekoControls["dropTreat"] = (x, y) => cat?.dropTreat(x, y);

  onMount(() => {
    let mounted = true;
    import(/* @vite-ignore */ ONEKO_URL).then(({ createOneko }) => {
      if (mounted) cat = createOneko({ ...props });
    });
    return () => {
      mounted = false;
      cat?.destroy();
    };
  });

  $effect(() => {
    const options = { ...props };
    cat?.update(options);
  });
</script>
