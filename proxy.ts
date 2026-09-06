import { NextResponse, type NextRequest } from "next/server";
import { prefersMarkdown } from "@/lib/markdown-negotiation";

export function proxy(request: NextRequest) {
  const response = prefersMarkdown(request.headers.get("accept"))
    ? NextResponse.rewrite(new URL("/docs.md", request.url))
    : NextResponse.next();
  response.headers.set("Vary", "Accept");
  return response;
}

export const config = { matcher: ["/", "/docs"] };
