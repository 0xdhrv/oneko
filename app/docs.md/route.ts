import { createDocsMarkdown } from "@/lib/oneko-docs";

export const dynamic = "force-static";
export function GET() {
  return new Response(createDocsMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      Link: '</docs>; rel="canonical"',
    },
  });
}
