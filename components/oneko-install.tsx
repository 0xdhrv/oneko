"use client";

import { ArrowUpRight, CopySimple } from "@phosphor-icons/react";
import { useState } from "react";
import Link from "next/link";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { ShikiCode } from "@/components/shiki-code";
import { createOnekoUsage } from "@/lib/oneko/usage";

const INSTALL_COMMAND = "npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json";

export function OnekoInstall() {
  const { state } = useOnekoPlayground();
  const [copyStatus, setCopyStatus] = useState("");
  const usage = createOnekoUsage(state);
  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopyStatus("Copied. A new home for your cat awaits.");
    } catch {
      setCopyStatus("Select the command above to copy it for your cat.");
    }
  }
  async function copyCat() {
    try {
      await navigator.clipboard.writeText(usage);
      setCopyStatus("Copied. Your cat’s comforts are packed.");
    } catch {
      setCopyStatus("Select the example above to copy your cat’s comforts.");
    }
  }

  return (
    <div className="oneko-install-body">
      <p>Give your cat a home in your React project.</p>
      <div className="oneko-command">
        <input
          aria-label="Cat install command"
          readOnly
          value={INSTALL_COMMAND}
          onFocus={(event) => event.target.select()}
        />
        <button type="button" onClick={copyInstall}>
          <CopySimple size={14} aria-hidden="true" />
          Copy
        </button>
      </div>
      <p>Welcome your cat with its current comforts:</p>
      <ShikiCode code={usage} language="tsx" label="Your cat’s current code" />
      <button type="button" className="oneko-copy-cat" onClick={copyCat}>
        <CopySimple size={14} aria-hidden="true" />
        Copy your cat
      </button>
      <p className="oneko-note">
        Its coats come along. For purrs, add the optional cat sound files.
      </p>
      <Link href="/docs">
        Help your cat settle in <ArrowUpRight size={14} aria-hidden="true" />
      </Link>
      {copyStatus && (
        <p className="oneko-note" role="status">
          {copyStatus}
        </p>
      )}
    </div>
  );
}
