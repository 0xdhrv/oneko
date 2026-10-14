# Contributing to Oneko

Use the [issue chooser](https://github.com/0xdhrv/oneko/issues/new/choose) to report a bug,
request a feature, or flag a documentation problem. Search existing issues first. For a bug,
include steps we can repeat and tell us how you installed Oneko. A small example is more useful
than a full application. Blank issues are available for topics that do not fit a form.

For a substantial feature or API change, open an issue to discuss the behavior before investing
in the implementation. Small fixes can go straight to a pull request.

## Local setup

Use Node.js 22 or newer and the pnpm version in `package.json`.

```bash
pnpm install
pnpm dev
```

See [development notes](docs/development.md) for the registry, browser fixtures, and Cloudflare
workflow. Read [AGENTS.md](AGENTS.md) and the installed Next.js guides before changing Next.js code.

## Checks before opening a PR

Run checks that cover your change and record the commands and results in the PR. Explain any
check you could not run. Documentation-only changes do not need application builds or browser tests.

| Change                                                     | Checks                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any changed files                                          | `pnpm fmt:check` and `git diff --check`. For a scoped format check, use `pnpm exec oxfmt --check <paths>`.                                                                                                                                           |
| TypeScript or runtime behavior                             | `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm test`. Add regression coverage for bug fixes where practical.                                                                                                                                       |
| Site or installable React component                        | `pnpm build`. This also regenerates the registry and vanilla build.                                                                                                                                                                                  |
| Engine, browser interactions, or hosted framework wrappers | `pnpm registry:build`, then `pnpm test:browser`. The browser fixture rebuilds `public/oneko.js`. Install Chromium first with `pnpm exec playwright install chromium`, or use `PLAYWRIGHT_CHANNEL=chrome pnpm test:browser` with an installed Chrome. |
| npm package or shared engine used by the package           | `pnpm build:package`. Exercise the affected package entry in a consumer, including mounting, updates, and cleanup when behavior changes.                                                                                                             |
| Chrome extension or shared engine used by the extension    | `pnpm build:extension`. Load `dist/extension` unpacked in Chrome and check the popup, per-site toggle, saved settings, and changed behavior. See the [extension guide](extension/README.md).                                                         |
| Documentation or examples                                  | Check links and try changed installation commands or code examples.                                                                                                                                                                                  |

For visible or interactive changes, also check keyboard access, a narrow viewport, and the
system reduced-motion setting. Include screenshots or a recording when they help show the change.

## Keep integrations consistent

- Change source files, then regenerate affected outputs. Do not patch `public/r/*.json` or
  `public/oneko.js` by hand. Review generated changes and keep unrelated churn out of the PR.
- Changes to shared engine behavior can affect React, the hosted Svelte/Vue/Solid wrappers,
  vanilla APIs, the npm package, and the extension. Check the affected consumers.
- When public options or behavior change, update `lib/oneko-docs.ts` and relevant README examples.
  That shared content powers the HTML and Markdown documentation.
- For new or changed sprite artwork, include its source and attribution in `docs/skins.md`.

## PR checklist

- [ ] Describe the problem and what users will experience after the change.
- [ ] Link related issues and call out any compatibility changes.
- [ ] Record validation results and any limitations.
- [ ] Update affected examples, documentation, and generated files.
- [ ] Review the diff for unrelated edits and leftover debugging code.

Keep each PR focused on one change. The PR template includes space for validation and follow-up;
delete sections and checklist items that do not apply.
