# Oneko Component

For the complete maintained prop reference, recipes, and coding-agent prompt, see
[/docs](https://oneko.dhrv.pw/docs) or the [Markdown guide](https://oneko.dhrv.pw/docs.md).
Those two formats share their content source in `lib/oneko-docs.ts`.

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

| Prop                  | Type                                | Default         | Description                                                        |
| --------------------- | ----------------------------------- | --------------- | ------------------------------------------------------------------ |
| `skin`                | `OnekoSkin`                         | `"classic"`     | Built-in coat; see [skins and credits](skins.md).                  |
| `paused`              | `boolean`                           | `false`         | Freeze animation in place; resume without remounting.              |
| `followCursor`        | `boolean`                           | `true`          | Follow the pointer and visit favorites; false rests in place.      |
| `sleepEnabled`        | `boolean`                           | `true`          | Allow naps; disabling wakes a sleeping cat while keeping grooming. |
| `persistPosition`     | `boolean`                           | `true`          | Store the last cat position in `localStorage`.                     |
| `storageKey`          | `string`                            | `"oneko"`       | Key used to read and save the cat position.                        |
| `zIndex`              | `number`                            | `2147483646`    | Sprite layer. Set fixed UI above this if needed.                   |
| `initialPos`          | `{ x: number; y: number }`          | viewport center | Initial cat position.                                              |
| `speed`               | `number`                            | `10`            | Movement speed.                                                    |
| `scale`               | `number`                            | `1`             | Visual scale for the sprite and bubble.                            |
| `opacity`             | `number`                            | `1`             | Sprite opacity.                                                    |
| `rotationAmount`      | `number`                            | `15`            | Maximum movement tilt in degrees.                                  |
| `idleThreshold`       | `number`                            | `1000`          | Idle threshold in milliseconds.                                    |
| `meow`                | `boolean`                           | `true`          | Enable optional sound playback.                                    |
| `volume`              | `number`                            | `0.5`           | Sound volume from `0` to `1`.                                      |
| `soundBasePath`       | `string`                            | `"/cat-sounds"` | Directory URL for the optional sound files.                        |
| `onStateChange`       | `(state: CatActivityState) => void` | `undefined`     | Called when the cat changes activity.                              |
| `freerunChance`       | `number`                            | `0.06`          | Per-frame chance to free-roam.                                     |
| `freerunDuration`     | `number`                            | `40`            | Free-roam duration in frames.                                      |
| `bubbleEnabled`       | `boolean`                           | `true`          | Show or hide speech bubbles.                                       |
| `bubblePlacement`     | `"auto" \| "above" \| "below"`      | `"auto"`        | Preferred side of the cat, constrained by the viewport.            |
| `bubbleScale`         | `number`                            | `1`             | Additional bubble size multiplier, clamped to `0.5–2`.             |
| `bubbleDisplayFrames` | `number`                            | `180`           | Bubble display time in frames.                                     |
| `bubbleCooldown`      | `number`                            | `120`           | Minimum frames between bubbles.                                    |
| `bubbleChance`        | `number`                            | `0.5`           | Bubble trigger probability.                                        |
| `bubbleText`          | `string`                            | `""`            | Custom non-sleeping bubble message.                                |
| `followDistance`      | `number`                            | `20`            | Distance where the cat stops chasing.                              |
| `animationSpeed`      | `number`                            | `1`             | Idle animation speed multiplier.                                   |
| `hueRotate`           | `number`                            | `0`             | CSS hue rotation in degrees.                                       |
| `laserPointer`        | `boolean`                           | `false`         | Replace the cursor with a pixel laser pointer.                     |
| `liveStateRef`        | `{ current: CatLiveState }`         | `undefined`     | Mutable ref updated each frame for playgrounds.                    |

## Behavior and integration options

```tsx
<Oneko
  paused={isDialogOpen}
  followCursor={false}
  sleepEnabled={false}
  bubblePlacement="above"
  bubbleScale={1.2}
  soundBasePath="/assets/cat-sounds"
  storageKey="shop:cat"
/>
```

- `paused` freezes sprite movement, activity timers, and bubble timers. Resuming continues from
  that state. Sounds already playing can finish. The regular cursor returns while paused.
- `followCursor={false}` stops chasing, zoomies, and favorite visits. The cat still grooms,
  chats, and naps unless naps are disabled. The laser cursor is hidden. Keep-out zones can still
  relocate the cat to a safe spot. Re-enabling follows the latest pointer position.
- `sleepEnabled={false}` wakes an existing nap on the next active tick and skips sleepy idle
  animations. It also applies to a nap restored from storage.
- `bubbleScale` multiplies the bubble's inherited `scale` without changing the sprite. `auto`
  prefers above the cat and flips below near the top; all placements clamp to the viewport when
  the bubble fits. A bubble wider than the viewport is centered.
- `soundBasePath` accepts a local directory or an absolute directory URL with optional trailing
  slashes. Keep the existing `.ogg` filenames. No sounds are bundled by the registry installer.
- `storageKey` defaults to the existing `oneko` key for compatibility. Choose separate keys for
  independent saved positions. Changing it restarts the animation DOM and loads that key if present;
  `persistPosition={false}` disables reads and writes. Positions are saved before page unload.

These options, except the storage key, update without restarting the animation. Public types
`OnekoProps`, `OnekoSkin`, `OnekoZone`, `CatActivityState`, and `CatLiveState` can all be imported
from `@/components/oneko`.

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

## Playground behavior

The hosted playground remembers settings in this browser and starts with sound off. Reset restores
all playground defaults. The component keeps its existing `meow={true}` default for compatibility.
Pause, cursor-follow, naps, bubble size, and bubble placement are available in the detailed settings.
The install panel generates a copyable client component using your current settings, omitting
unchanged component defaults and playground-only visibility.
Coat changes do not restart the animation. Touch users can tap non-interactive page space to set a
new destination. Hidden tabs stop the animation timer, and reduced-motion preferences keep the cat
unmounted. The skin picker remains usable with reduced motion.

The landing page starts with all controls closed. Choose **Customize cat** for coats and settings,
or **Add a cat to your site** for installation. Customization loads on demand; the install panel is
included in the initial playground bundle so it opens immediately. Both open panels are keep-out
areas. The live zone sample spots render below the controls so favorite visits still work.
Closing customization stops its activity display. Escape or Done closes customization and returns keyboard focus to its button.
Saved preferences do not reopen panels on the next visit.

The playground uses `@web-kits/audio` for short interface sounds on buttons, toggles, selections,
and sliders. These follow the Sound toggle and volume and stay muted with reduced motion. Empty
page space is quiet. The installable cat keeps its separate optional `.ogg` sound pools.

## Keep-out zones and favorite spots

Mark real elements directly; no extra prop is required:

```tsx
<div data-oneko-zone="avoid">Keep the cat away from this area.</div>
<div data-oneko-zone="attract">A favorite place to visit.</div>
<Oneko />
```

Or define zones using selectors or fixed viewport rectangles:

```tsx
import Oneko, { type OnekoZone } from "@/components/oneko";

const zones: OnekoZone[] = [
  { id: "checkout", type: "avoid", selector: "#checkout", padding: 12 },
  { id: "cat-bed", type: "attract", selector: ".cat-bed" },
  { id: "corner", type: "avoid", rect: { left: 0, top: 0, right: 160, bottom: 100 } },
];

<Oneko zones={zones} zoneAttractionChance={0.3} zoneAttractionDuration={4000} />;
```

- `zones` defaults to an empty list. Selector-based zones follow all matching visible elements on
  scroll, resize, and layout changes. A selector takes precedence over `rect`; rectangles use fixed
  viewport coordinates in CSS pixels. Invalid selectors and empty rectangles are ignored.
- `avoid` is a strict boundary for the full scaled, rotating sprite, including during zoomies.
  The cat routes around it or waits outside it. If a zone appears around the cat, it moves to the
  nearest safe position. If no safe position exists, the sprite and bubble hide until room returns.
- `attract` is a separate favorite spot. Every five seconds the cat has a `zoneAttractionChance`
  (default `0.3`, range `0–1`) of visiting one eligible spot. A visit lasts
  `zoneAttractionDuration` milliseconds (default `4000`, clamped to `100–60000`), including travel,
  then the cat returns to the cursor. There is an eight-second break before another visit is tried.
- Favorites whose centers are outside the visible area or inside a keep-out area are skipped.
  Keep-out boundaries always win. The laser toy and explicit debug controls override attraction.
- Element zones are sampled at the cat's 10fps tick. Visuals moving between those ticks are reconciled
  on the next tick. Bubbles are not constrained to zone boundaries.

Try both behaviors under **Customize cat → Cat zones**. Demo zones exist only while that section is
open; the landing page still starts with every control closed.
