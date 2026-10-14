# oneko

A tiny pixel cat that follows the pointer, naps when things are quiet, and shares cat-themed
thoughts. The engine and all 24 coats ship in the package, so nothing loads from a CDN.

[Playground](https://oneko.dhrv.pw) · [Studio](https://oneko.dhrv.pw/studio) ·
[Documentation](https://oneko.dhrv.pw/docs)

```bash
npm install oneko
```

Every entry mounts one cat on `document.body` and takes the same options. See the
[prop reference](https://oneko.dhrv.pw/docs#props).

## React

```tsx
import Oneko from "oneko";

export function CatLayer() {
  return <Oneko skin="calico" bubbleText="treat inspection in progress" />;
}
```

The entry is marked `"use client"`, so Next.js App Router can import it from a server component.

## Vue

```vue
<script setup>
import Oneko from "oneko/vue";
</script>

<template>
  <Oneko skin="calico" :speed="12" @state-change="console.log" />
</template>
```

## Svelte 5

```svelte
<script>
  import Oneko from "oneko/svelte";
</script>

<Oneko skin="calico" />
```

## Solid

```tsx
import Oneko from "oneko/solid";

export default function App() {
  return <Oneko skin="calico" />;
}
```

## Without a framework

```ts
import { createOneko } from "oneko/vanilla";

const cat = createOneko({ skin: "tuxedo" });
cat.update({ scale: 2 });
cat.destroy();
```

Importing any entry during SSR has no DOM side effects. The cat mounts in the browser.

## Skins

`ONEKO_SKINS` lists the 24 coats with names and descriptions. The classic coat is inline; the
others load in one chunk the first time a non-classic coat is used. Pass `spriteSrc` for your own
256 × 128 sprite sheet.

## Sounds

Meows are off by default. The sound files ship in `oneko/cat-sounds/`. Copy them to a folder your
site serves and point `soundBasePath` at it:

```bash
cp -r node_modules/oneko/dist/cat-sounds public/cat-sounds
```

```tsx
<Oneko meow soundBasePath="/cat-sounds" />
```

## Hide toggle

`setCatsHidden(true)` hides every cat and remembers the choice. `areCatsHidden()` and
`onCatsHiddenChange()` let you build your own toggle.

## License

MIT. The sprite artwork belongs to its original creators; see `SKIN-CREDITS.md`.
