import { DOCS_ORIGIN, INSTALL_COMMAND } from "@/lib/oneko-docs";

export const dynamic = "force-static";
export function GET() {
  const text = `# Oneko

> A shadcn registry component that adds a customizable pixel cat to a React website.

## When to use Oneko

Use Oneko when a developer wants a decorative cursor-following cat, a quiet stationary cat, or a playful pixel companion on a React site. It includes 12 skins, optional bubbles and sounds, pause and nap controls, keep-out zones, and favorite spots. It is installed as source code, not a hosted API. No API key or account is required.

## Integration workflow

1. Read the full documentation below before editing. Inspect the project's framework, package manager, shadcn configuration, import aliases, and client boundaries.
2. Install with: ${INSTALL_COMMAND}
3. Use a browser-only entry point. In Next.js App Router, put dynamic(() => import("@/components/oneko"), { ssr: false }) inside a client wrapper.
4. Start with meow={false} unless the optional sound files are present. Keep reduced-motion behavior and existing theme tokens. Mount one instance.
5. Apply documented props and validate the integration with the project's existing checks. Do not deploy unless the user requests it.

## Documentation

- [Full component guide](${DOCS_ORIGIN}/docs.md): All props, defaults, units, recipes, callbacks, caveats, and a ready-to-use agent prompt.
- [Human-readable guide](${DOCS_ORIGIN}/docs): Server-rendered HTML with section and prop anchors.
- [Complete context](${DOCS_ORIGIN}/llms-full.txt): The same complete guide as plain text.
- [Installable registry](${DOCS_ORIGIN}/r/oneko.json): Component source, hooks, engine, bundled skins, and credits.
- [Source repository](https://github.com/0xdhrv/oneko): Maintained source and optional sound assets.

## Discovery

- [Site map](${DOCS_ORIGIN}/sitemap.xml)
- [Playground](${DOCS_ORIGIN}/): Try the cat and copy the selected settings.

GET /docs or / with Accept: text/markdown returns the full Markdown guide. Regular browser requests receive HTML. Responses vary on Accept.
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
