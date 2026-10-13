<!--
  Oneko for Svelte 5 and SvelteKit: https://oneko.dhrv.pw/docs#frameworks
  Takes the same options as the React component, e.g. <Oneko skin="calico" meow />.
  The engine loads from the hosted build in the browser, so it is safe to render during SSR.
-->
<script lang="ts">
  import { onMount } from "svelte";

  type OnekoInstance = { update(options: object): void; destroy(): void };

  const ONEKO_URL = "https://oneko.dhrv.pw/oneko.js";
  const props: Record<string, unknown> = $props();
  let cat = $state.raw<OnekoInstance>();

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
