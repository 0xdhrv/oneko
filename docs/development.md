# Development

This repository is a Next.js App Router playground plus a shadcn registry entry for the
`components/oneko.tsx` component. The README stays focused on consumer installation; this document
covers maintainer workflow.

## Requirements

- Node.js LTS
- pnpm

## Local Workflow

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the playground.

## Scripts

| Command                               | Description                                          |
| ------------------------------------- | ---------------------------------------------------- |
| `pnpm dev`                            | Start the local playground server.                   |
| `pnpm run registry:build`             | Build `public/r/oneko.json` from `registry.json`.    |
| `pnpm build`                          | Build registry output, then build the hosted site.   |
| `pnpm start`                          | Start the production server after a build.           |
| `pnpm run lint` / `pnpm run lint:fix` | Run oxlint.                                          |
| `pnpm run fmt` / `pnpm run fmt:check` | Run oxfmt.                                           |
| `pnpm run generate:favicons`          | Regenerate favicon assets from `public/favicon.svg`. |

## Registry

The public install command is:

```bash
npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json
```

`registry.json` is the source of truth. `pnpm run registry:build` emits:

- `public/r/oneko.json`
- `public/r/registry.json`

`prebuild` runs `registry:build`, so production builds keep the generated registry files current.

## App Entrypoints

| Path                       | Role                                                    |
| -------------------------- | ------------------------------------------------------- |
| `app/layout.tsx`           | Metadata, theme provider, fonts, click sound, analytics |
| `app/page.tsx`             | Playground route shell                                  |
| `app/globals.css`          | Active Tailwind and theme token stylesheet              |
| `app/oneko-playground.tsx` | Playground provider, `Oneko`, and tweak panel           |

The legacy `styles/globals.css` is not used by the current app.

## Environment

| Variable               | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical site URL for metadata, sitemap, and robots output. |

When unset, `lib/site-url.ts` uses `http://localhost:3000` in development,
`https://oneko.dhrv.pw` in production, or the Vercel preview URL when available.
