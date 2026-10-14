<script lang="ts">
  import { onMount } from "svelte";
  import { createOneko, type OnekoOptions } from "./vanilla";
  import { createPropsUpdater } from "./adapter";

  const props: OnekoOptions = $props();
  let update = $state.raw<ReturnType<typeof createPropsUpdater>>();

  onMount(() => {
    const cat = createOneko();
    update = createPropsUpdater(cat);
    update({ ...props });
    return () => cat.destroy();
  });

  $effect(() => update?.({ ...props }));
</script>
