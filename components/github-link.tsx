"use client";

import { GithubLogo } from "@phosphor-icons/react";

export function GitHubLink() {
  return (
    <div className="oneko-github">
      <a
        className="pointer-events-auto inline-flex size-11 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
        href="https://github.com/0xdhrv/oneko"
        rel="noopener noreferrer"
        target="_blank"
        aria-label="View on GitHub"
      >
        <GithubLogo size={18} weight="fill" aria-hidden="true" className="shrink-0" />
      </a>
    </div>
  );
}
