## Learned User Preferences

- Keep bubble/microcopy strictly cat-themed; avoid pathfinding, algorithm, graph-theory, GPS, or Dijkstra/A\* references.
- Do not have the cat say "meow" while it is sleeping.
- All SVG and icon fills must use theme tokens (light and dark), including hover states; no hardcoded colors that break in dark mode.
- Preserve a pixel-art aesthetic: when given a pixel SVG, integrate it as-is with `shape-rendering="crispEdges"` and avoid smoothing or restyling.
- Prefer `pnpm` for installs and scripts (this repo uses `pnpm-lock.yaml` / `pnpm-workspace.yaml`).

## Learned Workspace Facts

- Next.js App Router project; entry layout/styles live in `app/layout.tsx` and `app/globals.css` (the legacy `styles/globals.css` is not the active stylesheet).
- Main interactive cat lives in `components/oneko.tsx`; bubble copy pools (e.g. `IDLE_MESSAGES`, `MOVING_MESSAGES`, `FREERUN_MESSAGES`) are defined inline there.
- Chat bubble uses Geist Pixel via `geist/font/pixel` exposed as the CSS variable `--font-geist-pixel-square`; the font must be loaded in `app/layout.tsx` for the bubble to render correctly.
- Theming uses `next-themes`; tokens are defined in `app/globals.css` with background `#FFF` (light) / `#0A0A0A` (dark) and accent palette ginger `#E89F5E`, blush `#F4B8A8`, sage `#A8C3B5`, fur gray `#B8A89F`.
- Click/UI sound asset is at `components/sounds/click-soft.mp3` and should be played on user interactions.
- Production domain is `oneko.dhrv.pw` (used by `lib/site-url.ts` and SEO/OG metadata).
- shadcn registry for installable `Oneko`: root `registry.json`; `pnpm run registry:build` runs `shadcn build` and emits `public/r/oneko.json` (and `public/r/registry.json`); `prebuild` runs that before `next build`; consumers run `npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json`.
- Inspiration attribution lives in `components/inspiration-attribution.tsx` and links to `https://github.com/adryd325/oneko.js` (no trailing slash).
- The cat mounts on `document.body` with default `z-index` `2147483646` (one below max); the homepage footer uses Tailwind `z-2147483647` so the attribution row stays above the sprite layer.
- Playground settings are centralized in `components/oneko-playground-context.tsx` (`OnekoPlaygroundProvider` / `useOnekoPlayground()`); `OnekoTweaks` reads that context instead of a long prop/callback list.
