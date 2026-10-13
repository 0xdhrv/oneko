/** Shared hooks the framework specs drive: change props, unmount, and read reported states. */
export interface Harness {
  setSkin(skin: string | undefined): void;
  unmount(): void;
  states: string[];
}

export const initialProps = { skin: "ginger", persistPosition: false };

export function expose(harness: Omit<Harness, "states">, states: string[]) {
  (window as unknown as { harness: Harness }).harness = { ...harness, states };
}
