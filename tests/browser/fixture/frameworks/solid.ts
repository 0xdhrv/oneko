import { createComponent, createSignal } from "solid-js";
import { render } from "solid-js/web";
import Oneko from "../../../../public/frameworks/Oneko.solid";
import { expose, initialProps } from "./harness";

const states: string[] = [];
const [skin, setSkin] = createSignal<string | undefined>(initialProps.skin);
// Equivalent to compiled JSX: <Oneko skin={skin()} persistPosition={false} onStateChange={...} />
const dispose = render(
  () =>
    createComponent(Oneko, {
      get skin() {
        return skin();
      },
      persistPosition: initialProps.persistPosition,
      onStateChange: (state: string) => states.push(state),
    }),
  document.getElementById("app")!,
);
expose({ setSkin: (next) => setSkin(next), unmount: dispose }, states);
