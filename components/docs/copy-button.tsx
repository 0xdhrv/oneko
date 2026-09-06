"use client";

import { Check, CopySimple } from "@phosphor-icons/react";
import { useState } from "react";

export function CopyButton({ text, label = "Copy cat code" }: { text: string; label?: string }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied for your cat.");
    } catch {
      setStatus("Select the text below to copy it for your cat.");
    }
  }
  return (
    <span className="docs-copy">
      <button type="button" onClick={copy} aria-label={label}>
        {status.startsWith("Copied") ? (
          <Check size={14} weight="bold" aria-hidden="true" />
        ) : (
          <CopySimple size={14} aria-hidden="true" />
        )}
        Copy
      </button>
      <span role="status">{status}</span>
    </span>
  );
}
