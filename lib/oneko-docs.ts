import type { OnekoProps } from "./oneko/types";

export const DOCS_ORIGIN = "https://oneko.dhrv.pw";
export const INSTALL_COMMAND = `npx shadcn@latest add ${DOCS_ORIGIN}/r/oneko.json`;
export const PROP_GROUPS = [
  "Coat & appearance",
  "Paws & play",
  "Bubbles",
  "Sounds",
  "Home & integration",
] as const;
type PropDoc = {
  group: (typeof PROP_GROUPS)[number];
  type: string;
  default: string;
  description: string;
};

/** Exhaustive on purpose: adding a public prop requires documenting it here. */
export const PROP_DOCS = {
  skin: {
    group: "Coat & appearance",
    type: "OnekoSkin",
    default: '"classic"',
    description:
      "One of the 12 bundled pixel-art coats. Changing coats keeps the current animation running.",
  },
  scale: {
    group: "Coat & appearance",
    type: "number",
    default: "1",
    description:
      "Scale of the cat and its bubble. Use a positive value; the playground offers 0.5–3.",
  },
  opacity: {
    group: "Coat & appearance",
    type: "number",
    default: "1",
    description: "Sprite opacity, from 0 to 1. Does not change bubble opacity.",
  },
  hueRotate: {
    group: "Coat & appearance",
    type: "number",
    default: "0",
    description: "Coat hue rotation in degrees. The playground offers 0–360.",
  },
  rotationAmount: {
    group: "Coat & appearance",
    type: "number",
    default: "15",
    description: "Maximum movement tilt in degrees. Set 0 for upright paws.",
  },
  paused: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "Freeze movement, activity, and bubble timers without unmounting. Existing sounds may finish. Resume from the same state.",
  },
  followCursor: {
    group: "Paws & play",
    type: "boolean",
    default: "true",
    description:
      "Follow the cursor or touch destination and visit favorites. False stops chasing and zoomies while allowing grooming, bubbles, and naps.",
  },
  sleepEnabled: {
    group: "Paws & play",
    type: "boolean",
    default: "true",
    description:
      "Allow sleepy idle animations and naps. False wakes an existing or restored nap on the next active tick.",
  },
  speed: {
    group: "Paws & play",
    type: "number",
    default: "10",
    description:
      "Movement speed per animation tick, with easing. Use a positive value; the playground offers 1–30.",
  },
  followDistance: {
    group: "Paws & play",
    type: "number",
    default: "20",
    description:
      "Distance in CSS pixels at which the cat stops chasing. Use a positive value; the playground offers 10–200.",
  },
  idleThreshold: {
    group: "Paws & play",
    type: "number",
    default: "1000",
    description:
      "Rest time in milliseconds before idle activities become eligible. The cat chooses an activity rather than napping immediately.",
  },
  animationSpeed: {
    group: "Paws & play",
    type: "number",
    default: "1",
    description:
      "Idle animation pace multiplier. Use a positive value; the playground offers 0.5–2. Does not change the 10fps engine tick.",
  },
  freerunChance: {
    group: "Paws & play",
    type: "number",
    default: "0.06",
    description:
      "Probability, from 0 to 1, of starting zoomies on an eligible chasing tick. Set 0 to disable spontaneous zoomies.",
  },
  freerunDuration: {
    group: "Paws & play",
    type: "number",
    default: "40",
    description: "Zoomies duration in active frames. At 10fps, 40 frames is about 4 seconds.",
  },
  laserPointer: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "Replace the system cursor with a pixel laser toy. Hidden while paused or when followCursor is false. The toy takes priority over favorites.",
  },
  bubbleEnabled: {
    group: "Bubbles",
    type: "boolean",
    default: "true",
    description: "Enable the cat’s speech bubbles.",
  },
  bubblePlacement: {
    group: "Bubbles",
    type: '"auto" | "above" | "below"',
    default: '"auto"',
    description:
      "Preferred side for thoughts. Auto prefers above and flips below near the top. Placement is constrained to the viewport when the bubble fits.",
  },
  bubbleScale: {
    group: "Bubbles",
    type: "number",
    default: "1",
    description:
      "Extra bubble size multiplier on top of scale. Clamped to 0.5–2; non-finite values fall back to 1.",
  },
  bubbleText: {
    group: "Bubbles",
    type: "string",
    default: '""',
    description:
      "Custom text for awake idle activities. Sleeping always uses sleepy cat thoughts. The playground limits this to 120 characters.",
  },
  bubbleChance: {
    group: "Bubbles",
    type: "number",
    default: "0.5",
    description:
      "Chattiness factor, from 0 to 1. Idle and moving states use different trigger rates; this is not a direct per-frame probability.",
  },
  bubbleDisplayFrames: {
    group: "Bubbles",
    type: "number",
    default: "180",
    description:
      "Regular bubble display duration in active frames: about 18 seconds by default. Zoomies use their own duration.",
  },
  bubbleCooldown: {
    group: "Bubbles",
    type: "number",
    default: "120",
    description: "Quiet frames between regular bubbles: about 12 seconds by default.",
  },
  meow: {
    group: "Sounds",
    type: "boolean",
    default: "true",
    description:
      "Allow optional cat audio. Set false if you have not added sound files. The hosted playground starts with sound off.",
  },
  volume: {
    group: "Sounds",
    type: "number",
    default: "0.5",
    description: "Volume for newly played sounds, from 0 to 1.",
  },
  soundBasePath: {
    group: "Sounds",
    type: "string",
    default: '"/cat-sounds"',
    description:
      "Local or absolute directory URL for the optional .ogg files. Trailing slashes are removed. Keep the original filenames.",
  },
  persistPosition: {
    group: "Home & integration",
    type: "boolean",
    default: "true",
    description:
      "Restore saved position/activity on mount and save before page unload. False disables both storage reads and writes.",
  },
  storageKey: {
    group: "Home & integration",
    type: "string",
    default: '"oneko"',
    description:
      "localStorage key for saved position. Use a distinct key for independent saved positions. Changing it remounts the animation DOM and reads the new key.",
  },
  initialPos: {
    group: "Home & integration",
    type: "{ x: number; y: number }",
    default: "viewport center",
    description:
      "Initial cat center in viewport CSS pixels. Mount-only; an existing saved position takes precedence. Disable persistence for a deterministic starting spot.",
  },
  zIndex: {
    group: "Home & integration",
    type: "number",
    default: "2147483646",
    description:
      "Layer for the cat and its overlays. Set a lower value to place site UI above it. Changing this remounts the animation DOM.",
  },
  zones: {
    group: "Home & integration",
    type: "readonly OnekoZone[]",
    default: "[]",
    description:
      "Keep-out areas and favorite spots, using CSS selectors or viewport rectangles. HTML data-oneko-zone attributes work alongside these definitions.",
  },
  zoneAttractionChance: {
    group: "Home & integration",
    type: "number",
    default: "0.3",
    description:
      "Chance to visit a favorite at each five-second check. Clamped to 0–1. Set 0 to skip visits; non-finite values use 0.3.",
  },
  zoneAttractionDuration: {
    group: "Home & integration",
    type: "number",
    default: "4000",
    description:
      "Visit duration in milliseconds, including travel. Rounded to 100ms ticks and clamped to 100–60000. Non-finite values use 4000.",
  },
  onStateChange: {
    group: "Home & integration",
    type: "(state: CatActivityState) => void",
    default: "undefined",
    description:
      "Called when activity changes. Use it for React UI that displays the cat’s current activity.",
  },
  liveStateRef: {
    group: "Home & integration",
    type: "{ current: CatLiveState }",
    default: "undefined",
    description:
      "An initialized mutable ref updated each active frame. Ref writes do not trigger React renders. Keep the ref identity stable to avoid remounting.",
  },
} satisfies Record<keyof OnekoProps, PropDoc>;

export const AGENT_PROMPT = `Add the Oneko pixel cat to this project using its shadcn registry component.

Read ${DOCS_ORIGIN}/llms.txt, then ${DOCS_ORIGIN}/docs.md for the full API and integration recipes. Fetch ${DOCS_ORIGIN}/r/oneko.json if you need the exact installable source.

1. Inspect the framework, package manager, existing shadcn setup, import aliases, theme tokens, and client/server boundaries. Preserve unrelated changes.
2. Install with: ${INSTALL_COMMAND}
3. Mount one Oneko instance in an appropriate client component. For Next.js App Router, use the documented dynamic import with ssr: false inside a client wrapper, then render that wrapper from the layout.
4. Start with meow={false} unless the sound assets are installed. Keep the built-in reduced-motion behavior, pixel art, and theme-token bubble styling. Keep cat thoughts cat-themed, and sleeping thoughts sleepy.
5. Use documented props to match this site. Put data-oneko-zone="avoid" on sensitive UI that needs space. Use initialPos with persistPosition={false} when a fixed starting spot is required. Do not add new settings unless needed.
6. Check desktop and touch behavior, light and dark themes, keyboard controls, and reduced motion. Run the project’s relevant lint, type, test, and build checks. Report the files changed, chosen props, and any missing sound assets.

Implement the integration in this project. Do not deploy or publish it.`;

type DocBlock =
  | { kind: "text"; text: string }
  | { kind: "code"; label: string; language: string; code: string }
  | { kind: "list"; items: string[] };
export type DocSection = { id: string; title: string; blocks: DocBlock[] };
export const DOC_SECTIONS: DocSection[] = [
  {
    id: "installation",
    title: "Give your cat a home",
    blocks: [
      {
        kind: "text",
        text: "Oneko is a shadcn registry component for React. The installer copies the component, hooks, animation engine, 12 bundled skins, and skin credits into your project. You own the code. Start from a React project with shadcn configured and a working import alias.",
      },
      { kind: "code", label: "Install Oneko", language: "bash", code: INSTALL_COMMAND },
      {
        kind: "text",
        text: "Mount one cat near the root of your app. It attaches its sprite and bubble to document.body; it does not take up layout space. For a browser-only React app, import Oneko and render it directly.",
      },
      {
        kind: "code",
        label: "Browser-only React",
        language: "tsx",
        code: 'import Oneko from "@/components/oneko";\n\nexport default function CatLayer() {\n  return <Oneko meow={false} />;\n}',
      },
      {
        kind: "text",
        text: "In Next.js App Router, put the no-SSR dynamic import inside a client component. Render this wrapper from your layout. This also ensures the default starting position is computed in the browser.",
      },
      {
        kind: "code",
        label: "components/cat-layer.tsx",
        language: "tsx",
        code: '"use client";\n\nimport dynamic from "next/dynamic";\n\nconst Oneko = dynamic(() => import("@/components/oneko"), { ssr: false });\n\nexport default function CatLayer() {\n  return <Oneko meow={false} />;\n}',
      },
      {
        kind: "code",
        label: "Inside your existing app/layout.tsx",
        language: "tsx",
        code: 'import CatLayer from "@/components/cat-layer";\n\n// Keep your existing layout, providers, and metadata.\n// Add this once inside <body>, alongside your app content:\n<CatLayer />',
      },
    ],
  },
  {
    id: "options",
    title: "Every cat comfort",
    blocks: [
      {
        kind: "text",
        text: "All props are optional. These are component defaults; the playground starts with sound off and its own cat thought. The engine runs at 10fps, so 10 active frames is about one second. Hidden tabs and paused cats do not advance those timers.",
      },
      {
        kind: "text",
        text: "Most props update live. initialPos is mount-only; changing persistPosition, storageKey, zIndex, or the liveStateRef object restarts the animation DOM. Suggested playground ranges are guidance, not automatic clamps unless explicitly stated below.",
      },
    ],
  },
  {
    id: "skins",
    title: "Pick a coat",
    blocks: [
      {
        kind: "text",
        text: "Choose classic, black, gray, calico, tora, catppuccin, ghost, silver, spirit, valentine, maia, or vaporwave. All skins ship with the registry; there is no separate image download. They use the original pixel art without smoothing.",
      },
      {
        kind: "code",
        label: "A calico companion",
        language: "tsx",
        code: '<Oneko skin="calico" scale={1.5} rotationAmount={0} meow={false} />',
      },
      {
        kind: "text",
        text: "The installer includes docs/oneko-skins.md with artwork provenance. Code is MIT; preserve the artwork credits and review the skin-specific notes when redistributing.",
      },
    ],
  },
  {
    id: "behavior",
    title: "Chasing, grooming & naps",
    blocks: [
      {
        kind: "code",
        label: "A quiet companion",
        language: "tsx",
        code: "<Oneko\n  followCursor={false}\n  sleepEnabled\n  freerunChance={0}\n  meow={false}\n  persistPosition={false}\n  initialPos={{ x: 80, y: 120 }}\n/>",
      },
      {
        kind: "list",
        items: [
          "paused freezes the current activity; it does not make the cat sleep. Use paused={isDialogOpen} with your existing dialog state to pause while a dialog is open.",
          "followCursor={false} keeps the cat resting in one spot, with grooming, bubbles, and optional naps. Keep-out zones can still relocate it to safety. Re-enabling follows the latest pointer position.",
          "sleepEnabled={false} wakes a sleeping cat on the next active tick. If paused, it wakes after resuming.",
          "The laser toy is hidden while paused or when cursor-follow is disabled. While active, it takes priority over favorite spots.",
          "On touch screens, a tap on non-interactive space gives the cat a destination. Taps on buttons, links, and form controls are ignored.",
        ],
      },
    ],
  },
  {
    id: "bubbles",
    title: "A little cat thought",
    blocks: [
      {
        kind: "code",
        label: "Bubble comforts",
        language: "tsx",
        code: '<Oneko\n  meow={false}\n  bubbleText="Dreaming of treats…"\n  bubblePlacement="above"\n  bubbleScale={1.2}\n  bubbleDisplayFrames={60}\n  bubbleCooldown={100}\n/>',
      },
      {
        kind: "text",
        text: "bubbleScale multiplies the bubble’s inherited scale without changing the cat. Auto placement prefers above and flips below near the top. Bubbles are kept inside the viewport when they fit; an oversized bubble is centered horizontally. Keep-out zones constrain the cat, not its bubble.",
      },
      {
        kind: "text",
        text: "Custom text is used for awake idle activities. Sleeping always uses sleepy thoughts. Keep your copy cat-themed. bubbleChance controls regular chatter; zoomies have their own thoughts and timing.",
      },
      {
        kind: "text",
        text: "Bubble styling reads --background, --foreground, and --border from your theme. It uses --font-geist-pixel-square when available, otherwise monospace. Geist Pixel is optional; the component does not require this site’s fonts.",
      },
    ],
  },
  {
    id: "zones",
    title: "Room for paws",
    blocks: [
      {
        kind: "text",
        text: "Mark real page elements as keep-out areas or favorite spots. These attributes work without a zones prop and follow visible elements as the page moves.",
      },
      {
        kind: "code",
        label: "Element zones",
        language: "tsx",
        code: '<section data-oneko-zone="avoid">\n  {/* Your checkout or other UI that needs room. */}\n</section>\n<div data-oneko-zone="attract">A cozy cat bed</div>\n<Oneko meow={false} />',
      },
      {
        kind: "code",
        label: "Typed zones",
        language: "tsx",
        code: 'import Oneko, { type OnekoZone } from "@/components/oneko";\n\nconst zones: OnekoZone[] = [\n  { id: "checkout", type: "avoid", selector: "#checkout", padding: 12 },\n  { id: "bed", type: "attract", selector: ".cat-bed" },\n  {\n    id: "corner", type: "avoid",\n    rect: { left: 0, top: 0, right: 160, bottom: 100 },\n  },\n];\n\nexport function CatLayer() {\n  return (\n    <Oneko zones={zones} zoneAttractionChance={0.3}\n      zoneAttractionDuration={4000} meow={false} />\n  );\n}',
      },
      {
        kind: "list",
        items: [
          "OnekoZone has id, type (avoid or attract), and either selector or rect. A selector takes precedence and includes all matching visible elements. Use distinct IDs for separate definitions.",
          "Rectangles use viewport CSS pixels with left, top, right, and bottom. Optional padding adds extra space around avoid zones. Invalid selectors and empty rectangles are ignored.",
          "Avoid zones protect the entire scaled, tilting cat, even during zoomies. A new zone around the cat moves it to the nearest safe spot. If no room remains, the cat hides until space returns.",
          "Favorites are checked every five seconds. A visit includes travel time, followed by an eight-second break after it ends. Offscreen favorites and favorites inside keep-out areas are skipped.",
          "Zones are sampled at the 10fps tick. Keep-out boundaries take priority; paused cats do not reconcile moving zones until resumed.",
        ],
      },
    ],
  },
  {
    id: "sounds",
    title: "Purrs are optional",
    blocks: [
      {
        kind: "text",
        text: "The registry does not include audio files. Keep meow={false} for a silent install, or copy public/cat-sounds/ from the source repository into your app’s public assets, preserving the .ogg filenames. Browsers may require user interaction before audio can play.",
      },
      {
        kind: "code",
        label: "Your cat’s sound directory",
        language: "tsx",
        code: '<Oneko meow volume={0.3} soundBasePath="/assets/cat-sounds" />',
      },
      {
        kind: "text",
        text: "soundBasePath also accepts an absolute directory URL. Mute and volume apply to future playback; sounds already playing can finish. Sleeping audio uses the purr pool.",
      },
    ],
  },
  {
    id: "persistence",
    title: "Remember a nap spot",
    blocks: [
      {
        kind: "code",
        label: "A saved spot for this site",
        language: "tsx",
        code: '<Oneko storageKey="my-site:cat" persistPosition meow={false} />',
      },
      {
        kind: "text",
        text: "Position and idle activity are restored from localStorage on mount and saved before page unload. Storage failures are ignored. A saved spot takes precedence over initialPos. Use persistPosition={false} for a predictable starting position or when saving is unwanted.",
      },
      {
        kind: "text",
        text: "The component does not save its configuration props. The hosted playground separately remembers its controls under oneko:playground:v1. Copy your cat in the instantly available install panel exports your selected configuration. Open customization and install panels keep the cat outside; zone sample spots sit below the controls.",
      },
    ],
  },
  {
    id: "events",
    title: "Follow your cat’s day",
    blocks: [
      {
        kind: "code",
        label: "Activity in React",
        language: "tsx",
        code: '"use client";\n\nimport { useState } from "react";\nimport Oneko, { type CatActivityState } from "@/components/oneko";\n\nexport function CatActivity() {\n  const [activity, setActivity] = useState<CatActivityState>("idle");\n  return (\n    <>\n      <Oneko meow={false} onStateChange={setActivity} />\n      <p>Cat activity: {activity}</p>\n    </>\n  );\n}',
      },
      {
        kind: "text",
        text: "Activity values are idle, moving, sleeping, scratchSelf, tired, alert, scratchWallN, scratchWallS, scratchWallE, scratchWallW, and freerun. In a Next.js app, use the no-SSR wrapper pattern from installation for the Oneko import.",
      },
      {
        kind: "code",
        label: "Optional live telemetry",
        language: "tsx",
        code: 'import { useRef } from "react";\nimport type { CatLiveState } from "@/components/oneko";\n\n// Inside your client component:\nconst liveStateRef = useRef<CatLiveState>({\n  state: "idle", posX: 0, posY: 0, velMag: 0,\n  idleTime: 0, distToMouse: 0, frameCount: 0,\n  freerunActive: false, freerunTimer: 0, bubbleVisible: false,\n  pathLength: 0, obstacleCount: 0,\n});\n\n// Pass liveStateRef={liveStateRef} to Oneko.\n// Read liveStateRef.current when needed; writes do not rerender React.',
      },
      {
        kind: "text",
        text: "CatLiveState exposes activity, position, speed, idle ticks, cursor distance, total ticks, zoomies status/time, bubble visibility, and nearby movement information. Public types OnekoProps, OnekoSkin, OnekoZone, CatActivityState, and CatLiveState are exported from @/components/oneko.",
      },
    ],
  },
  {
    id: "agents",
    title: "Let an agent bring the cat",
    blocks: [
      {
        kind: "text",
        text: "Copy this prompt into your coding agent with your project open. It points to the same documentation in Markdown, gives the exact install command, and asks the agent to adapt to your existing app.",
      },
      { kind: "code", label: "Prompt for your coding agent", language: "text", code: AGENT_PROMPT },
      {
        kind: "text",
        text: "Agents can read /llms.txt for discovery, /docs.md or /llms-full.txt for the complete guide, and /r/oneko.json for the installable source. These resources are public and need no login. The HTML guide is rendered on the server, so it is readable without JavaScript.",
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Help your cat settle in",
    blocks: [
      {
        kind: "list",
        items: [
          "No cat? Check that it is mounted in the browser. Reduced motion is checked when the animation mounts; a matching preference skips the cat. Keep-out zones covering the whole viewport can also hide it.",
          "Cat stays still? Check paused, followCursor, followDistance, and whether the tab is hidden. A resting cat may need the cursor moved farther away before it chases.",
          "Starting spot ignored? A saved position overrides initialPos. Disable persistence or use a new storage key, then remount the component.",
          "No purrs? Check meow, volume, the sound directory and filenames, and whether the page has received a user interaction. Sound files are not part of the registry download.",
          "Cat covers a dialog? Lower zIndex or use paused with your dialog state. The cat is mounted on document.body, so a parent’s stacking context does not contain it.",
          "Bubble font differs? Load Geist Pixel and expose --font-geist-pixel-square, or keep the monospace fallback. Define theme variables in both light and dark modes.",
        ],
      },
    ],
  },
];

export function createDocsMarkdown(): string {
  const parts = [
    "# Oneko documentation",
    `\n> A tiny pixel cat for React. Install it, choose its comforts, and give it a home.\n\nCanonical guide: ${DOCS_ORIGIN}/docs\n`,
  ];
  for (const section of DOC_SECTIONS) {
    parts.push(`## ${section.title}\n`);
    for (const block of section.blocks) {
      if (block.kind === "text") parts.push(block.text);
      else if (block.kind === "list") parts.push(block.items.map((item) => `- ${item}`).join("\n"));
      else parts.push(`### ${block.label}\n\n\`\`\`${block.language}\n${block.code}\n\`\`\``);
    }
    if (section.id === "options") {
      for (const group of PROP_GROUPS) {
        parts.push(`### ${group}\n`);
        for (const [name, prop] of Object.entries(PROP_DOCS).filter(
          ([, value]) => value.group === group,
        )) {
          parts.push(
            `#### ${name}\n\nType: \`${prop.type}\` · Default: \`${prop.default}\`\n\n${prop.description}`,
          );
        }
      }
    }
  }
  parts.push(
    `## Sources and credits\n\n- [Source repository](https://github.com/0xdhrv/oneko)\n- [Skin credits](https://github.com/0xdhrv/oneko/blob/main/docs/skins.md)\n- [Sound files](https://github.com/0xdhrv/oneko/tree/main/public/cat-sounds)\n- [Registry](${DOCS_ORIGIN}/r/oneko.json)\n`,
  );
  return parts.join("\n\n");
}
