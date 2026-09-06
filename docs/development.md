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
| `app/oneko-playground.tsx` | Playground provider, `Oneko`, and cat controls          |

The legacy `styles/globals.css` is not used by the current app.

## Environment

| Variable               | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical site URL for metadata, sitemap, and robots output. |

When unset, `lib/site-url.ts` uses `http://localhost:3000` in development,
`https://oneko.dhrv.pw` in production, or the Vercel preview URL when available.

## Documentation and agent access

Playground interface audio uses `@web-kits/audio` in `components/global-click-sound.tsx`, with
short synthesized control sounds, keyboard activation, range-input throttling, and cleanup.
The Sound toggle and volume control both interface sounds and the separate cat audio. Keep this
playground dependency out of the installable Oneko registry. The old click MP3 remains available
as an asset but is no longer used by the global sound handler.

`cat-customize` and `cat-install` use `data-oneko-zone="avoid"` only while open. The zone demos
portal their sample spots into `cat-zone-playground`, outside the protected panels. The install
component is imported directly, while customization remains lazy.

The `/docs` page is server-rendered. `lib/oneko-docs.ts` is the shared content source for the
HTML guide, `/docs.md`, and `/llms-full.txt`; its prop reference is exhaustive against `OnekoProps`.
Update that source whenever an option or integration behavior changes. `/llms.txt` provides
when-to-use guidance and links to the guide and registry. The install panel and homepage link to it.

`proxy.ts` serves the Markdown guide for `/` and `/docs` requests that prefer `text/markdown`.
Both representations vary on `Accept`. Normal browser and wildcard requests keep HTML.

The public baseline returned by `npx is-agentic https://oneko.dhrv.pw --json` on September 6, 2026
scored 56/100 (stored report timestamp: `2026-09-06T06:37:01.081Z`). Relevant findings were sparse
HTML without JavaScript, no Markdown content negotiation, no agent usage guidance, and no
structured application metadata. The local implementation addresses these; it is not a verified
post-deployment score. Organization contact details and business trust pages are not fabricated
for this component project.

The CLI rejects localhost with `invalid_url` because it scans only publicly routable hosts.
Verify local endpoints directly, then request a fresh public scan after deployment when needed.

After deployment, inspect the public report with:

```bash
npx is-agentic https://oneko.dhrv.pw --json
```

The CLI returns the latest stored completed report and does not force a rescan. Check its
`scanned_at` timestamp before treating a report as evidence for a new deployment. Local checks:

```bash
curl -i -H 'Accept: text/markdown' http://localhost:3000/docs
curl -i -H 'Accept: text/html' http://localhost:3000/docs
curl -i http://localhost:3000/llms.txt
curl -i http://localhost:3000/this-cat-page-does-not-exist
```
