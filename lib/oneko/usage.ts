import { thoughtsForProp } from "./custom-assets";
import { soundsForProp } from "./custom-sounds";
import { friendProps, type OnekoPlaygroundState } from "./playground-defaults";
import { ONEKO_DEFAULTS } from "./defaults";

export function createOnekoUsage(state: OnekoPlaygroundState): string {
  const props = (Object.keys(state) as (keyof OnekoPlaygroundState)[])
    .filter((key) => {
      if (key === "showCat" || key === "spriteName" || key === "friend") return false;
      if (key === "spriteSrc") return Boolean(state.spriteSrc);
      if (key === "soundClips") return Object.keys(state.soundClips).length > 0;
      return state[key] !== ONEKO_DEFAULTS[key];
    })
    .map((key) => {
      if (key === "soundClips")
        return `  sounds={${JSON.stringify(soundsForProp(state.soundClips))}}`;
      if (state[key] === true) return `  ${key}`;
      const value = key === "bubbleText" ? thoughtsForProp(state.bubbleText) : state[key];
      return `  ${key}={${JSON.stringify(value)}}`;
    });
  const cat = props.length ? `<Oneko\n${props.join("\n")}\n/>` : "<Oneko />";
  const friend = Object.entries(friendProps(state))
    .filter(([key, value]) => value !== ONEKO_DEFAULTS[key as keyof typeof ONEKO_DEFAULTS])
    .map(([key, value]) => (typeof value === "string" ? `${key}="${value}"` : `${key}={${value}}`))
    .join(" ");
  const component = state.friend
    ? `<>\n${cat
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n")}\n  <Oneko ${friend} />\n</>`
    : cat;
  return `"use client";\n\nimport Oneko from "@/components/oneko";\n\nexport default function CatLayer() {\n  return (\n${component
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")}\n  );\n}`;
}

/**
 * The same code for reading on the page, with embedded art and sounds shortened. Highlighting
 * hundreds of KB of base64 blocks the main thread; copying still takes the full code.
 */
export function abbreviateEmbeddedData(code: string): string {
  return code.replace(
    /data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/]{12})[A-Za-z0-9+/]{24,}={0,2}/g,
    "data:$1;base64,$2…",
  );
}
