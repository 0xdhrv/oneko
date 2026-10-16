import { DOCS_ORIGIN, INSTALL_COMMAND } from "@/lib/oneko-docs";

export const dynamic = "force-static";
export function GET() {
  const text = `# Oneko

> A customizable pixel cat for any website: a shadcn registry component for React, plus Svelte, Vue, Solid, and script-tag builds.

## When to use Oneko

Use Oneko when a developer wants a decorative cursor-following cat, a quiet stationary cat, or a playful pixel companion on a React site. It includes 24 skins, optional bubbles and sounds, pause and nap controls, keep-out zones, favorite spots, several cats that chase each other, page reactions (napping while the visitor types, following keyboard focus, perching on hovered links), a pettable keyboard mode, a remembered hide toggle, tossing and treats, knockable elements and boxes to sit in, a goTo/say API for guided tours, seasonal hats, and time-of-day moods. For React it is installed as source code; non-React sites can load the hosted ES module at ${DOCS_ORIGIN}/oneko.js (script tag, <oneko-cat> element, or createOneko API), and Svelte, Vue, or Solid projects can download a wrapper component from ${DOCS_ORIGIN}/frameworks/. No API key or account is required.

## Integration workflow

1. Read the full documentation below before editing. Inspect the project's framework, package manager, shadcn configuration, import aliases, and client boundaries.
2. Install with: ${INSTALL_COMMAND}
3. Use a browser-only entry point. In Next.js App Router, put dynamic(() => import("@/components/oneko"), { ssr: false }) inside a client wrapper.
4. Start with meow={false} unless the optional sound files are present. Keep reduced-motion behavior and existing theme tokens. Mount one instance.
   Without React, add <script type="module" src="${DOCS_ORIGIN}/oneko.js"></script> with data- attributes named after the props instead of steps 2–3.
   For Svelte 5, Vue 3, or Solid, download ${DOCS_ORIGIN}/frameworks/Oneko.svelte, Oneko.vue, or Oneko.solid.tsx into the project instead of steps 2–3. Other frameworks (Angular, Lit) can use the <oneko-cat> element.
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
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
