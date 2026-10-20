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
      "One of the 24 bundled pixel-art coats. Changing coats keeps the current animation running.",
  },
  spriteSrc: {
    group: "Coat & appearance",
    type: "string",
    default: "undefined",
    description:
      "Custom sprite-sheet URL or data URL. Overrides skin; use a 256 × 128 PNG with the classic 8 × 4 layout of 32 × 32 frames. Changes apply live.",
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
  seasonal: {
    group: "Coat & appearance",
    type: 'boolean | "halloween" | "winter" | "newYear"',
    default: "true",
    description:
      "Dress up for the season with a pixel hat and a few themed thoughts, using the visitor's local date: a witch hat Oct 20–31, a Santa hat Dec 18–29, and a party hat Dec 30–Jan 2. Pass a season name to force one, or false to opt out. The coat is never changed.",
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
      "Replace the system cursor with a pixel laser toy. Hidden with reduced motion, while paused, or when followCursor is false. Cleanup restores the previous cursor. The toy takes priority over favorites.",
  },
  reducedMotion: {
    group: "Paws & play",
    type: '"hide" | "rest"',
    default: '"hide"',
    description:
      'What happens when the visitor prefers reduced motion. "hide" removes the cat; "rest" shows a still, sleeping sprite at the saved spot (or initialPos, or the bottom-right corner) with no animation, sound, or bubbles.',
  },
  chase: {
    group: "Paws & play",
    type: '"cursor" | "cat"',
    default: '"cursor"',
    description:
      'What the cat chases. "cat" follows the cat mounted just before this one, so several cats form a little parade; the first cat still chases the cursor. A cat resting beside a napping friend dozes off too.',
  },
  napWhileTyping: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "Doze off where it is while the visitor types in a text field, textarea, or editable area. The next pointer movement wakes it. Shortcut keys do not count as typing.",
  },
  followFocus: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "Walk over to the element that receives keyboard focus, settling just below it (or above, near the bottom of the screen). Pointer focus is ignored, except on text fields.",
  },
  perchOnHover: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "When the pointer rests on a link or button for 0.7 seconds, the cat climbs on top of it. Add data-oneko-perch to any other element to make it a perch. Moving the pointer or scrolling ends the visit.",
  },
  pettable: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      'Makes the cat a focusable "Pet the cat" button in the tab order. While focused it holds still; Enter or Space pets it, with a purr, a bubble, and a polite screen-reader announcement. Changing this remounts the animation DOM.',
  },
  grabbable: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "Visitors can pick the cat up and toss it. It spins through the air, bounces off the screen edges, and lands on its feet with a purr, or a hiss after a hard throw. A click without dragging pets it. The cat then catches clicks where it sits, so keep it off busy controls with keep-out zones.",
  },
  treats: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "Double-click empty page space to drop a fish treat; the nearest cat runs over and eats it. Double-clicks on text, links, buttons, and fields are left alone. Up to five treats wait on the floor. dropTreat() works without this option.",
  },
  timeOfDay: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      "Follow the visitor's local clock, like a real cat: faster with more zoomies at dawn (5–8) and dusk (17–21), drowsy after lunch, and quick to nap from 23:00 to 5:00. Scales speed, freerunChance, and idleThreshold.",
  },
  affection: {
    group: "Paws & play",
    type: "boolean",
    default: "false",
    description:
      'Remember pets and treats in localStorage under storageKey + ":affection". Visitors returning after 30 minutes get a greeting that warms up from stranger to best friend, and petting a good friend earns fonder thoughts.',
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
    type: "string | readonly string[]",
    default: '""',
    description:
      "Custom awake bubble text, or an array picked at random without immediate repeats. Empty entries are ignored; an empty pool uses built-in messages. Naps and zoomies retain their own messages. In the playground, type one thought per line or import a .txt file (up to 50 thoughts, 120 characters each).",
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
    default: "false",
    description:
      "Enable optional cat audio after adding the sound files. Both the component and hosted playground start with sound off.",
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
      "Restore validated coordinates on mount and save when the page hides or the component unmounts. False disables storage reads and writes.",
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
  onPet: {
    group: "Home & integration",
    type: "(detail: { affection: number }) => void",
    default: "undefined",
    description:
      "Called when the cat is petted by keyboard, by a click on a grabbable cat, or with pet().",
  },
  onCatchCursor: {
    group: "Home & integration",
    type: "() => void",
    default: "undefined",
    description:
      "Called when the cat reaches the cursor after chasing it from more than 160 pixels away. Handy for little games.",
  },
  onSleep: {
    group: "Home & integration",
    type: "() => void",
    default: "undefined",
    description: "Called each time the cat falls asleep.",
  },
  onToss: {
    group: "Home & integration",
    type: "(detail: { speed: number }) => void",
    default: "undefined",
    description:
      "Called when a visitor throws a grabbable cat; speed is the release speed in pixels per second.",
  },
  onTreat: {
    group: "Home & integration",
    type: "(detail: { affection: number }) => void",
    default: "undefined",
    description: "Called when the cat eats a treat.",
  },
  liveStateRef: {
    group: "Home & integration",
    type: "{ current: CatLiveState }",
    default: "undefined",
    description:
      "An initialized mutable ref updated each active frame. Ref writes do not trigger React renders. Keep the ref identity stable to avoid remounting.",
  },
} satisfies Record<keyof OnekoProps, PropDoc>;

const AGENT_PROMPT = `Add the Oneko pixel cat to this project using its shadcn registry component.

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
/** `label` is the plain, searchable name; `title` keeps the cat voice. */
export type DocSection = {
  id: string;
  label: string;
  title: string;
  blocks: DocBlock[];
};
export const DOC_SECTIONS: DocSection[] = [
  {
    id: "installation",
    label: "Installation",
    title: "Give your cat a home",
    blocks: [
      {
        kind: "text",
        text: "Oneko is a shadcn registry component for React. The installer copies the component, hooks, animation engine, 24 bundled skins, and skin credits into your project. You own the code. Start from a React project with shadcn configured and a working import alias.",
      },
      {
        kind: "code",
        label: "Install Oneko",
        language: "bash",
        code: INSTALL_COMMAND,
      },
      {
        kind: "code",
        label: "Classic coat and custom sprites only",
        language: "bash",
        code: "npx shadcn@latest add https://oneko.dhrv.pw/r/oneko-classic.json",
      },
      {
        kind: "text",
        text: "Choose one installation per project. The classic item has the same engine and component path, with only the classic coat embedded. Both add about 31 KB gzipped up front; the full item loads its other sheets (about 558 KB) only when a named skin is first rendered. Named skins such as calico need the full item; custom spriteSrc works with either. To switch versions, run the other install command and review overwritten files. Studio exports use the full install command.",
      },
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
    id: "html",
    label: "Without React",
    title: "No React? Still a cat",
    blocks: [
      {
        kind: "text",
        text: 'Any site can load the hosted build: Astro, Hugo, Jekyll, WordPress, or plain HTML. One script tag brings a cat, configured with data- attributes named after the props in kebab case. Booleans accept a bare attribute or "false"; separate several thoughts with |. Sounds default to the hosted files.',
      },
      {
        kind: "code",
        label: "One tag",
        language: "html",
        code: `<script type="module" src="${DOCS_ORIGIN}/oneko.js" data-skin="calico" data-meow></script>`,
      },
      {
        kind: "code",
        label: "A cat element",
        language: "html",
        code: `<script type="module" src="${DOCS_ORIGIN}/oneko.js"></script>\n<oneko-cat skin="ginger" bubble-text="mrrp?|nap time"></oneko-cat>`,
      },
      {
        kind: "code",
        label: "JavaScript API",
        language: "tsx",
        code: `import { createOneko } from "${DOCS_ORIGIN}/oneko.js";\n\nconst cat = createOneko({ skin: "tuxedo", laserPointer: true });\ncat.update({ paused: true });\ncat.destroy();`,
      },
      {
        kind: "list",
        items: [
          "The script is about 33 KB gzipped. Named skins load the first time one is used.",
          "When the page has a <oneko-cat> element, or the script tag has data-manual, the script does not add its own cat.",
          "Removing a <oneko-cat> element removes its cat. Removing an attribute returns that option to its default.",
          "A <oneko-cat> element fires a statechange event whose detail.state is the cat's activity.",
        ],
      },
    ],
  },
  {
    id: "frameworks",
    label: "Svelte, Vue, Solid",
    title: "Cats speak Svelte, Vue, and Solid",
    blocks: [
      {
        kind: "text",
        text: "Download one small component into your project. It takes the same props as the React component, follows prop changes, and removes the cat on unmount. The engine loads from the hosted build in the browser, so SvelteKit, Nuxt, and SolidStart can render it during SSR.",
      },
      {
        kind: "code",
        label: "Svelte 5 or SvelteKit",
        language: "bash",
        code: `curl -o src/lib/Oneko.svelte ${DOCS_ORIGIN}/frameworks/Oneko.svelte`,
      },
      {
        kind: "code",
        label: "src/routes/+layout.svelte",
        language: "html",
        code: '<script>\n  import Oneko from "$lib/Oneko.svelte";\n\n  let { children } = $props();\n</script>\n\n<Oneko skin="calico" meow />\n{@render children()}',
      },
      {
        kind: "code",
        label: "Vue 3 or Nuxt",
        language: "bash",
        code: `curl -o src/components/Oneko.vue ${DOCS_ORIGIN}/frameworks/Oneko.vue`,
      },
      {
        kind: "code",
        label: "App.vue",
        language: "html",
        code: '<script setup>\nimport Oneko from "./components/Oneko.vue";\n</script>\n\n<template>\n  <Oneko skin="calico" :speed="12" meow @state-change="console.log" />\n  <RouterView />\n</template>',
      },
      {
        kind: "code",
        label: "Solid or SolidStart",
        language: "bash",
        code: `curl -o src/components/Oneko.tsx ${DOCS_ORIGIN}/frameworks/Oneko.solid.tsx`,
      },
      {
        kind: "code",
        label: "App.tsx",
        language: "tsx",
        code: 'import Oneko from "./components/Oneko";\n\nexport default function App() {\n  return <Oneko skin="calico" meow onStateChange={console.log} />;\n}',
      },
      {
        kind: "list",
        items: [
          "In Nuxt, save the file as components/Oneko.vue and it is auto-imported.",
          "Svelte and Solid take onStateChange as a prop; Vue emits state-change.",
          "Setting a prop to undefined returns that option to its default.",
          "To self-host, serve public/oneko.js and its oneko/ folder yourself and change ONEKO_URL at the top of the component.",
        ],
      },
      {
        kind: "text",
        text: "Angular, Lit, Astro, and other frameworks can use the <oneko-cat> element from the hosted script. In Angular, add CUSTOM_ELEMENTS_SCHEMA to the component's schemas, bind options with [attr.skin], and listen with (statechange).",
      },
      {
        kind: "code",
        label: "Angular template",
        language: "html",
        code: '<oneko-cat [attr.skin]="skin" meow (statechange)="activity = $event.detail.state"></oneko-cat>',
      },
    ],
  },
  {
    id: "options",
    label: "Props",
    title: "Every cat comfort",
    blocks: [
      {
        kind: "text",
        text: 'All props are optional. These are component defaults; the playground starts with sound off and its own cat thought. The cat and laser stop when reduced motion is enabled and return when it is disabled; set reducedMotion="rest" to keep a still, sleeping cat instead. The engine runs at 10fps, so 10 active frames is about one second. Hidden tabs and paused cats do not advance those timers.',
      },
      {
        kind: "text",
        text: "Most props update live. initialPos is mount-only; changing persistPosition, storageKey, zIndex, or the liveStateRef object restarts the animation DOM. Suggested playground ranges are guidance, not automatic clamps unless explicitly stated below.",
      },
    ],
  },
  {
    id: "skins",
    label: "Skins",
    title: "Pick a coat",
    blocks: [
      {
        kind: "text",
        text: "Choose classic, black, gray, calico, tora, catppuccin, ghost, silver, spirit, valentine, maia, vaporwave, ginger, sage, siamese, strawberry-milk, blue-frost, lavender, tuxedo, peach, honey, mocha, mint, or midnight-blue. All skins ship with the full registry; the classic-only item includes classic and supports custom spriteSrc. Neither requires a separate image download. The original 12 sheets are unchanged; 12 generated coat variants are prepared at the same frame size.",
      },
      {
        kind: "code",
        label: "A calico companion",
        language: "tsx",
        code: '<Oneko skin="calico" scale={1.5} rotationAmount={0} meow={false} />',
      },
      {
        kind: "text",
        text: "In the studio (/studio), open Appearance → Use your own sprite to upload a custom PNG (256 × 128 pixels, up to 256 KB) or download the classic sheet as a template. Keep its frame positions: 8 columns and 4 rows of 32 × 32 frames. Uploads stay in your browser and are saved with preferences. Selecting a built-in coat or Reset cat removes the custom sprite. The React example embeds your uploaded image as a data URL; you can also host the PNG and pass its URL through spriteSrc.",
      },
      {
        kind: "code",
        label: "Your own sprite and thoughts",
        language: "tsx",
        code: '<Oneko spriteSrc="/my-sprite.png" bubbleText={["Treat inspection", "On an adventure"]} meow={false} />',
      },
      {
        kind: "text",
        text: "The installer includes docs/oneko-skins.md with artwork provenance. Code is MIT; preserve the artwork credits and review the skin-specific notes when redistributing.",
      },
    ],
  },
  {
    id: "behavior",
    label: "Behavior",
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
    id: "pack",
    label: "Several cats",
    title: "A parade of cats",
    blocks: [
      {
        kind: "text",
        text: 'Mount more than one Oneko. With chase="cat", each cat follows the one mounted before it, and the first one chases the cursor. When the leader naps, cats resting beside it doze off too. Give each cat its own storageKey so their nap spots are saved separately.',
      },
      {
        kind: "code",
        label: "Three cats in a row",
        language: "tsx",
        code: '<Oneko skin="ginger" storageKey="cat:ginger" />\n<Oneko skin="calico" chase="cat" storageKey="cat:calico" />\n<Oneko skin="tuxedo" chase="cat" storageKey="cat:tuxedo" scale={0.5} />',
      },
      {
        kind: "text",
        text: 'The same works with the hosted script: add several <oneko-cat> elements, using chase="cat" on all but the first. Every cat element carries data-oneko-cat; only the first keeps the id oneko-react.',
      },
    ],
  },
  {
    id: "page",
    label: "Page reactions",
    title: "A cat that notices",
    blocks: [
      {
        kind: "code",
        label: "Reacting to the page",
        language: "tsx",
        code: "<Oneko napWhileTyping followFocus perchOnHover />",
      },
      {
        kind: "list",
        items: [
          "napWhileTyping: the cat curls up while visitors write, and wakes when the pointer moves again. With sleepEnabled={false} it sits quietly instead.",
          "followFocus: keyboard users get a companion too. The cat trots to whatever Tab lands on.",
          "perchOnHover: rest the pointer on a link or button and the cat hops on top. Mark other elements with data-oneko-perch.",
          "All three are off by default and can be toggled live.",
        ],
      },
    ],
  },
  {
    id: "play",
    label: "Play",
    title: "Toss, treat, and topple",
    blocks: [
      {
        kind: "code",
        label: "Toys for the cat",
        language: "tsx",
        code: '<Oneko grabbable treats />\n\n<img src="/mug.png" alt="Coffee mug" data-oneko-knockable />\n<div className="shipping-box" data-oneko-box />',
      },
      {
        kind: "list",
        items: [
          "grabbable: drag the cat and let go to toss it. A plain click pets it.",
          "treats: double-click empty space to drop a fish. The nearest cat eats it.",
          "data-oneko-knockable: now and then, a resting cat walks up to the element, stares at you, and paws it off the screen. It returns a few seconds later. Only marked elements are touched, and only with a temporary animation.",
          "data-oneko-box: if it fits, it sits. A resting cat visits the box and naps in it for about 15 seconds. The box must be at least three quarters of the cat wide.",
          "timeOfDay and affection add moods by the clock and greetings for returning visitors. All of these are off by default and can be toggled live.",
        ],
      },
    ],
  },
  {
    id: "tour",
    label: "Tour cat",
    title: "A cat that shows the way",
    blocks: [
      {
        kind: "text",
        text: "Every cat comes with controls: goTo walks to an element, selector, or point and stays there; say shows a bubble now; sit holds still; follow goes back to the cursor; pet and dropTreat do what they say. goTo resolves true on arrival and false if the cat is sent elsewhere first.",
      },
      {
        kind: "code",
        label: "An onboarding tour in React",
        language: "tsx",
        code: '"use client";\n\nimport { useRef } from "react";\nimport Oneko, { type OnekoControls } from "@/components/oneko";\n\nexport function TourCat() {\n  const cat = useRef<OnekoControls>(null);\n  async function tour() {\n    if (await cat.current?.goTo("#pricing")) cat.current?.say("the plans live here");\n    await new Promise((done) => setTimeout(done, 3000));\n    if (await cat.current?.goTo("#signup")) cat.current?.say("click me. I mean, this");\n    setTimeout(() => cat.current?.follow(), 3000);\n  }\n  return (\n    <>\n      <Oneko ref={cat} />\n      <button type="button" onClick={tour}>Show me around</button>\n    </>\n  );\n}',
      },
      {
        kind: "code",
        label: "The same with the hosted script",
        language: "html",
        code: `<oneko-cat id="guide"></oneko-cat>\n<script type="module" src="${DOCS_ORIGIN}/oneko.js"></script>\n<script type="module">\n  const cat = document.querySelector("#guide");\n  await customElements.whenDefined("oneko-cat");\n  if (await cat.goTo("#pricing")) cat.say("the plans live here");\n</script>`,
      },
      {
        kind: "text",
        text: 'createOneko() returns the same controls next to update and destroy. Vue template refs and Svelte bind:this expose them too, and the Solid component takes ref={(controls) => ...}. Add data-oneko-say="text" to any element and the nearest cat comments when the pointer rests on it or keyboard focus lands on it. say() and data-oneko-say speak even when bubbleEnabled is false; data-oneko-say stays quiet when it is off.',
      },
    ],
  },
  {
    id: "seasons",
    label: "Seasons",
    title: "Dressed for the occasion",
    blocks: [
      {
        kind: "text",
        text: "Cats wear a pixel witch hat from October 20 to 31, a Santa hat from December 18 to 29, and a party hat from December 30 to January 2, based on the visitor's local date, with a few themed thoughts mixed in. The hat follows the head in every frame and works with any coat. Set seasonal={false} to opt out, or force a season while testing.",
      },
      {
        kind: "code",
        label: "Preview Halloween today",
        language: "tsx",
        code: '<Oneko seasonal="halloween" />',
      },
    ],
  },
  {
    id: "accessibility",
    label: "Visitor controls",
    title: "Let visitors decide",
    blocks: [
      {
        kind: "text",
        text: "Give visitors a way to send the cat away. setCatsHidden(true) hides every cat on the site, in every open tab, and the choice is remembered in localStorage under oneko:hidden. useCatsHidden() reads it in React.",
      },
      {
        kind: "code",
        label: "A remembered toggle in React",
        language: "tsx",
        code: '"use client";\n\nimport { setCatsHidden, useCatsHidden } from "@/components/oneko";\n\nexport function CatToggle() {\n  const hidden = useCatsHidden();\n  return (\n    <button type="button" aria-pressed={hidden} onClick={() => setCatsHidden(!hidden)}>\n      Hide the cat\n    </button>\n  );\n}',
      },
      {
        kind: "code",
        label: "The same with the hosted script",
        language: "html",
        code: `<script type="module" src="${DOCS_ORIGIN}/oneko.js"></script>\n<button type="button" data-oneko-toggle>Hide the cat</button>`,
      },
      {
        kind: "text",
        text: 'The hosted script keeps aria-pressed on every data-oneko-toggle element in sync and also exports setCatsHidden and areCatsHidden. Add pettable to make the cat a "Pet the cat" button that keyboard and screen-reader users can reach. It holds still while focused; Enter or Space pets it.',
      },
    ],
  },
  {
    id: "bubbles",
    label: "Bubbles",
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
    label: "Zones",
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
    label: "Sounds",
    title: "Purrs are optional",
    blocks: [
      {
        kind: "text",
        text: "Sound is off by default, and the registry does not include audio files. The quickest way to enable it is to set meow and point soundBasePath at the hosted copy. To self-host instead, copy public/cat-sounds/ from the source repository into your app’s public assets, preserving the .ogg filenames. Browsers may require user interaction before audio can play.",
      },
      {
        kind: "code",
        label: "Hosted sounds, no files to copy",
        language: "tsx",
        code: `<Oneko meow soundBasePath="${DOCS_ORIGIN}/cat-sounds" />`,
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
    id: "studio",
    label: "Studio",
    title: "Presets and sharing",
    blocks: [
      {
        kind: "text",
        text: "In the studio's Behavior tab, Sleepy, Curious, and Playful presets adjust movement settings. They preserve artwork, thoughts, sound, pause, cursor-follow, nap, and visibility choices. The selected preset follows the current slider values; presets do not add a runtime prop.",
      },
      {
        kind: "text",
        text: "In Export, Copy share link opens a built-in coat and settings in the studio. The configuration stays in the URL fragment and is limited to 8192 characters. Shared settings take precedence over saved browser preferences on load. Invalid links leave saved preferences intact.",
      },
      {
        kind: "text",
        text: "Download configuration includes every setting, thought, and custom sprite. Import configuration accepts a versioned JSON file up to 512 KB and replaces the current settings, including sound and visibility. Invalid versions, settings, or artwork leave your cat unchanged. Custom sprites and oversized configurations use files instead of share links.",
      },
    ],
  },
  {
    id: "persistence",
    label: "Persistence",
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
        text: "Only position is saved, using a versioned pair of finite coordinates. Valid legacy positions are migrated; malformed values and stored animation internals are ignored. Restored positions are clamped to the viewport. Saving runs when the page hides, on pagehide, and on component cleanup. Storage failures are ignored. A saved spot takes precedence over initialPos. Use persistPosition={false} for a predictable starting position or when saving is unwanted.",
      },
      {
        kind: "text",
        text: "The component does not save its configuration props. The hosted playground separately remembers its controls under oneko:playground:v1. Copy your cat in the instantly available install panel exports your selected configuration. Open customization and install panels keep the cat outside; zone sample spots sit below the controls.",
      },
    ],
  },
  {
    id: "events",
    label: "Events",
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
        text: "onPet, onCatchCursor, onSleep, onToss, and onTreat report moments worth celebrating. With the hosted script, listen for pet, catchcursor, sleep, toss, and treat events on the <oneko-cat> element; the details match the callbacks. Vue components emit pet, catchCursor, sleep, toss, and treat.",
      },
      {
        kind: "code",
        label: "Count catches",
        language: "tsx",
        code: "<Oneko onCatchCursor={() => setCatches((count) => count + 1)} onPet={({ affection }) => setAffection(affection)} affection />",
      },
      {
        kind: "text",
        text: "CatLiveState exposes activity, position, speed, idle ticks, cursor distance, total ticks, zoomies status/time, bubble visibility, and nearby movement information. Public types OnekoProps, OnekoControls, OnekoSeason, OnekoSkin, OnekoZone, CatActivityState, and CatLiveState are exported from @/components/oneko.",
      },
    ],
  },
  {
    id: "agents",
    label: "Coding agents",
    title: "Let an agent bring the cat",
    blocks: [
      {
        kind: "text",
        text: "Copy this prompt into your coding agent with your project open. It points to the same documentation in Markdown, gives the exact install command, and asks the agent to adapt to your existing app.",
      },
      {
        kind: "code",
        label: "Prompt for your coding agent",
        language: "text",
        code: AGENT_PROMPT,
      },
      {
        kind: "text",
        text: "Agents can read /llms.txt for discovery, /docs.md or /llms-full.txt for the complete guide, and /r/oneko.json for the installable source. These resources are public and need no login. The HTML guide is rendered on the server, so it is readable without JavaScript.",
      },
    ],
  },
  {
    id: "troubleshooting",
    label: "Troubleshooting",
    title: "Help your cat settle in",
    blocks: [
      {
        kind: "list",
        items: [
          'No cat? Check that it is mounted in the browser. With reduced motion, the cat is hidden unless reducedMotion="rest". Keep-out zones covering the whole viewport can also hide it.',
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
    parts.push(`## ${section.label}: ${section.title}\n`);
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
