/** Reactive props for mounting a Svelte 5 component from plain TypeScript. */
export function createProps<T extends Record<string, unknown>>(initial: T): T {
  const props = $state(initial);
  return props;
}
