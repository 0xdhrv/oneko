import { mount, unmount } from "svelte";
import Oneko from "../../../../public/frameworks/Oneko.svelte";
import { createProps } from "./svelte-props.svelte";
import { expose, initialProps } from "./harness";

const states: string[] = [];
const props = createProps<Record<string, unknown>>({
  ...initialProps,
  onStateChange: (state: string) => states.push(state),
});
const app = mount(Oneko, { target: document.getElementById("app")!, props });
expose({ setSkin: (skin) => (props.skin = skin), unmount: () => unmount(app) }, states);
