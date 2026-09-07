import { thoughtsForProp } from "./custom-assets";
import { DEFAULT_ONEKO_PLAYGROUND_STATE, type OnekoPlaygroundState } from "./playground-defaults";

/** The playground starts quiet and with a cat thought; the component does not. */
const COMPONENT_DEFAULTS = {
  ...DEFAULT_ONEKO_PLAYGROUND_STATE,
  meow: true,
  bubbleText: "",
};

export function createOnekoUsage(state: OnekoPlaygroundState): string {
  const props = (Object.keys(COMPONENT_DEFAULTS) as (keyof OnekoPlaygroundState)[])
    .filter(
      (key) => key !== "showCat" && key !== "spriteName" && state[key] !== COMPONENT_DEFAULTS[key],
    )
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
