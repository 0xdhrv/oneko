"use client";

import { MagicWand } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ONEKO_JS_REPOSITORY_HREF = "https://github.com/adryd325/oneko.js";

export function InspirationAttribution() {
  return (
    <p className="pointer-events-auto inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex size-4 cursor-help items-center justify-center rounded-sm text-muted-foreground outline-none ring-offset-background transition-[color,transform] duration-200 hover:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            aria-label="About this inspiration"
          >
            <MagicWand size={14} weight="duotone" className="shrink-0" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={6}>
          The original oneko.js script this playground takes inspiration from.
        </TooltipContent>
      </Tooltip>
      <span className="text-muted-foreground">Inspired by</span>
      <a
        className="pointer-events-auto text-muted-foreground underline decoration-border underline-offset-2 transition-colors duration-200 hover:text-foreground"
        href={ONEKO_JS_REPOSITORY_HREF}
        rel="noopener noreferrer"
        target="_blank"
      >
        oneko.js
      </a>
    </p>
  );
}
