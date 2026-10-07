"use client";

import { useEffect, useState } from "react";
import type { CodeLanguage } from "@/lib/shiki-config";

export function ShikiCode({
  code,
  language,
  className,
  label,
}: {
  code: string;
  language: CodeLanguage;
  className?: string;
  label: string;
}) {
  const [highlighted, setHighlighted] = useState<{ code: string; html: string }>();

  useEffect(() => {
    let current = true;
    void import("@/lib/shiki")
      .then(({ highlightCode }) => highlightCode(code, language))
      .then((html) => {
        if (current) setHighlighted({ code, html });
      })
      .catch(() => {
        // Keep the readable plain-code fallback if highlighting cannot load.
      });
    return () => {
      current = false;
    };
  }, [code, language]);

  const html = highlighted?.code === code ? highlighted.html : "";

  return (
    <div
      className={["shiki-code", className].filter(Boolean).join(" ")}
      role="region"
      aria-label={label}
    >
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
