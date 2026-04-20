# Oneko playground

A [Next.js](https://nextjs.org/) App Router site that ships an interactive **desktop-style cat** that follows the pointer, with a built-in playground to adjust motion, audio, speech bubbles, and visuals. The UI uses [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) primitives, and [next-themes](https://github.com/pacocoursey/next-themes) for light and dark mode.

Live site: [oneko.dhrv.pw](https://oneko.dhrv.pw)

## Features

- **Playground** — Tweak speed, scale, opacity, bubble copy, sounds, laser pointer, and more via [Tweakpane](https://cocopon.github.io/tweakpane/); settings are held in `OnekoPlaygroundProvider` (`components/oneko-playground-context.tsx`).
- **Client-only sprite** — The cat component (`components/oneko.tsx`) mounts on `document.body` and is loaded with `next/dynamic` and `{ ssr: false }` so it only runs in the browser.
- **Theming** — Tokens live in `app/globals.css`; the chat bubble uses Geist Pixel from `geist/font/pixel` (loaded in `app/layout.tsx`).
- **shadcn registry** — The same `Oneko` implementation can be installed into other projects via the registry (see below).

## Requirements

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/) (this repo uses `pnpm-lock.yaml`)

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses the default Next.js port unless you override it.

### Production build

```bash
pnpm build
pnpm start
```

`prebuild` runs `registry:build` so the shadcn registry artifacts under `public/r/` stay in sync before `next build`.

## Scripts

| Command                               | Description                                                         |
| ------------------------------------- | ------------------------------------------------------------------- |
| `pnpm dev`                            | Start the development server                                        |
| `pnpm build`                          | Build registry output, then run `next build`                        |
| `pnpm start`                          | Start the production server                                         |
| `pnpm run registry:build`             | Run `shadcn build` from `registry.json` into `public/r/`            |
| `pnpm run lint` / `pnpm run lint:fix` | Run [oxlint](https://oxc.rs/docs/guide/usage/linter.html)           |
| `pnpm run fmt` / `pnpm run fmt:check` | Format with [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) |
| `pnpm run generate:favicons`          | Regenerate favicon assets (see `scripts/generate-favicons.mjs`)     |

## Environment variables

| Variable               | Purpose                                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | Optional. Canonical site URL for metadata, sitemap, and robots (trailing slashes are stripped). If unset, development uses `http://localhost:3000`, production uses `https://oneko.dhrv.pw`, and Vercel preview uses `https://<VERCEL_URL>`. Implemented in `lib/site-url.ts`. |

## Install `Oneko` in another app (shadcn)

The registry is defined in `registry.json`. After a deploy, install the published component with:

```bash
npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json
```

In a Next.js App Router project, import the sprite with `dynamic(..., { ssr: false })` so it does not run during SSR. Optional sound files can live under `public/cat-sounds/` (see registry notes in `registry.json` and upstream [oneko.js](https://github.com/adryd325/oneko.js)).

## Repository layout (high level)

| Path                                      | Role                                                          |
| ----------------------------------------- | ------------------------------------------------------------- |
| `app/`                                    | Routes, layout, global styles, homepage playground            |
| `components/oneko.tsx`                    | Main cat sprite and behavior                                  |
| `components/oneko-playground-context.tsx` | Playground state and refs                                     |
| `components/oneko-tweaks.tsx`             | Tweakpane UI bound to context                                 |
| `components/ui/`                          | shadcn/ui components                                          |
| `registry.json`                           | shadcn registry manifest for the distributable `Oneko` item   |
| `public/r/`                               | Built registry JSON (generated; committed for static hosting) |

## License

This project is licensed under the [MIT License](LICENSE). The [oneko.js](https://github.com/adryd325/oneko.js) project that inspired the playground is a separate work with its own license.

## Inspiration

This playground is inspired by [adryd325/oneko.js](https://github.com/adryd325/oneko.js). The site footer links to that project.
