import { createApp, h, ref } from "vue";
import Oneko from "../../../../public/frameworks/Oneko.vue";
import { expose, initialProps } from "./harness";

const states: string[] = [];
const skin = ref<string | undefined>(initialProps.skin);
const app = createApp({
  render: () =>
    h(Oneko, {
      ...initialProps,
      skin: skin.value,
      onStateChange: (state: string) => states.push(state),
    }),
});
app.mount("#app");
expose({ setSkin: (next) => (skin.value = next), unmount: () => app.unmount() }, states);
