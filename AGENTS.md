## Learned User Preferences

- Keep bubble/microcopy strictly cat-themed; avoid pathfinding, algorithm, graph-theory, GPS, or Dijkstra/A\* references.
- Do not have the cat say "meow" while it is sleeping.
- All SVG and icon fills must use theme tokens (light and dark), including hover states; no hardcoded colors that break in dark mode.
- Preserve a pixel-art aesthetic: when given a pixel SVG, integrate it as-is with `shape-rendering="crispEdges"` and avoid smoothing or restyling.
- Prefer `pnpm` for installs and scripts (this repo uses `pnpm-lock.yaml` / `pnpm-workspace.yaml`).

## Learned Workspace Facts

- Next.js App Router project; entry layout/styles live in `app/layout.tsx` and `app/globals.css`.
- `components/oneko.tsx` is the shadcn registry entry — a thin React shell. Animation runs in `hooks/use-cat-animation.ts`; engine code lives under `lib/oneko/` (frame loop, pathfinding, bubbles, debug controls, persistence).
- Bubble copy pools (`IDLE_MESSAGES`, `MOVING_MESSAGES`, `FREERUN_MESSAGES`) are in `lib/oneko/constants.ts`; bubble selection/rendering is in `lib/oneko/animation/bubbles.ts`.
- Chat bubble uses Geist Pixel via `geist/font/pixel` as `--font-geist-pixel-square`; load it in `app/layout.tsx`.
- Theming uses `next-themes`; tokens in `app/globals.css` with background `#FFF` (light) / `#0A0A0A` (dark) and accent palette ginger `#E89F5E`, blush `#F4B8A8`, sage `#A8C3B5`, fur gray `#B8A89F`.
- Click/UI sound asset is at `components/sounds/click-soft.mp3`.
- Production domain is `oneko.dhrv.pw` (`lib/site-url.ts`, SEO/OG metadata).
- shadcn registry: root `registry.json`; `pnpm run registry:build` emits `public/r/oneko.json`; `prebuild` runs before `next build`; consumers run `npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json`.
- Inspiration attribution is in `components/inspiration-attribution.tsx`; URL validation/fallback in `lib/oneko/attribution-url.ts` (links to `https://github.com/adryd325/oneko.js`, no trailing slash).
- The cat mounts on `document.body` with default `z-index` `2147483646` (`DEFAULT_Z_INDEX` in `lib/oneko/constants.ts`); fixed footer/attribution UI uses `z-2147483647`.
- Playground settings: `components/oneko-playground-context.tsx` (`OnekoPlaygroundProvider` / `useOnekoPlayground()`).
- Lint/format: `pnpm lint` (oxlint), `pnpm fmt` (oxfmt). Tests: `pnpm test` (vitest).
