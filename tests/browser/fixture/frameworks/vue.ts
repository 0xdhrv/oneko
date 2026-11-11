import { createApp, h, ref } from "vue";
import Oneko from "../../../../public/frameworks/Oneko.vue";
import { expose, initialProps } from "./harness";

const states: string[] = [];
const skin = ref<string | undefined>(initialProps.skin);
const cat = ref<{ say(text: string): void }>();
const app = createApp({
  render: () =>
    h(Oneko, {
      ...initialProps,
      skin: skin.value,
      ref: cat,
      onStateChange: (state: string) => states.push(state),
    }),
});
app.mount("#app");
expose(
  {
    setSkin: (next) => (skin.value = next),
    unmount: () => app.unmount(),
    say: (text) => cat.value?.say(text),
  },
  states,
);
