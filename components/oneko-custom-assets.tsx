"use client";

import { useEffect, useRef, useState } from "react";
import { useOnekoPlayground } from "./oneko-playground-context";
import { getSkinSource } from "@/lib/oneko/skins";
import {
  MAX_THOUGHT_TEXT_LENGTH,
  readSprite,
  readThoughts,
  thoughtLines,
  validateThoughts,
} from "@/lib/oneko/custom-assets";

export function OnekoCustomAssets({ section }: { section: "sprite" | "thoughts" }) {
  const { state, actions } = useOnekoPlayground();
  const [draft, setDraft] = useState(state.bubbleText);
  const [spriteError, setSpriteError] = useState("");
  const [textError, setTextError] = useState("");
  const [loading, setLoading] = useState(false);
  const pending = useRef(0);
  const textRequest = useRef(0);
  useEffect(() => {
    setDraft(state.bubbleText);
  }, [state.bubbleText]);
  useEffect(
    () => () => {
      pending.current++;
      textRequest.current++;
    },
    [],
  );

  return (
    <div className="oneko-custom-assets">
      {section === "sprite" && (
        <div className="oneko-text-field">
          <label htmlFor="cat-sprite-upload">Your sprite sheet</label>
          <p className="oneko-note" id="cat-sprite-help">
            PNG, 256 × 128 pixels, up to 256 KB. Keep the template’s 8 × 4 frame layout for every
            animation.
          </p>
          <input
            id="cat-sprite-upload"
            type="file"
            accept="image/png,.png"
            disabled={loading}
            aria-describedby="cat-sprite-help"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const request = ++pending.current;
              setLoading(true);
              setSpriteError("");
              try {
                const spriteSrc = await readSprite(file);
                if (request === pending.current)
                  actions.update({ spriteSrc, spriteName: file.name, hueRotate: 0 });
              } catch (error) {
                if (request === pending.current)
                  setSpriteError(
                    error instanceof Error ? error.message : "Couldn’t read this sprite sheet.",
                  );
              } finally {
                if (request === pending.current) setLoading(false);
              }
            }}
          />
          <div className="oneko-asset-actions">
            <a href={getSkinSource("classic")} download="oneko-template.png">
              Download sprite template
            </a>
            {state.spriteSrc && (
              <button
                type="button"
                onClick={() => {
                  pending.current++;
                  setLoading(false);
                  setSpriteError("");
                  actions.update({ spriteSrc: "", spriteName: "" });
                }}
              >
                Remove custom sprite
              </button>
            )}
          </div>
          {loading && (
            <p className="oneko-note" role="status">
              Opening your sprite sheet…
            </p>
          )}
          {spriteError && (
            <p className="oneko-asset-error" role="alert">
              {spriteError}
            </p>
          )}
          {state.spriteSrc && (
            <div className="oneko-upload-preview">
              <span
                className="oneko-skin-preview"
                aria-hidden="true"
                style={{ backgroundImage: `url("${state.spriteSrc}")` }}
              />
              <span role="status">Using {state.spriteName || "your custom sprite"}</span>
            </div>
          )}
        </div>
      )}
      {section === "thoughts" && (
        <div className="oneko-text-field">
          <label htmlFor="cat-bubbleText">Your cat’s thoughts</label>
          <p className="oneko-note" id="cat-thoughts-help">
            One thought per line. Up to 50 thoughts, 120 characters each. Leave empty for the
            built-in thoughts.
          </p>
          <textarea
            id="cat-bubbleText"
            rows={4}
            maxLength={MAX_THOUGHT_TEXT_LENGTH}
            value={draft}
            placeholder={"Dreaming of treats…\nTime for a little adventure"}
            aria-describedby="cat-thoughts-help"
            aria-invalid={!!textError}
            onChange={(event) => {
              const text = event.target.value;
              textRequest.current++;
              setDraft(text);
              try {
                validateThoughts(text);
                setTextError("");
                actions.update({ bubbleText: text });
              } catch (error) {
                setTextError((error as Error).message);
              }
            }}
          />
          <label htmlFor="cat-thoughts-upload">Or import a text file</label>
          <input
            id="cat-thoughts-upload"
            type="file"
            accept=".txt,text/plain"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const request = ++textRequest.current;
              try {
                const bubbleText = await readThoughts(file);
                if (request !== textRequest.current) return;
                actions.update({ bubbleText });
                setDraft(bubbleText);
                setTextError("");
              } catch (error) {
                if (request === textRequest.current)
                  setTextError(
                    error instanceof Error ? error.message : "Couldn’t read this text file.",
                  );
              }
            }}
          />
          {textError && (
            <p className="oneko-asset-error" role="alert">
              {textError}
            </p>
          )}
          <p className="oneko-note" role="status">
            {thoughtLines(state.bubbleText).length}{" "}
            {thoughtLines(state.bubbleText).length === 1 ? "thought" : "thoughts"} ready.{" "}
            {!state.bubbleEnabled && "Turn on Bubbles above to hear them."}
          </p>
        </div>
      )}
      <p className="oneko-note">
        {section === "sprite"
          ? "Your image stays in this browser and comes with your exported code."
          : "Picked at random while awake. Naps and zoomies keep their own messages."}
      </p>
    </div>
  );
}
