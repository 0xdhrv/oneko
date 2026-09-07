import { getSiteUrl } from "@/lib/site-url";
import { createDocsMarkdown } from "@/lib/oneko-docs";

export const dynamic = "force-static";
export function GET() {
  return new Response(createDocsMarkdown(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Link: `<${getSiteUrl()}/docs>; rel="canonical"`,
    },
  });
}
