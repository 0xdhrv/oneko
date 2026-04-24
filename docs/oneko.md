# Oneko Component

`Oneko` is a client-side React component that creates a fixed-position pixel cat on
`document.body`. It returns `null` from React because the sprite, bubble, debug overlay, and optional
laser pointer are managed as DOM elements.

## Basic Usage

```tsx
"use client";

import Oneko from "@/components/oneko";

export function CatLayer() {
  return <Oneko />;
}
```

For SSR-enabled apps, render this from a client-only entry point or lazy-load it after the browser is
available.

## Props

| Prop                  | Type                                | Default         | Description                                      |
| --------------------- | ----------------------------------- | --------------- | ------------------------------------------------ |
| `persistPosition`     | `boolean`                           | `true`          | Store the last cat position in `localStorage`.   |
| `zIndex`              | `number`                            | `2147483646`    | Sprite layer. Set fixed UI above this if needed. |
| `initialPos`          | `{ x: number; y: number }`          | viewport center | Initial cat position.                            |
| `speed`               | `number`                            | `10`            | Movement speed.                                  |
| `scale`               | `number`                            | `1`             | Visual scale for the sprite and bubble.          |
| `opacity`             | `number`                            | `1`             | Sprite opacity.                                  |
| `rotationAmount`      | `number`                            | `15`            | Maximum movement tilt in degrees.                |
| `idleThreshold`       | `number`                            | `1000`          | Idle threshold in milliseconds.                  |
| `meow`                | `boolean`                           | `true`          | Enable optional sound playback.                  |
| `volume`              | `number`                            | `0.5`           | Sound volume from `0` to `1`.                    |
| `onStateChange`       | `(state: CatActivityState) => void` | `undefined`     | Called when the cat changes activity.            |
| `freerunChance`       | `number`                            | `0.06`          | Per-frame chance to free-roam.                   |
| `freerunDuration`     | `number`                            | `40`            | Free-roam duration in frames.                    |
| `bubbleEnabled`       | `boolean`                           | `true`          | Show or hide speech bubbles.                     |
| `bubbleDisplayFrames` | `number`                            | `180`           | Bubble display time in frames.                   |
| `bubbleCooldown`      | `number`                            | `120`           | Minimum frames between bubbles.                  |
| `bubbleChance`        | `number`                            | `0.5`           | Bubble trigger probability.                      |
| `bubbleText`          | `string`                            | `""`            | Custom non-sleeping bubble message.              |
| `followDistance`      | `number`                            | `20`            | Distance where the cat stops chasing.            |
| `animationSpeed`      | `number`                            | `1`             | Idle animation speed multiplier.                 |
| `hueRotate`           | `number`                            | `0`             | CSS hue rotation in degrees.                     |
| `laserPointer`        | `boolean`                           | `false`         | Replace the cursor with a pixel laser pointer.   |
| `liveStateRef`        | `{ current: CatLiveState }`         | `undefined`     | Mutable ref updated each frame for playgrounds.  |

## Activity States

`onStateChange` and `liveStateRef.current.state` use:

```ts
type CatActivityState =
  | "idle"
  | "moving"
  | "sleeping"
  | "scratchSelf"
  | "tired"
  | "alert"
  | "scratchWallN"
  | "scratchWallS"
  | "scratchWallE"
  | "scratchWallW"
  | "freerun";
```

## Styling

The speech bubble reads these CSS variables when available:

- `--background`
- `--foreground`
- `--border`
- `--font-geist-pixel-square`

If your app does not load Geist Pixel, the bubble falls back to `monospace`.

## Sound Assets

When `meow` is enabled, sounds are requested from `/cat-sounds/*.ogg`. You can copy the sound files
from this repo's `public/cat-sounds/` directory, provide your own files with the same names, or turn
sound off with:

```tsx
<Oneko meow={false} />
```

Browsers may block playback until the user interacts with the page.
