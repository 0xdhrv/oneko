# Oneko

A shadcn registry component that drops a tiny pixel cat into a React app. The cat mounts on
`document.body`, follows the pointer, naps when idle, shows cat-themed speech bubbles, and can play
optional cat sounds.

Live playground: [oneko.dhrv.pw](https://oneko.dhrv.pw)

Full documentation: [oneko.dhrv.pw/docs](https://oneko.dhrv.pw/docs). Includes every prop,
integration recipes, and a copyable coding-agent prompt. Agents can start at
[llms.txt](https://oneko.dhrv.pw/llms.txt) or read the [Markdown guide](https://oneko.dhrv.pw/docs.md).

## Install

```bash
npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json
```

The command adds `components/oneko.tsx`, its hooks and animation engine, bundled skins, and skin credits to your project.

## Usage

Render `Oneko` only in the browser. In SSR-enabled apps, put it behind your framework's client-only
boundary or lazy-load it after mount.

```tsx
"use client";

import Oneko from "@/components/oneko";

export function CatLayer() {
  return <Oneko />;
}
```

Optional cat sounds are loaded from `/cat-sounds/*.ogg`. Add those files to your app's public assets
if you want audio; otherwise set `meow={false}`.

## Features

- Twelve bundled pixel-art skins with crisp previews and instant coat changes.
- A responsive playground with quick controls, saved preferences, reset, and optional detailed settings.
- Tap an empty spot on touch screens to call the cat over.
- A 10fps animation timer that stops while the page is hidden.
- Pause/resume, cursor-follow and nap toggles, with live bubble size and placement controls.
- Copy a client component with your playground settings ready to use.
- Pointer-following motion with obstacle awareness and occasional free-roam bursts.
- Strict keep-out zones and occasional visits to favorite spots, via HTML attributes or React props.
- Cat-themed bubble copy for idle, sleepy, playful, scratching, and chasing states.
- Theme-token bubble styling for light and dark themes.
- Optional sound pools, laser pointer mode, position persistence, scaling, opacity, rotation, and
  hue controls.
- Live state ref for playgrounds or debug panels.
- Custom sound directories and storage keys for integration into your app.

## Common Props

```tsx
<Oneko
  skin="calico"
  speed={10}
  scale={1}
  opacity={1}
  meow
  volume={0.5}
  bubbleEnabled
  bubbleText="purr patrol"
  bubblePlacement="auto"
  bubbleScale={1}
  paused={false}
  followCursor
  sleepEnabled
  laserPointer={false}
/>
```

See [docs/oneko.md](docs/oneko.md) for the full prop reference and integration notes.

## Maintainers

This repo hosts the playground and shadcn registry output for the component.

```bash
pnpm install
pnpm dev
pnpm run registry:build
pnpm build
```

`pnpm build` runs the registry build first, so `public/r/oneko.json` stays in sync with
`registry.json`.

More project details live in [docs/development.md](docs/development.md).

## Repository Layout

| Path                   | Role                                              |
| ---------------------- | ------------------------------------------------- |
| `components/oneko.tsx` | Distributable shadcn component                    |
| `registry.json`        | shadcn registry manifest                          |
| `public/r/`            | Generated registry JSON for static hosting        |
| `app/`                 | Hosted playground shell                           |
| `components/ui/`       | Local shadcn/ui primitives used by the playground |
| `docs/oneko.md`        | Component API and integration notes               |
| `docs/development.md`  | Local development, registry, and hosting workflow |

## Inspiration

Inspired by [adryd325/oneko.js](https://github.com/adryd325/oneko.js) and the skin gallery in
[oneko-swift](https://github.com/oneko-swift/oneko-swift). See [skin credits](docs/skins.md) for the original artists and sources.

## License

Code: MIT. See [LICENSE](LICENSE). Sprite artwork belongs to its original creators; see [skin credits](docs/skins.md).
