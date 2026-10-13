<!--
  Oneko for Vue 3 and Nuxt: https://oneko.dhrv.pw/docs#frameworks
  Takes the same options as the React component, e.g. <Oneko skin="calico" meow />,
  and emits state-change. The engine loads from the hosted build in the browser,
  so it is safe to render during SSR.
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, watch, type PropType } from "vue";

type OnekoInstance = { update(options: object): void; destroy(): void };

const ONEKO_URL = "https://oneko.dhrv.pw/oneko.js";

// Booleans default to undefined, not false, so Oneko's own defaults apply.
const props = defineProps({
  skin: String,
  spriteSrc: String,
  scale: Number,
  opacity: Number,
  hueRotate: Number,
  rotationAmount: Number,
  speed: Number,
  followDistance: Number,
  animationSpeed: Number,
  idleThreshold: Number,
  freerunChance: Number,
  freerunDuration: Number,
  paused: { type: Boolean, default: undefined },
  followCursor: { type: Boolean, default: undefined },
  sleepEnabled: { type: Boolean, default: undefined },
  laserPointer: { type: Boolean, default: undefined },
  reducedMotion: String as PropType<"hide" | "rest">,
  bubbleEnabled: { type: Boolean, default: undefined },
  bubbleText: [String, Array] as PropType<string | string[]>,
  bubblePlacement: String as PropType<"auto" | "above" | "below">,
  bubbleScale: Number,
  bubbleChance: Number,
  bubbleDisplayFrames: Number,
  bubbleCooldown: Number,
  meow: { type: Boolean, default: undefined },
  volume: Number,
  soundBasePath: String,
  zones: Array as PropType<object[]>,
  zoneAttractionChance: Number,
  zoneAttractionDuration: Number,
  persistPosition: { type: Boolean, default: undefined },
  storageKey: String,
  initialPos: Object as PropType<{ x: number; y: number }>,
  zIndex: Number,
  chase: String as PropType<"cursor" | "cat">,
  napWhileTyping: { type: Boolean, default: undefined },
  followFocus: { type: Boolean, default: undefined },
  perchOnHover: { type: Boolean, default: undefined },
  pettable: { type: Boolean, default: undefined },
});
const emit = defineEmits<{ stateChange: [state: string] }>();

const cat = shallowRef<OnekoInstance>();
let mounted = false;
const options = () => ({
  ...props,
  onStateChange: (state: string) => emit("stateChange", state),
});

onMounted(async () => {
  mounted = true;
  const { createOneko } = await import(/* @vite-ignore */ ONEKO_URL);
  if (mounted) cat.value = createOneko(options());
});

watch(
  () => ({ ...props }),
  () => cat.value?.update(options()),
);

onBeforeUnmount(() => {
  mounted = false;
  cat.value?.destroy();
});
</script>

<template>
  <!-- The cat mounts itself on document.body. -->
</template>
