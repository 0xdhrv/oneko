"use client";

import { ArrowUpRight, CopySimple } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useOnekoPlayground } from "@/components/oneko-playground-context";
import { ShikiCode } from "@/components/shiki-code";
import { abbreviateEmbeddedData, createOnekoUsage } from "@/lib/oneko/usage";
import {
  createShareURL,
  LONG_SHARE_LINK,
  readConfiguration,
  serializeConfiguration,
} from "@/lib/oneko/configuration";

const INSTALL_COMMAND = "npx shadcn@latest add https://oneko.dhrv.pw/r/oneko.json";

export function OnekoInstall() {
  const { state, actions } = useOnekoPlayground();
  const [copyStatus, setCopyStatus] = useState("");
  const [configurationMessage, setConfigurationMessage] = useState("");
  const [shareFallback, setShareFallback] = useState<{
    settings: typeof state;
    url: string;
  } | null>(null);
  const shareURL = shareFallback?.settings === state ? shareFallback.url : "";
  const [importing, setImporting] = useState(false);
  const pendingImport = useRef(0);
  useEffect(
    () => () => {
      pendingImport.current++;
    },
    [],
  );
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
  async function copyShareLink() {
    setShareFallback(null);
    const result = await createShareURL(window.location.origin, state);
    if (!result.ok) {
      setConfigurationMessage(result.error);
      return;
    }
    const long =
      result.value.length > LONG_SHARE_LINK
        ? ` At ${Math.ceil(result.value.length / 1024)} KB it may be cut short in some chat apps, so send the configuration file there.`
        : "";
    try {
      await navigator.clipboard.writeText(result.value);
      setConfigurationMessage(`Share link copied. It opens this cat in the studio.${long}`);
    } catch {
      setShareFallback({ settings: state, url: result.value });
      setConfigurationMessage(`Select the share link below to copy it.${long}`);
    }
  }

  function downloadConfiguration() {
    const file = new Blob([serializeConfiguration(state)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "oneko-configuration.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setConfigurationMessage(
      "Configuration downloaded with all settings, custom artwork, and sounds.",
    );
  }

  return (
    <div className="oneko-install-body">
      <section className="oneko-configuration" aria-labelledby="cat-configuration-title">
        <h3 id="cat-configuration-title">Share or save your cat</h3>
        <p className="oneko-note">
          A share link carries your whole cat, drawn coats and recorded sounds included. Nothing is
          uploaded: the cat lives in the link itself.
        </p>
        <div className="oneko-configuration-actions">
          <button type="button" onClick={copyShareLink}>
            Copy share link
          </button>
          <button type="button" onClick={downloadConfiguration}>
            Download configuration
          </button>
        </div>
        {shareURL && (
          <label className="oneko-text-field" htmlFor="cat-share-url">
            Share link
            <input
              id="cat-share-url"
              readOnly
              value={shareURL}
              onFocus={(event) => event.target.select()}
            />
          </label>
        )}
        <label className="oneko-text-field" htmlFor="cat-configuration-upload">
          Import configuration
          <input
            id="cat-configuration-upload"
            type="file"
            accept=".json,application/json"
            disabled={importing}
            aria-describedby="cat-configuration-help"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const request = ++pendingImport.current;
              setImporting(true);
              setConfigurationMessage("Opening configuration…");
              const result = await readConfiguration(file);
              if (request !== pendingImport.current) return;
              setImporting(false);
              if (!result.ok) {
                setConfigurationMessage(`${result.error} Your cat has not changed.`);
                return;
              }
              actions.replace(result.value.settings);
              setShareFallback(null);
              setConfigurationMessage(
                `Configuration imported. Sound is ${result.value.settings.meow ? "on" : "off"}.${result.value.settings.showCat ? "" : " Your cat is hidden."}`,
              );
            }}
          />
        </label>
        <p className="oneko-note" id="cat-configuration-help">
          Choose an exported JSON file up to 1 MB. Import replaces all settings, including sound and
          visibility.
        </p>
        {configurationMessage && (
          <p className="oneko-note" role="status">
            {configurationMessage}
          </p>
        )}
      </section>
      <section className="oneko-install-section" aria-labelledby="cat-install-title">
        <h3 id="cat-install-title">Bring your cat home</h3>
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
        <ShikiCode
          code={abbreviateEmbeddedData(usage)}
          language="tsx"
          label="Your cat’s current code"
        />
        <button type="button" className="oneko-copy-cat" onClick={copyCat}>
          <CopySimple size={14} aria-hidden="true" />
          Copy your cat
        </button>
        <p className="oneko-note">
          Its coats and your own sounds come along. For built-in purrs, add the optional cat sound
          files.
        </p>
        <Link href="/docs">
          Help your cat settle in <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
        {copyStatus && (
          <p className="oneko-note" role="status">
            {copyStatus}
          </p>
        )}
      </section>
    </div>
  );
}
