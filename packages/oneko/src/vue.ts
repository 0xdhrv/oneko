import { defineComponent, onBeforeUnmount, onMounted, watch, type PropType } from "vue";
import { createOneko, type OnekoOptions, type CatActivityState } from "./vanilla";
import { createPropsUpdater } from "./adapter";

export default defineComponent({
  name: "Oneko",
  props: {
    skin: String as PropType<OnekoOptions["skin"]>,
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
    zones: Array as PropType<OnekoOptions["zones"]>,
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
  },
  emits: { stateChange: (_state: CatActivityState) => true },
  setup(props, { emit }) {
    let update: ReturnType<typeof createPropsUpdater> | undefined;
    let destroy: (() => void) | undefined;
    const options = () => ({
      ...props,
      onStateChange: (state: CatActivityState) => emit("stateChange", state),
    });
    onMounted(() => {
      const cat = createOneko();
      destroy = () => cat.destroy();
      update = createPropsUpdater(cat);
      update(options());
    });
    watch(
      () => ({ ...props }),
      () => update?.(options()),
    );
    onBeforeUnmount(() => destroy?.());
    return () => null;
  },
});

export type { OnekoOptions } from "./vanilla";
