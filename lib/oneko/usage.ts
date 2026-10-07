import { thoughtsForProp } from "./custom-assets";
import type { OnekoPlaygroundState } from "./playground-defaults";
import { ONEKO_DEFAULTS } from "./defaults";

export function createOnekoUsage(state: OnekoPlaygroundState): string {
  const props = (Object.keys(state) as (keyof OnekoPlaygroundState)[])
    .filter((key) => {
      if (key === "showCat" || key === "spriteName") return false;
      if (key === "spriteSrc") return Boolean(state.spriteSrc);
      return state[key] !== ONEKO_DEFAULTS[key];
    })
    .map((key) =>
      state[key] === true
        ? `  ${key}`
        : `  ${key}={${JSON.stringify(key === "bubbleText" ? thoughtsForProp(state.bubbleText) : state[key])}}`,
    );
  const component = props.length ? `<Oneko\n${props.join("\n")}\n/>` : "<Oneko />";
  return `"use client";\n\nimport Oneko from "@/components/oneko";\n\nexport default function CatLayer() {\n  return (\n${component
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")}\n  );\n}`;
}
