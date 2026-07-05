"use client";

import * as React from "react";
import { MagicWand } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getOnekoJsRepositoryHref } from "@/lib/oneko/attribution-url";

const TOOLTIP_COPY = "The original oneko.js script this playground takes inspiration from.";

const ICON_TRIGGER_CLASSNAME =
  "inline-flex size-4 cursor-help items-center justify-center rounded-sm text-muted-foreground outline-none ring-offset-background transition-[color,transform] duration-200 hover:text-foreground active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-ring";

const ONEKO_JS_REPOSITORY_HREF = getOnekoJsRepositoryHref();

type TooltipBoundaryState = { hasError: boolean };

class InspirationTooltipBoundary extends React.Component<
  React.PropsWithChildren<{ fallback: React.ReactNode }>,
  TooltipBoundaryState
> {
  state: TooltipBoundaryState = { hasError: false };

  static getDerivedStateFromError(): TooltipBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[InspirationAttribution] Tooltip subtree failed to render.", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function TooltipFallbackTrigger() {
  return (
    <span
      aria-label="About this inspiration"
      className={ICON_TRIGGER_CLASSNAME}
      title={TOOLTIP_COPY}
    >
      <MagicWand size={14} weight="duotone" className="shrink-0" />
    </span>
  );
}

export function InspirationAttribution() {
  return (
    <p className="pointer-events-auto inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <InspirationTooltipBoundary fallback={<TooltipFallbackTrigger />}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={ICON_TRIGGER_CLASSNAME}
              type="button"
              aria-label="About this inspiration"
            >
              <MagicWand size={14} weight="duotone" className="shrink-0" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {TOOLTIP_COPY}
          </TooltipContent>
        </Tooltip>
      </InspirationTooltipBoundary>
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
