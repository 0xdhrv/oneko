<script lang="ts">
  import { onMount } from "svelte";
  import type { OnekoControls, OnekoInstance, OnekoOptions } from "./vanilla";
  import { mountWithProps } from "./adapter";

  const props: OnekoOptions = $props();
  let update = $state.raw<ReturnType<typeof mountWithProps>["update"]>();
  let cat: OnekoInstance | undefined;

  // bind:this gives the controls: cat.goTo("#pricing"), cat.say("hi").
  export const goTo: OnekoControls["goTo"] = (target) => cat?.goTo(target) ?? Promise.resolve(false);
  export const say: OnekoControls["say"] = (text, options) => cat?.say(text, options);
  export const sit = () => cat?.sit();
  export const follow = () => cat?.follow();
  export const pet = () => cat?.pet();
  export const dropTreat: OnekoControls["dropTreat"] = (x, y) => cat?.dropTreat(x, y);

  onMount(() => {
    const mounted = mountWithProps({ ...props });
    cat = mounted.cat;
    update = mounted.update;
    return () => mounted.cat.destroy();
  });

  $effect(() => update?.({ ...props }));
</script>
