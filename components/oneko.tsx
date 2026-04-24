"use client";

/**
 * Playground implementation — the classic “cat follows the cursor” idea comes from
 * oneko.js (MIT): https://github.com/adryd325/oneko.js/
 */

import { useEffect, useRef } from "react";

export type CatActivityState =
  | "idle"
  | "moving"
  | "sleeping"
  | "scratchSelf"
  | "tired"
  | "alert"
  | "scratchWallN"
  | "scratchWallS"
  | "scratchWallE"
  | "scratchWallW"
  | "freerun";

type IdleActivityState = Exclude<CatActivityState, "idle" | "moving" | "freerun">;

export interface CatLiveState {
  state: CatActivityState;
  posX: number;
  posY: number;
  velMag: number;
  idleTime: number;
  distToMouse: number;
  frameCount: number;
  freerunActive: boolean;
  freerunTimer: number;
  bubbleVisible: boolean;
  pathLength: number;
  obstacleCount: number;
}

export interface OnekoProps {
  persistPosition?: boolean;
  zIndex?: number;
  initialPos?: { x: number; y: number };
  speed?: number;
  scale?: number;
  opacity?: number;
  rotationAmount?: number;
  idleThreshold?: number;
  meow?: boolean;
  onStateChange?: (state: CatActivityState) => void;
  /** Probability per frame cat enters freerun mode (0–1). Default 0.06 */
  freerunChance?: number;
  /** Duration of freerun in frames. Default 40 */
  freerunDuration?: number;
  /** Whether chat bubbles are enabled. Default true */
  bubbleEnabled?: boolean;
  /** How many frames a bubble stays visible. Default 180 */
  bubbleDisplayFrames?: number;
  /** Cooldown frames between bubbles. Default 120 */
  bubbleCooldown?: number;
  /** CSS hue-rotate degrees (0–360). Default 0 */
  hueRotate?: number;
  /** Mutable ref that oneko writes live state to every frame */
  liveStateRef?: { current: CatLiveState };
  /** Bubble trigger probability while idle (0–1). Default 0.5 */
  bubbleChance?: number;
  /** Distance in px at which cat stops chasing cursor. Default 20 */
  followDistance?: number;
  /** Multiplier for idle animation speed (0.5–2). Default 1 */
  animationSpeed?: number;
  /** Custom text injected into the idle bubble message pool */
  bubbleText?: string;
  /** Sound volume (0–1). Default 0.5 */
  volume?: number;
  /** Show a red laser dot in place of the system cursor. Default false */
  laserPointer?: boolean;
}

interface ObstacleRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface PathPoint {
  x: number;
  y: number;
}

const TILE = 32;
const DEFAULT_Z_INDEX = 2_147_483_646;

const ORIGINAL_GIF_URL = "https://raw.githubusercontent.com/adryd325/oneko.js/main/oneko.gif";

// Movement config
const STEER_LERP = 0.3;
const MAX_VEL_FACTOR = 1.5;

// Obstacle config
const OBSTACLE_INTERVAL = 30;
const MIN_OBSTACLE_AREA = 500;
const OBSTACLE_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,blockquote,a,button,img,svg,picture,video,nav,header,label,[role='button'],[data-oneko-obstacle]";

// Grid / route config
const CELL_SIZE = 16;
const SPRITE_RADIUS = 8;
const PATH_RECALC_INTERVAL = 10;
const PATH_RECALC_MOUSE_CELLS = 2;
const WAYPOINT_REACH_DIST = CELL_SIZE;

// Chat bubble config
const BUBBLE_DISPLAY_FRAMES = 180;
const BUBBLE_COOLDOWN_FRAMES = 120;
/** Pixels between mouse samples before we treat movement as a new heading */
const MOUSE_LOOP_MIN_STEP = 5;
/** Total radians of cursor-heading spin to count as “going in circles” */
const MOUSE_LOOP_WINDING_TRIGGER = 6.2;
/** Soft cap so winding doesn’t run away (about two full spins) */
const MOUSE_LOOP_WINDING_CAP = 13;
/** Per logic frame decay so old spinning fades out */
const MOUSE_LOOP_WINDING_DECAY = 0.96;
const IDLE_MESSAGES = [
  "I am a curious cat Myra",
  "waiting is an art form",
  "pixels are just tiny warm squares",
  "I see the cursor. I simply do not care",
  "404: motivation not found",
  "contemplating the void...",
  "this spot is mine now",
  "do not disturb. cat at work",
  "I could move. but why",
  "every pixel is a potential nap spot",
  "hooman scroll too much",
  "loading personality... 12%",
  "technically I'm working",
  "I'm not staring. I'm supervising",
  "existential crisis in 3... 2...",
  "local cat does nothing, is perfect",
  "this is my emotional support pixel",
  "I have opinions about your CSS",
  "the internet is my territory",
  "your scroll speed is offensive",
  "have you tried turning it off and on again",
  "I don't do mornings. or afternoons",
  "this viewport could use more cat",
  "meow means meow",
  "I live here now. deal with it",
  "my attention span is... oh look a pixel",
  "human. hooman. same thing. irrelevant.",
  "running on 1% battery and pure spite",
  "I accept tribute in the form of attention",
];
const MOVING_MESSAGES = [
  "stalking the cursor like it's prey",
  "tiny hunter, big ambitions",
  "tail up, confidence higher",
  "pat pat pat — stealth engaged",
  "whiskers first, questions later",
  "almost caught it... almost",
  "following my favorite hooman",
  "zoomies (polite edition)",
  "this carpet has excellent traction",
  "ear twitch: target acquired",
  "main character energy, four paws",
  "excuse me, I'm busy chasing vibes",
  "the dot moved, I moved — it's science",
  "low crouch, high drama",
  "slink mode: activated",
  "padding along with purpose",
  "if I fits, I sprints",
  "practicing my runway walk",
  "big stretch, bigger chase",
  "focused. fluffy. unstoppable.",
  "trotting toward mild chaos",
  "pounce trajectory: instinct only",
  "hunting the invisible red dot",
  "catch me if you can (you can't)",
  "left paw, right paw, repeat",
  "look at me go!",
  "I'm not lost, I'm exploring",
  "on my way... eventually",
  "they call it wandering, I call it art",
  "my paws are doing their best",
];
const CIRCLE_LOOP_MESSAGES = [
  "dizzy hooman detected",
  "are we training for the Olympics",
  "this is not a merry-go-round",
  "pick a direction. any direction.",
  "my inner ear is offended",
  "stop orbiting me like a moon",
  "you're making the room spin",
  "that's enough circles for one day",
  "I'm getting motion sickness up here",
  "chasing your own tail much?",
  "whiskers say: please stop the loop",
  "clockwise, counter… pick one forever",
  "the cursor is not a hula hoop",
  "I can't settle on a nap with this chaos",
  "tiny circles, big drama",
  "you're stressing the carpet out",
  "I'm a cat not a centrifuge",
  "round and round we do NOT go",
  "save some spins for the washing machine",
  "my brain is doing donuts too now",
  "vertical tail = concerned",
  "this is a desk not a racetrack",
  "I need a ginger snap for my tummy",
  "hooman.exe has entered spin cycle",
  "one lap was cute. this is a lot.",
  "the red dot retired. you replaced it.",
];
const SLEEPING_MESSAGES = [
  "zzz...",
  "five more minutes...",
  "dreaming of fish",
  "according to my calculations... nap time",
  "nap.exe has stopped working",
  "the mouse will wait. it always does",
  "sleep is the best superpower",
  "do not wake the cat",
  "currently offline",
  "battery at 2%",
  "in a meeting (with my pillow)",
  "auto-reply: gone fishing (in my dreams)",
  "shhh... genius at rest",
  "consciousness is overrated",
  "nap-driven development",
  "out of office until further notice",
  "REM cycle in progress",
  "do not disturb sign: activated",
  "napping is my cardio",
  "subconscious loading...",
  "snore.wav playing",
  "zoning out professionally",
  "dreams: 100%, productivity: 0%",
  "powered off. goodbye.",
  "the pillow is winning",
];
const SCRATCHING_MESSAGES = [
  "itchy spot right here",
  "don't judge me",
  "self-care is important",
  "spa day!",
  "found a speck... on me",
  "adjusting the floof distribution",
  "something tickled under the fur",
  "scratching away a whole Tuesday",
  "exfoliating like a pro",
  "this is a feature not a bug",
];
const TIRED_MESSAGES = [
  "I need a mass break",
  "running on vibes and caffeine",
  "can someone carry me",
  "this is exhausting",
  "why is the cursor so far",
  "legs.exe needs an update",
  "low power mode activated",
  "I'm too pretty for this",
  "yawn... where was I going",
  "energy level: potato",
];
const WALL_SCRATCH_MESSAGES = [
  "this wall has it coming",
  "redecorating!",
  "abstract art in progress",
  "your walls needed texture",
  "sharpening my claws for later",
  "leaving my mark on this windowsill",
  "vandalism? I call it expression",
  "the wall started it",
  "claiming this territory",
  "I do my best work on walls",
];
const ALERT_MESSAGES = [
  "what was that?!",
  "I heard something!",
  "ears: activated",
  "threat level: probably nothing",
  "investigating...",
  "something moved!",
  "on high alert!",
  "defense mode engaged",
  "my spidey senses are tingling",
  "I swear I saw something",
];

const FREERUN_MESSAGES = [
  "I don't follow rules ya silly hooman",
  "corners are optional in my book",
  "watch me ignore the floor plan",
  "obstacles? you mean decorations?",
  "rules are for dogs",
  "I go where I please",
  "your furniture layout is a suggestion",
  "try to stop me hooman",
  "boundaries are a social construct",
  "I am the monarch of this room",
  "shortcut time!",
  "physics is optional... probably",
  "forbidden spots taste better",
  "you can't out-sneak a cat",
  "slipping through impossible gaps",
  "walls are just vertical carpets",
  "catch me if you can",
  "ghost mode: highly unsneaky",
  "free roam, full drama",
];
const FREERUN_CHANCE = 0.06;
const FREERUN_DURATION = 40;
const DEFAULT_SPEED = 10;
const DEFAULT_SCALE = 1;
const DEFAULT_OPACITY = 1;
const DEFAULT_ROTATION_AMOUNT = 15;
const DEFAULT_IDLE_THRESHOLD_MS = 1000;
const DEFAULT_VOLUME = 0.5;
const DEFAULT_BUBBLE_CHANCE = 0.5;
const DEFAULT_FOLLOW_DISTANCE = 20;
const DEFAULT_ANIMATION_SPEED = 1;

// Played once when the cat catches the laser dot
const LASER_CATCH_POOL = ["/cat-sounds/Cat_eat1.ogg", "/cat-sounds/Cat_eat2.ogg"];

// Sound pools keyed by activity label
const HISS_POOL = [
  "/cat-sounds/Cat_hiss1.ogg",
  "/cat-sounds/Cat_hiss2.ogg",
  "/cat-sounds/Cat_hiss3.ogg",
];
const SOUND_POOLS: Record<CatActivityState, string[]> = {
  idle: [
    "/cat-sounds/Cat_idle1.ogg",
    "/cat-sounds/Cat_idle2.ogg",
    "/cat-sounds/Cat_idle3.ogg",
    "/cat-sounds/Cat_idle4.ogg",
  ],
  moving: [
    "/cat-sounds/Cat_baby_ambient1.ogg",
    "/cat-sounds/Cat_baby_ambient2.ogg",
    "/cat-sounds/Cat_baby_ambient3.ogg",
    "/cat-sounds/Cat_baby_ambient4.ogg",
    "/cat-sounds/Cat_baby_ambient5.ogg",
    "/cat-sounds/Cat_baby_ambient6.ogg",
    "/cat-sounds/Cat_baby_ambient7.ogg",
  ],
  sleeping: ["/cat-sounds/Cat_purr1.ogg", "/cat-sounds/Cat_purr2.ogg", "/cat-sounds/Cat_purr3.ogg"],
  scratchSelf: ["/cat-sounds/Cat_beg1.ogg", "/cat-sounds/Cat_beg2.ogg", "/cat-sounds/Cat_beg3.ogg"],
  scratchWallN: HISS_POOL,
  scratchWallS: HISS_POOL,
  scratchWallE: HISS_POOL,
  scratchWallW: HISS_POOL,
  tired: ["/cat-sounds/Cat_purreow1.ogg", "/cat-sounds/Cat_purreow2.ogg"],
  freerun: [
    "/cat-sounds/Cat_royal_ambient1.ogg",
    "/cat-sounds/Cat_royal_ambient2.ogg",
    "/cat-sounds/Cat_royal_ambient3.ogg",
    "/cat-sounds/Cat_royal_ambient4.ogg",
    "/cat-sounds/Cat_royal_ambient5.ogg",
    "/cat-sounds/Cat_royal_ambient6.ogg",
  ],
  alert: [
    "/cat-sounds/Stray_cat_idle1.ogg",
    "/cat-sounds/Stray_cat_idle2.ogg",
    "/cat-sounds/Stray_cat_idle3.ogg",
    "/cat-sounds/Stray_cat_idle4.ogg",
  ],
};

// Konami code
const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];
const KONAMI_TARGET = KONAMI_SEQUENCE.join(",");

// Direction table — module-level so it's not re-allocated every frame
const DIRECTION_RANGES = [
  { min: -22.5, max: 22.5, dir: "E" },
  { min: 22.5, max: 67.5, dir: "SE" },
  { min: 67.5, max: 112.5, dir: "S" },
  { min: 112.5, max: 157.5, dir: "SW" },
  { min: -157.5, max: -112.5, dir: "NW" },
  { min: -112.5, max: -67.5, dir: "N" },
  { min: -67.5, max: -22.5, dir: "NE" },
] as const;

// 8-directional neighbor offsets: [rowDelta, colDelta, movementCost]
const NEIGHBOR_OFFSETS: [number, number, number][] = [
  [-1, 0, 1.0],
  [1, 0, 1.0],
  [0, -1, 1.0],
  [0, 1, 1.0],
  [-1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [1, 1, Math.SQRT2],
];

function collectObstacles(): ObstacleRect[] {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rects: ObstacleRect[] = [];

  for (const node of document.querySelectorAll(OBSTACLE_SELECTOR)) {
    const r = node.getBoundingClientRect();
    if (r.width * r.height < MIN_OBSTACLE_AREA) {
      continue;
    }
    if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) {
      continue;
    }
    if (r.width > vw * 0.85 && r.height > vh * 0.5) {
      continue;
    }
    rects.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  }

  return rects;
}

function buildGrid(rects: ObstacleRect[], cols: number, rows: number): Uint8Array {
  const grid = new Uint8Array(cols * rows);

  for (const rect of rects) {
    const c0 = Math.max(0, Math.floor((rect.left - SPRITE_RADIUS) / CELL_SIZE));
    const c1 = Math.min(cols - 1, Math.ceil((rect.right + SPRITE_RADIUS) / CELL_SIZE));
    const r0 = Math.max(0, Math.floor((rect.top - SPRITE_RADIUS) / CELL_SIZE));
    const r1 = Math.min(rows - 1, Math.ceil((rect.bottom + SPRITE_RADIUS) / CELL_SIZE));

    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        grid[row * cols + col] = 1;
      }
    }
  }

  return grid;
}

function worldToCell(worldX: number, worldY: number, cols: number, rows: number): number {
  const col = Math.max(0, Math.min(cols - 1, Math.floor(worldX / CELL_SIZE)));
  const row = Math.max(0, Math.min(rows - 1, Math.floor(worldY / CELL_SIZE)));
  return row * cols + col;
}

function cellToWorld(idx: number, cols: number): PathPoint {
  return {
    x: ((idx % cols) + 0.5) * CELL_SIZE,
    y: (Math.floor(idx / cols) + 0.5) * CELL_SIZE,
  };
}

function nearestWalkable(startIdx: number, grid: Uint8Array, cols: number, rows: number): number {
  if (grid[startIdx] === 0) {
    return startIdx;
  }

  const visited = new Uint8Array(grid.length);
  const queue: number[] = [startIdx];
  visited[startIdx] = 1;
  let head = 0;

  while (head < queue.length) {
    const idx = queue[head++];
    const r = Math.floor(idx / cols);
    const c = idx % cols;

    for (const [dr, dc] of NEIGHBOR_OFFSETS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
        continue;
      }
      const nIdx = nr * cols + nc;
      if (visited[nIdx]) {
        continue;
      }
      visited[nIdx] = 1;
      if (grid[nIdx] === 0) {
        return nIdx;
      }
      queue.push(nIdx);
    }
  }

  return startIdx;
}

function heapBubble(data: [number, number][], i: number): void {
  let idx = i;
  while (idx > 0) {
    const parent = Math.floor((idx - 1) / 2);
    if (data[parent][0] <= data[idx][0]) {
      break;
    }
    const tmp = data[parent];
    data[parent] = data[idx];
    data[idx] = tmp;
    idx = parent;
  }
}

function heapSink(data: [number, number][], i: number): void {
  const n = data.length;
  let idx = i;

  for (let step = 0; step < n; step++) {
    let smallest = idx;
    const left = 2 * idx + 1;
    const right = 2 * idx + 2;
    if (left < n && data[left][0] < data[smallest][0]) {
      smallest = left;
    }
    if (right < n && data[right][0] < data[smallest][0]) {
      smallest = right;
    }
    if (smallest === idx) {
      break;
    }
    const tmp = data[smallest];
    data[smallest] = data[idx];
    data[idx] = tmp;
    idx = smallest;
  }
}

function smoothPath(rawPath: number[], cols: number): PathPoint[] {
  const points = rawPath.map((idx) => cellToWorld(idx, cols));
  if (points.length <= 2) {
    return points;
  }

  const result: PathPoint[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result.at(-1) as PathPoint;
    const cur = points[i];
    const next = points[i + 1];
    const cross = (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x);
    if (Math.abs(cross) > 1e-6) {
      result.push(cur);
    }
  }

  result.push(points.at(-1) as PathPoint);
  return result;
}

function findRoute(
  startIdx: number,
  goalIdx: number,
  grid: Uint8Array,
  cols: number,
  rows: number,
): PathPoint[] {
  if (startIdx === goalIdx) {
    return [cellToWorld(startIdx, cols)];
  }

  const dist = new Float32Array(grid.length).fill(Number.POSITIVE_INFINITY);
  const prev = new Int32Array(grid.length).fill(-1);
  const heap: [number, number][] = [];

  dist[startIdx] = 0;
  heap.push([0, startIdx]);

  while (heap.length > 0) {
    const top = heap.at(0) as [number, number];
    const last = heap.at(-1) as [number, number];
    heap[0] = last;
    heap.pop();
    heapSink(heap, 0);

    const [cost, idx] = top;
    if (idx === goalIdx) {
      break;
    }
    if (cost > dist[idx]) {
      continue;
    }

    const r = Math.floor(idx / cols);
    const c = idx % cols;

    for (const [dr, dc, edgeCost] of NEIGHBOR_OFFSETS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
        continue;
      }
      const nIdx = nr * cols + nc;
      if (grid[nIdx] === 1) {
        continue;
      }
      const newDist = dist[idx] + edgeCost;
      if (newDist < dist[nIdx]) {
        dist[nIdx] = newDist;
        prev[nIdx] = idx;
        heap.push([newDist, nIdx]);
        heapBubble(heap, heap.length - 1);
      }
    }
  }

  if (!Number.isFinite(dist[goalIdx])) {
    return [];
  }

  const rawPath: number[] = [];
  let cur = goalIdx;
  while (cur !== -1) {
    rawPath.push(cur);
    cur = prev[cur];
  }
  rawPath.reverse();

  return smoothPath(rawPath, cols);
}

const defaultSpriteSets = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [
    [-5, 0],
    [-6, 0],
    [-7, 0],
  ],
  scratchWallN: [
    [0, 0],
    [0, -1],
  ],
  scratchWallS: [
    [-7, -1],
    [-6, -2],
  ],
  scratchWallE: [
    [-2, -2],
    [-2, -3],
  ],
  scratchWallW: [
    [-4, 0],
    [-4, -1],
  ],
  tired: [[-3, -2]],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  N: [
    [-1, -2],
    [-1, -3],
  ],
  NE: [
    [0, -2],
    [0, -3],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  SE: [
    [-5, -1],
    [-5, -2],
  ],
  S: [
    [-6, -3],
    [-7, -2],
  ],
  SW: [
    [-5, -3],
    [-6, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
  NW: [
    [-1, 0],
    [-1, -1],
  ],
} as const;

const IDLE_ANIMATION_DURATIONS: Record<string, number> = {
  sleeping: 80,
  scratchSelf: 24,
  tired: 40,
  scratchWallN: 24,
  scratchWallS: 24,
  scratchWallE: 24,
  scratchWallW: 24,
};

export default function Oneko({
  persistPosition = true,
  /** One below max so fixed UI can sit above the cat. */
  zIndex = DEFAULT_Z_INDEX,
  initialPos,
  speed = DEFAULT_SPEED,
  scale = DEFAULT_SCALE,
  opacity = DEFAULT_OPACITY,
  rotationAmount = DEFAULT_ROTATION_AMOUNT,
  idleThreshold = DEFAULT_IDLE_THRESHOLD_MS,
  meow = true,
  onStateChange,
  freerunChance = FREERUN_CHANCE,
  freerunDuration = FREERUN_DURATION,
  bubbleEnabled = true,
  bubbleDisplayFrames = BUBBLE_DISPLAY_FRAMES,
  bubbleCooldown = BUBBLE_COOLDOWN_FRAMES,
  hueRotate = 0,
  liveStateRef,
  bubbleChance = DEFAULT_BUBBLE_CHANCE,
  followDistance = DEFAULT_FOLLOW_DISTANCE,
  animationSpeed = DEFAULT_ANIMATION_SPEED,
  bubbleText = "",
  volume = DEFAULT_VOLUME,
  laserPointer = false,
}: OnekoProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const lastStateRef = useRef<CatActivityState>("idle");
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const defaultPos = {
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 512,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 384,
  };

  const stateRef = useRef({
    nekoPosX: initialPos?.x ?? defaultPos.x,
    nekoPosY: initialPos?.y ?? defaultPos.y,
    nekoVelX: 0,
    nekoVelY: 0,
    mousePosX: initialPos?.x ?? defaultPos.x,
    mousePosY: initialPos?.y ?? defaultPos.y,
    frameCount: 0,
    idleTime: 0,
    idleAnimation: null as IdleActivityState | null,
    idleAnimationFrame: 0,
    lastFrameTimestamp: 0,
    obstacleRects: [] as ObstacleRect[],
    lastObstacleRefresh: -OBSTACLE_INTERVAL,
    // Grid / route data
    grid: null as Uint8Array | null,
    gridCols: 0,
    gridRows: 0,
    currentPath: [] as PathPoint[],
    pathWaypointIdx: 0,
    lastPathRecalcFrame: -PATH_RECALC_INTERVAL,
    lastPathTargetCol: -1,
    lastPathTargetRow: -1,
    // Debug
    debugMode: false,
    paused: false,
    stateLocked: false,
    noFollow: false,
    currentSpeed: speed,
    // Customization
    scale: scale,
    opacity: opacity,
    rotationAmount: rotationAmount,
    idleThresholdMs: idleThreshold,
    freerunChanceCfg: freerunChance,
    freerunDurationCfg: freerunDuration,
    bubbleEnabledCfg: bubbleEnabled,
    bubbleDisplayFramesCfg: bubbleDisplayFrames,
    bubbleCooldownFramesCfg: bubbleCooldown,
    bubbleChanceCfg: bubbleChance,
    followDistanceCfg: followDistance,
    animationSpeedCfg: animationSpeed,
    customBubbleText: bubbleText,
    currentRotation: 0,
    // Audio
    enableMeow: meow,
    soundVolumeCfg: volume,
    soundCooldown: 0,
    // Chat bubble
    bubbleTimer: 0,
    bubbleCooldown: 0,
    bubbleVisible: false,
    lastBubbleMsg: -1,
    // Mouse “spinning in circles” (velocity heading winding)
    loopPrevAngle: null as number | null,
    mouseCircleWinding: 0,
    // Freerun
    freerunMode: false,
    freerunTimer: 0,
    lastFreerunMsg: -1,
    // Laser pointer
    laserPointerCfg: laserPointer,
    laserCaught: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    if (prefersReduced) {
      return;
    }

    const createElement = () => {
      const el = document.createElement("div");
      el.id = "oneko-react";
      el.setAttribute("aria-hidden", "true");
      el.style.width = `${TILE}px`;
      el.style.height = `${TILE}px`;
      el.style.position = "fixed";
      el.style.pointerEvents = "none";
      el.style.imageRendering = "pixelated";
      el.style.left = `${stateRef.current.nekoPosX - TILE / 2}px`;
      el.style.top = `${stateRef.current.nekoPosY - TILE / 2}px`;
      el.style.zIndex = String(zIndex);
      el.style.backgroundImage = `url(${ORIGINAL_GIF_URL})`;
      el.style.backgroundRepeat = "no-repeat";
      el.style.transform = `scale(${scale})`;
      el.style.opacity = String(opacity);
      return el;
    };

    const SVG_NS = "http://www.w3.org/2000/svg";
    const debugColor = {
      panelBg: "color-mix(in srgb, var(--background) 88%, transparent)",
      panelBorder: "color-mix(in srgb, var(--border) 70%, transparent)",
      panelText: "var(--foreground)",
      panelSubtle: "var(--muted-foreground)",
      controlBg: "color-mix(in srgb, var(--muted) 72%, transparent)",
      controlBorder: "var(--border)",
      accent: "var(--ring)",
      accentStrong: "var(--primary)",
      danger: "var(--destructive)",
      dangerSoft: "color-mix(in srgb, var(--destructive) 30%, transparent)",
      trail: "color-mix(in srgb, var(--ring) 60%, transparent)",
      trailDot: "color-mix(in srgb, var(--ring) 76%, transparent)",
      gridStroke: "color-mix(in srgb, var(--muted-foreground) 18%, transparent)",
    };

    const createDebugSVG = () => {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("aria-hidden", "true");
      svg.style.position = "fixed";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.width = "100vw";
      svg.style.height = "100vh";
      svg.style.pointerEvents = "none";
      svg.style.zIndex = String(zIndex - 1);
      svg.style.display = "none";

      const defs = document.createElementNS(SVG_NS, "defs");
      const pattern = document.createElementNS(SVG_NS, "pattern");
      pattern.id = "oneko-grid";
      pattern.setAttribute("width", String(CELL_SIZE));
      pattern.setAttribute("height", String(CELL_SIZE));
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      const patternRect = document.createElementNS(SVG_NS, "rect");
      patternRect.setAttribute("width", String(CELL_SIZE));
      patternRect.setAttribute("height", String(CELL_SIZE));
      patternRect.setAttribute("fill", "none");
      patternRect.setAttribute("stroke", debugColor.gridStroke);
      patternRect.setAttribute("stroke-width", "0.5");
      pattern.appendChild(patternRect);
      defs.appendChild(pattern);
      svg.appendChild(defs);

      // Grid background rect
      const gridBg = document.createElementNS(SVG_NS, "rect");
      gridBg.setAttribute("width", "100%");
      gridBg.setAttribute("height", "100%");
      gridBg.setAttribute("fill", "url(#oneko-grid)");
      svg.appendChild(gridBg);

      // Groups for layered content
      const blockedGroup = document.createElementNS(SVG_NS, "g");
      blockedGroup.id = "oneko-blocked";
      svg.appendChild(blockedGroup);

      const obstacleGroup = document.createElementNS(SVG_NS, "g");
      obstacleGroup.id = "oneko-obstacles";
      svg.appendChild(obstacleGroup);

      const pathGroup = document.createElementNS(SVG_NS, "g");
      pathGroup.id = "oneko-path";
      svg.appendChild(pathGroup);

      return svg;
    };

    const createBubble = () => {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("aria-hidden", "true");
      wrapper.style.position = "fixed";
      wrapper.style.pointerEvents = "none";
      wrapper.style.zIndex = String(zIndex);
      wrapper.style.opacity = "0";
      wrapper.style.transition = "opacity 0.2s ease-out";
      wrapper.style.transform = "translateX(-50%)";
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.outline = "none";

      const bubble = document.createElement("div");
      bubble.style.padding = "4px 8px";
      bubble.style.borderRadius = "8px";
      bubble.style.boxSizing = "border-box";
      bubble.style.fontSize = "10px";
      bubble.style.lineHeight = "1.25";
      bubble.style.fontWeight = "500";
      bubble.style.fontFamily = "var(--font-geist-pixel-square), monospace";
      bubble.style.color = "var(--foreground)";
      bubble.style.backgroundColor = "var(--background)";
      bubble.style.border = "1px solid var(--border)";
      bubble.style.maxWidth = "150px";
      bubble.style.width = "max-content";
      bubble.style.whiteSpace = "normal";
      bubble.style.wordBreak = "break-word";
      bubble.style.outline = "none";
      wrapper.appendChild(bubble);

      // Comic tail — SVG so stroke weight matches the bubble border (CSS triangles skew thinner).
      const tailWrap = document.createElement("div");
      tailWrap.style.position = "relative";
      tailWrap.style.lineHeight = "0";
      tailWrap.style.flexShrink = "0";
      tailWrap.style.outline = "none";

      const tailSvg = document.createElementNS(SVG_NS, "svg");
      tailSvg.setAttribute("width", "12");
      tailSvg.setAttribute("height", "7");
      tailSvg.setAttribute("viewBox", "0 0 12 7");
      tailSvg.setAttribute("overflow", "visible");
      tailSvg.style.display = "block";
      tailSvg.style.outline = "none";

      const tailPath = document.createElementNS(SVG_NS, "path");
      tailPath.setAttribute("d", "M 6 7 L 1.5 1.5 L 10.5 1.5 Z");
      tailPath.setAttribute("fill", "var(--background)");
      tailPath.setAttribute("stroke", "var(--border)");
      tailPath.setAttribute("stroke-width", "1");
      tailPath.setAttribute("stroke-linejoin", "miter");
      tailPath.setAttribute("stroke-linecap", "butt");
      tailPath.setAttribute("stroke-miterlimit", "2");
      // Draw stroke under fill so antialiasing does not read as a second inner outline.
      tailPath.style.paintOrder = "stroke fill";
      tailSvg.appendChild(tailPath);
      tailWrap.appendChild(tailSvg);

      wrapper.appendChild(tailWrap);

      return { wrapper, textEl: bubble, tailWrap };
    };

    const createDebugHUD = () => {
      const hud = document.createElement("div");
      hud.setAttribute("aria-hidden", "true");
      hud.style.pointerEvents = "none";
      hud.style.fontFamily = "var(--font-mono), monospace";
      hud.style.fontSize = "11px";
      hud.style.lineHeight = "1.6";
      hud.style.padding = "10px 14px";
      hud.style.borderRadius = "6px";
      hud.style.backgroundColor = debugColor.panelBg;
      hud.style.border = `1px solid ${debugColor.panelBorder}`;
      hud.style.color = debugColor.panelText;
      hud.style.width = "190px";
      return hud;
    };

    const createDebugControls = () => {
      const panel = document.createElement("div");
      panel.setAttribute("aria-hidden", "true");
      panel.style.userSelect = "none";
      panel.style.pointerEvents = "auto";

      const BASE_STYLE = [
        "font-family:var(--font-mono), monospace",
        "font-size:11px",
        "line-height:1.6",
        "border-radius:6px",
        `background:${debugColor.panelBg}`,
        `border:1px solid ${debugColor.panelBorder}`,
        `color:${debugColor.panelText}`,
        "width:190px",
      ].join(";");

      const btnStyle = [
        `background:${debugColor.controlBg}`,
        `border:1px solid ${debugColor.controlBorder}`,
        `color:${debugColor.panelText}`,
        "border-radius:4px",
        "padding:2px 8px",
        "font-family:inherit",
        "font-size:11px",
        "cursor:pointer",
      ].join(";");

      const selectStyle = [
        `background:${debugColor.controlBg}`,
        `border:1px solid ${debugColor.controlBorder}`,
        `color:${debugColor.panelText}`,
        "border-radius:4px",
        "padding:2px 4px",
        "font-family:inherit",
        "font-size:11px",
        "cursor:pointer",
        "flex:1",
      ].join(";");

      const sectionLabel = (text: string) => {
        const d = document.createElement("div");
        d.textContent = text;
        d.style.cssText = `color:${debugColor.panelSubtle};font-weight:bold;margin-top:8px;margin-bottom:3px;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;`;
        return d;
      };

      const makeRow = (...children: HTMLElement[]) => {
        const r = document.createElement("div");
        r.style.cssText = "display:flex;gap:4px;align-items:center;margin-bottom:3px;";
        for (const c of children) {
          r.appendChild(c);
        }
        return r;
      };

      const makeBtn = (label: string, onClick: () => void) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.style.cssText = btnStyle;
        btn.addEventListener("click", onClick);
        return btn;
      };

      // ── Header (toggle row) ───────────────────────────────────
      const header = document.createElement("div");
      header.style.cssText = `${BASE_STYLE};padding:6px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;`;

      const headerTitle = document.createElement("span");
      headerTitle.textContent = "controls";
      headerTitle.style.cssText = `font-weight:bold;font-size:10px;letter-spacing:0.05em;text-transform:uppercase;color:${debugColor.panelSubtle};`;

      const chevron = document.createElement("span");
      chevron.textContent = "▾";
      chevron.style.cssText = `font-size:10px;color:${debugColor.panelSubtle};`;

      header.appendChild(headerTitle);
      header.appendChild(chevron);
      panel.appendChild(header);

      // ── Body ──────────────────────────────────────────────────
      const body = document.createElement("div");
      body.style.cssText = `${BASE_STYLE};padding:6px 14px 10px;margin-top:4px;`;
      panel.appendChild(body);

      let collapsed = false;
      header.addEventListener("click", () => {
        collapsed = !collapsed;
        body.style.display = collapsed ? "none" : "block";
        chevron.textContent = collapsed ? "▸" : "▾";
      });

      // ── Playback ──────────────────────────────────────────────
      body.appendChild(sectionLabel("playback"));

      const pauseBtn = makeBtn("⏸ pause", () => {
        stateRef.current.paused = !stateRef.current.paused;
        pauseBtn.textContent = stateRef.current.paused ? "▶ play" : "⏸ pause";
        stepBtn.style.opacity = stateRef.current.paused ? "1" : "0.3";
        stepBtn.style.pointerEvents = stateRef.current.paused ? "auto" : "none";
      });

      const stepBtn = makeBtn("→ step", () => {
        if (stateRef.current.paused) {
          frame();
        }
      });
      stepBtn.style.opacity = "0.3";
      stepBtn.style.pointerEvents = "none";

      body.appendChild(makeRow(pauseBtn, stepBtn));

      const followBtn = makeBtn("⛶ stop following", () => {
        stateRef.current.noFollow = !stateRef.current.noFollow;
        const on = stateRef.current.noFollow;
        if (on) {
          stateRef.current.freerunMode = false;
          stateRef.current.freerunTimer = 0;
        }
        followBtn.textContent = on ? "⛶ resume following" : "⛶ stop following";
        followBtn.style.color = on ? debugColor.accentStrong : debugColor.panelText;
      });
      followBtn.style.width = "100%";
      body.appendChild(makeRow(followBtn));

      // ── State ─────────────────────────────────────────────────
      body.appendChild(sectionLabel("force state"));

      const ALL_STATES = [
        "moving",
        "idle",
        "sleeping",
        "scratchSelf",
        "tired",
        "alert",
        "scratchWallN",
        "scratchWallS",
        "scratchWallE",
        "scratchWallW",
        "freerun",
      ];

      const stateSelect = document.createElement("select");
      stateSelect.style.cssText = selectStyle;
      for (const name of ALL_STATES) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        stateSelect.appendChild(opt);
      }

      const lockChk = document.createElement("input");
      lockChk.type = "checkbox";
      lockChk.title = "lock state (prevent auto-reset)";
      lockChk.style.cssText = `cursor:pointer;accent-color:${debugColor.accent};`;
      lockChk.addEventListener("change", () => {
        stateRef.current.stateLocked = lockChk.checked;
      });

      const lockLbl = document.createElement("label");
      lockLbl.title = "lock state";
      lockLbl.style.cssText = `display:flex;align-items:center;gap:3px;cursor:pointer;font-size:10px;color:${debugColor.accent};white-space:nowrap;`;
      lockLbl.appendChild(lockChk);
      lockLbl.append("lock");

      body.appendChild(makeRow(stateSelect));

      const forceStateBtn = makeBtn("apply", () => {
        const s = stateRef.current;
        const chosen = stateSelect.value as CatActivityState;
        s.idleAnimation = null;
        s.idleAnimationFrame = 0;
        s.freerunMode = false;
        s.freerunTimer = 0;
        if (chosen === "moving") {
          s.idleTime = 0;
          s.stateLocked = lockChk.checked;
        } else if (chosen === "idle") {
          s.idleTime = 200;
          s.stateLocked = lockChk.checked;
        } else if (chosen === "freerun") {
          s.freerunMode = true;
          s.freerunTimer = 600;
          s.stateLocked = lockChk.checked;
        } else {
          s.idleTime = 200;
          s.idleAnimation = chosen as IdleActivityState;
          s.idleAnimationFrame = 0;
          s.stateLocked = lockChk.checked;
        }
      });

      body.appendChild(makeRow(forceStateBtn, lockLbl));

      // ── Bubble ────────────────────────────────────────────────
      body.appendChild(sectionLabel("bubble"));

      const showBubbleBtn = makeBtn("show", () => showBubble());
      const hideBubbleBtn = makeBtn("hide", () => hideBubble());
      body.appendChild(makeRow(showBubbleBtn, hideBubbleBtn));

      const bubbleInput = document.createElement("input");
      bubbleInput.type = "text";
      bubbleInput.placeholder = "custom text...";
      bubbleInput.style.cssText = [
        `background:${debugColor.controlBg}`,
        `border:1px solid ${debugColor.controlBorder}`,
        `color:${debugColor.panelText}`,
        "border-radius:4px",
        "padding:2px 6px",
        "font-family:inherit",
        "font-size:11px",
        "flex:1",
        "min-width:0",
      ].join(";");

      const setTextBtn = makeBtn("set", () => {
        if (bubbleInput.value.trim()) {
          bubbleTextEl.textContent = bubbleInput.value.trim();
          stateRef.current.bubbleVisible = true;
          stateRef.current.bubbleTimer = BUBBLE_DISPLAY_FRAMES;
          bubbleEl.style.opacity = "1";
        }
      });

      body.appendChild(makeRow(bubbleInput, setTextBtn));

      // ── Position ──────────────────────────────────────────────
      body.appendChild(sectionLabel("position"));

      const teleportCenterBtn = makeBtn("→ center", () => {
        stateRef.current.nekoPosX = window.innerWidth / 2;
        stateRef.current.nekoPosY = window.innerHeight / 2;
        el.style.left = `${stateRef.current.nekoPosX - TILE / 2}px`;
        el.style.top = `${stateRef.current.nekoPosY - TILE / 2}px`;
      });

      const teleportMouseBtn = makeBtn("→ cursor", () => {
        const s = stateRef.current;
        s.nekoPosX = s.mousePosX;
        s.nekoPosY = s.mousePosY;
        el.style.left = `${s.nekoPosX - TILE / 2}px`;
        el.style.top = `${s.nekoPosY - TILE / 2}px`;
      });

      body.appendChild(makeRow(teleportCenterBtn, teleportMouseBtn));

      const makePosSlider = (
        axis: "X" | "Y",
        getMax: () => number,
        getVal: () => number,
        setVal: (v: number) => void,
      ) => {
        const lbl = document.createElement("span");
        lbl.textContent = axis;
        lbl.style.cssText = `min-width:10px;color:${debugColor.panelSubtle};font-size:10px;font-weight:bold;`;

        const valLbl = document.createElement("span");
        valLbl.style.cssText = "min-width:28px;text-align:right;font-size:10px;";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = "16";
        slider.style.cssText = `flex:1;cursor:pointer;accent-color:${debugColor.accent};`;

        // Sync slider bounds + value whenever the panel is rendered
        const sync = () => {
          slider.max = String(Math.round(getMax()));
          slider.value = String(Math.round(getVal()));
          valLbl.textContent = String(Math.round(getVal()));
        };
        sync();

        slider.addEventListener("mousedown", sync);
        slider.addEventListener("input", () => {
          const v = Number(slider.value);
          valLbl.textContent = String(v);
          setVal(v);
          el.style.left = `${stateRef.current.nekoPosX - TILE / 2}px`;
          el.style.top = `${stateRef.current.nekoPosY - TILE / 2}px`;
        });

        return makeRow(lbl, slider, valLbl);
      };

      body.appendChild(
        makePosSlider(
          "X",
          () => window.innerWidth,
          () => stateRef.current.nekoPosX,
          (v) => {
            stateRef.current.nekoPosX = v;
          },
        ),
      );
      body.appendChild(
        makePosSlider(
          "Y",
          () => window.innerHeight,
          () => stateRef.current.nekoPosY,
          (v) => {
            stateRef.current.nekoPosY = v;
          },
        ),
      );

      // ── Speed ─────────────────────────────────────────────────
      body.appendChild(sectionLabel("speed"));

      const speedLabel = document.createElement("span");
      speedLabel.textContent = String(speed);
      speedLabel.style.cssText = "min-width:20px;text-align:right;";

      const speedSlider = document.createElement("input");
      speedSlider.type = "range";
      speedSlider.min = "1";
      speedSlider.max = "40";
      speedSlider.value = String(speed);
      speedSlider.style.cssText = `flex:1;cursor:pointer;accent-color:${debugColor.accent};`;
      speedSlider.addEventListener("input", () => {
        const val = Number(speedSlider.value);
        speedLabel.textContent = String(val);
        stateRef.current.currentSpeed = val;
      });

      body.appendChild(makeRow(speedSlider, speedLabel));

      return panel;
    };

    const el = createElement();
    elRef.current = el;
    const debugSVG = createDebugSVG();
    const debugHUD = createDebugHUD();
    const debugControls = createDebugControls();

    // Shared wrapper: positions both HUD and controls panel at top-left
    const debugWrapper = document.createElement("div");
    debugWrapper.setAttribute("aria-hidden", "true");
    debugWrapper.style.cssText = [
      "position:fixed",
      "top:10px",
      "left:10px",
      `z-index:${zIndex}`,
      "display:none",
      "flex-direction:column",
      "gap:6px",
      "pointer-events:none",
    ].join(";");
    debugWrapper.appendChild(debugHUD);
    debugWrapper.appendChild(debugControls);

    const { wrapper: bubbleEl, textEl: bubbleTextEl, tailWrap: bubbleTail } = createBubble();

    // Load persisted state
    if (persistPosition) {
      const getParsedState = () => {
        try {
          const raw = window.localStorage.getItem("oneko");
          if (!raw) {
            return null;
          }
          return JSON.parse(raw);
        } catch {
          return null;
        }
      };

      const applyStateValue = <K extends keyof typeof stateRef.current>(key: K, value: unknown) => {
        if (value !== undefined && value !== null) {
          stateRef.current[key] = value as never;
        }
      };

      const parsed = getParsedState();
      if (parsed) {
        applyStateValue("nekoPosX", parsed.nekoPosX);
        applyStateValue("nekoPosY", parsed.nekoPosY);
        applyStateValue("mousePosX", parsed.mousePosX);
        applyStateValue("mousePosY", parsed.mousePosY);
        applyStateValue("frameCount", parsed.frameCount);
        applyStateValue("idleTime", parsed.idleTime);
        applyStateValue("idleAnimation", parsed.idleAnimation);
        applyStateValue("idleAnimationFrame", parsed.idleAnimationFrame);
        if (parsed.bgPos) {
          el.style.backgroundPosition = parsed.bgPos as string;
        }
        el.style.left = `${stateRef.current.nekoPosX - TILE / 2}px`;
        el.style.top = `${stateRef.current.nekoPosY - TILE / 2}px`;
      }
    }

    document.body.appendChild(debugSVG);
    document.body.appendChild(debugWrapper);
    document.body.appendChild(el);
    document.body.appendChild(bubbleEl);

    const onMouseMove = (ev: MouseEvent) => {
      const mx = ev.clientX;
      const my = ev.clientY;
      const s = stateRef.current;
      const px = s.mousePosX;
      const py = s.mousePosY;
      const dx = mx - px;
      const dy = my - py;
      const dist = Math.hypot(dx, dy);
      if (dist >= MOUSE_LOOP_MIN_STEP) {
        const ang = Math.atan2(dy, dx);
        if (s.loopPrevAngle !== null) {
          let d = ang - s.loopPrevAngle;
          while (d > Math.PI) {
            d -= 2 * Math.PI;
          }
          while (d < -Math.PI) {
            d += 2 * Math.PI;
          }
          s.mouseCircleWinding += d;
          if (s.mouseCircleWinding > MOUSE_LOOP_WINDING_CAP) {
            s.mouseCircleWinding = MOUSE_LOOP_WINDING_CAP;
          } else if (s.mouseCircleWinding < -MOUSE_LOOP_WINDING_CAP) {
            s.mouseCircleWinding = -MOUSE_LOOP_WINDING_CAP;
          }
        }
        s.loopPrevAngle = ang;
      }
      s.mousePosX = mx;
      s.mousePosY = my;
    };
    document.addEventListener("mousemove", onMouseMove);

    const invalidateObstacles = () => {
      stateRef.current.lastObstacleRefresh = -OBSTACLE_INTERVAL;
      stateRef.current.lastPathRecalcFrame = -PATH_RECALC_INTERVAL;
    };
    window.addEventListener("scroll", invalidateObstacles, { passive: true });
    window.addEventListener("resize", invalidateObstacles, { passive: true });

    const onBeforeUnload = () => {
      if (!persistPosition) {
        return;
      }
      try {
        const s = stateRef.current;
        window.localStorage.setItem(
          "oneko",
          JSON.stringify({
            nekoPosX: s.nekoPosX,
            nekoPosY: s.nekoPosY,
            mousePosX: s.mousePosX,
            mousePosY: s.mousePosY,
            frameCount: s.frameCount,
            idleTime: s.idleTime,
            idleAnimation: s.idleAnimation,
            idleAnimationFrame: s.idleAnimationFrame,
            bgPos: el.style.backgroundPosition,
          }),
        );
      } catch {
        // ignore
      }
    };
    if (persistPosition) {
      window.addEventListener("beforeunload", onBeforeUnload);
    }

    // Konami code detection
    const konamiBuffer: string[] = [];
    const onKeyDown = (e: KeyboardEvent) => {
      konamiBuffer.push(e.code);
      if (konamiBuffer.length > KONAMI_SEQUENCE.length) {
        konamiBuffer.shift();
      }
      if (konamiBuffer.join(",") === KONAMI_TARGET) {
        stateRef.current.debugMode = !stateRef.current.debugMode;
        if (stateRef.current.debugMode) {
          debugSVG.style.display = "block";
          debugWrapper.style.display = "flex";
        } else {
          debugSVG.style.display = "none";
          debugWrapper.style.display = "none";
          stateRef.current.paused = false;
          stateRef.current.stateLocked = false;
          stateRef.current.noFollow = false;
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Sprite helpers
    const setSprite = (name: keyof typeof defaultSpriteSets | string, frame: number) => {
      const sprites = defaultSpriteSets[name as keyof typeof defaultSpriteSets];
      if (!sprites?.length) {
        return;
      }
      const sprite = sprites[frame % sprites.length];
      el.style.backgroundPosition = `${sprite[0] * TILE}px ${sprite[1] * TILE}px`;
    };

    const getDirectionFromAngle = (angle: number): string => {
      if (angle >= 157.5 || angle < -157.5) {
        return "W";
      }
      for (const range of DIRECTION_RANGES) {
        if (angle >= range.min && angle < range.max) {
          return range.dir;
        }
      }
      return "E";
    };

    const directionFromDelta = (dx: number, dy: number) => {
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        return null;
      }
      return getDirectionFromAngle(Math.atan2(dy, dx) * (180 / Math.PI));
    };

    const maybeStartIdleAnimation = () => {
      const s = stateRef.current;
      // idleThresholdMs / 100 = frames (each frame ≈ 100ms)
      const idleFrameThreshold = Math.max(1, Math.round(s.idleThresholdMs / 100));
      if (s.idleAnimation != null || s.idleTime < idleFrameThreshold || Math.random() >= 0.1) {
        return;
      }
      s.idleAnimationFrame = 0;
      if (s.idleTime > idleFrameThreshold * 3) {
        s.idleAnimation = "sleeping";
        if (s.bubbleVisible) {
          bubbleTextEl.textContent = pickFromPool(SLEEPING_MESSAGES);
        }
        return;
      }
      const available: IdleActivityState[] = ["scratchSelf", "tired"];
      // 18 = position clamp boundary (16) + 2px tolerance
      // only scratch if cat is genuinely pinned against the viewport edge
      const wallAnims = [
        s.nekoPosX <= 18 && "scratchWallW",
        s.nekoPosX >= window.innerWidth - 18 && "scratchWallE",
        s.nekoPosY <= 18 && "scratchWallN",
        s.nekoPosY >= window.innerHeight - 18 && "scratchWallS",
      ].filter(Boolean) as IdleActivityState[];
      available.push(...wallAnims);
      s.idleAnimation = available[Math.floor(Math.random() * available.length)];
    };

    const clearRotation = () => {
      const s = stateRef.current;
      if (s.currentRotation !== 0) {
        s.currentRotation = 0;
        el.style.transform = `scale(${s.scale}) rotate(0deg)`;
      }
    };

    const updateIdleAnimation = () => {
      const s = stateRef.current;
      if (!s.idleAnimation) {
        return false;
      }
      const animName = s.idleAnimation;
      const sprites = defaultSpriteSets[animName as keyof typeof defaultSpriteSets];
      const baseDuration = IDLE_ANIMATION_DURATIONS[animName] ?? (sprites ? sprites.length * 8 : 8);
      const duration = Math.max(1, Math.round(baseDuration / s.animationSpeedCfg));
      const frameCount = sprites?.length || 1;
      const framesPerSprite = Math.max(1, Math.floor(duration / frameCount));
      const spriteIndex = Math.floor(s.idleAnimationFrame / framesPerSprite) % frameCount;
      setSprite(animName, spriteIndex);
      clearRotation();
      s.idleAnimationFrame += 1;
      if (s.idleAnimationFrame >= duration && animName !== "sleeping") {
        if (s.stateLocked || s.noFollow) {
          s.idleAnimationFrame = 0; // loop when state is locked or following is off
        } else {
          s.idleAnimation = null;
          s.idleAnimationFrame = 0;
        }
      }
      return true;
    };

    // Pathfinding
    const recalculatePath = () => {
      const s = stateRef.current;
      const { grid, gridCols: cols, gridRows: rows } = s;
      if (!grid || cols === 0 || rows === 0) {
        s.currentPath = [];
        return;
      }

      const catCell = nearestWalkable(
        worldToCell(s.nekoPosX, s.nekoPosY, cols, rows),
        grid,
        cols,
        rows,
      );
      const mouseCell = nearestWalkable(
        worldToCell(s.mousePosX, s.mousePosY, cols, rows),
        grid,
        cols,
        rows,
      );

      s.currentPath = findRoute(catCell, mouseCell, grid, cols, rows);
      s.pathWaypointIdx = 0;
      s.lastPathRecalcFrame = s.frameCount;
      s.lastPathTargetCol = Math.floor(s.mousePosX / CELL_SIZE);
      s.lastPathTargetRow = Math.floor(s.mousePosY / CELL_SIZE);
    };

    const getNextWaypointTarget = () => {
      const s = stateRef.current;
      const { currentPath: path } = s;
      if (path.length === 0) {
        return { x: s.mousePosX, y: s.mousePosY };
      }
      while (s.pathWaypointIdx < path.length - 1) {
        const wp = path[s.pathWaypointIdx];
        if (Math.hypot(wp.x - s.nekoPosX, wp.y - s.nekoPosY) < WAYPOINT_REACH_DIST) {
          s.pathWaypointIdx++;
        } else {
          break;
        }
      }
      return path[s.pathWaypointIdx];
    };

    const moveToward = (targetX: number, targetY: number) => {
      const s = stateRef.current;
      const dx = targetX - s.nekoPosX;
      const dy = targetY - s.nekoPosY;
      const dist = Math.hypot(dx, dy);
      if (dist < 1) {
        s.nekoVelX *= 0.5;
        s.nekoVelY *= 0.5;
        return;
      }
      const currentSpeed = s.currentSpeed;
      s.nekoVelX += ((dx / dist) * currentSpeed - s.nekoVelX) * STEER_LERP;
      s.nekoVelY += ((dy / dist) * currentSpeed - s.nekoVelY) * STEER_LERP;
      const velMag = Math.hypot(s.nekoVelX, s.nekoVelY);
      const maxVel = currentSpeed * MAX_VEL_FACTOR;
      const clampedMag = Math.min(velMag, maxVel);
      if (velMag > maxVel) {
        s.nekoVelX = (s.nekoVelX / velMag) * maxVel;
        s.nekoVelY = (s.nekoVelY / velMag) * maxVel;
      }
      s.nekoPosX += s.nekoVelX;
      s.nekoPosY += s.nekoVelY;
      s.nekoPosX = Math.max(16, Math.min(window.innerWidth - 16, s.nekoPosX));
      s.nekoPosY = Math.max(16, Math.min(window.innerHeight - 16, s.nekoPosY));
      el.style.left = `${Math.floor(s.nekoPosX - TILE / 2)}px`;
      el.style.top = `${Math.floor(s.nekoPosY - TILE / 2)}px`;
      const dir = directionFromDelta(s.nekoVelX, s.nekoVelY) ?? "idle";
      setSprite(dir, s.frameCount);
      if (clampedMag > 0.5 && s.rotationAmount > 0) {
        const velAngle = Math.atan2(s.nekoVelY, s.nekoVelX) * (180 / Math.PI);
        s.currentRotation = (velAngle / 180) * s.rotationAmount;
      } else {
        s.currentRotation = 0;
      }
      el.style.transform = `scale(${s.scale}) rotate(${s.currentRotation}deg)`;
      s.idleTime = 0;
    };

    const pickFreerunMessage = () => {
      const s = stateRef.current;
      let idx = Math.floor(Math.random() * FREERUN_MESSAGES.length);
      if (idx === s.lastFreerunMsg) {
        idx = (idx + 1) % FREERUN_MESSAGES.length;
      }
      s.lastFreerunMsg = idx;
      return FREERUN_MESSAGES[idx];
    };

    const enterFreerun = () => {
      const s = stateRef.current;
      s.freerunMode = true;
      s.freerunTimer = s.freerunDurationCfg;
      s.bubbleVisible = true;
      s.bubbleTimer = s.freerunDurationCfg;
      s.bubbleCooldown = 0;
      bubbleTextEl.textContent = pickFreerunMessage();
      bubbleEl.style.opacity = "1";
    };

    const tickFreerun = () => {
      const s = stateRef.current;
      s.freerunTimer -= 1;
      if (s.freerunTimer <= 0) {
        const keepAlive = s.stateLocked;
        s.freerunMode = keepAlive;
        if (keepAlive) {
          s.freerunTimer = s.freerunDurationCfg;
        }
      }
      moveToward(s.mousePosX, s.mousePosY);
    };

    // Movement: follow the current route toward the cursor, or free-roam directly.
    const followPath = (overallDist: number) => {
      const s = stateRef.current;
      if (overallDist < s.followDistanceCfg) {
        setSprite("idle", s.frameCount);
        clearRotation();
        s.nekoVelX *= 0.5;
        s.nekoVelY *= 0.5;
        s.idleTime += 1;
        if (!(s.stateLocked || s.noFollow)) {
          s.freerunMode = false;
        }
        maybeStartIdleAnimation();
        return;
      }
      if (s.freerunMode) {
        tickFreerun();
        return;
      }
      if (!s.noFollow && Math.random() < s.freerunChanceCfg) {
        enterFreerun();
        moveToward(s.mousePosX, s.mousePosY);
        return;
      }
      const target = getNextWaypointTarget();
      moveToward(target.x, target.y);
    };

    const clearSVGGroup = (id: string) => {
      const group = debugSVG.querySelector(`#${id}`);
      if (group) {
        group.innerHTML = "";
      }
    };

    const updateBlockedCells = (grid: Uint8Array, cols: number, rows: number) => {
      const group = debugSVG.querySelector("#oneko-blocked");
      if (!group) {
        return;
      }
      group.innerHTML = "";
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r * cols + c] === 1) {
            const rect = document.createElementNS(SVG_NS, "rect");
            rect.setAttribute("x", String(c * CELL_SIZE + 0.5));
            rect.setAttribute("y", String(r * CELL_SIZE + 0.5));
            rect.setAttribute("width", String(CELL_SIZE - 1));
            rect.setAttribute("height", String(CELL_SIZE - 1));
            rect.setAttribute("fill", "none");
            rect.setAttribute("stroke", debugColor.dangerSoft);
            rect.setAttribute("stroke-width", "0.5");
            group.appendChild(rect);
          }
        }
      }
    };

    const updateObstacleOutlines = (rects: ObstacleRect[]) => {
      const group = debugSVG.querySelector("#oneko-obstacles");
      if (!group) {
        return;
      }
      group.innerHTML = "";
      for (const r of rects) {
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(r.left));
        rect.setAttribute("y", String(r.top));
        rect.setAttribute("width", String(r.right - r.left));
        rect.setAttribute("height", String(r.bottom - r.top));
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", debugColor.dangerSoft);
        rect.setAttribute("stroke-width", "0.5");
        rect.setAttribute("stroke-dasharray", "3 3");
        group.appendChild(rect);
      }
    };

    const updateDebugPath = (path: PathPoint[], catX: number, catY: number) => {
      const group = debugSVG.querySelector("#oneko-path");
      if (!group) {
        return;
      }
      group.innerHTML = "";
      if (path.length === 0) {
        return;
      }

      const points = `${catX},${catY} ${path.map((p) => `${p.x},${p.y}`).join(" ")}`;
      const line = document.createElementNS(SVG_NS, "polyline");
      line.setAttribute("points", points);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", debugColor.trail);
      line.setAttribute("stroke-width", "1.5");
      line.style.transition = "all 0.15s ease";
      group.appendChild(line);

      for (const pt of path) {
        const dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("cx", String(pt.x));
        dot.setAttribute("cy", String(pt.y));
        dot.setAttribute("r", "2");
        dot.setAttribute("fill", debugColor.trailDot);
        group.appendChild(dot);
      }
    };

    const getActivityLabel = (): CatActivityState => {
      const s = stateRef.current;
      if (s.freerunMode) {
        return "freerun";
      }
      if (s.idleAnimation === "sleeping") {
        return "sleeping";
      }
      if (s.idleAnimation) {
        return s.idleAnimation;
      }
      if (s.idleTime > 0) {
        return "idle";
      }
      return "moving";
    };

    const getBubbleStatus = (s: typeof stateRef.current) => {
      if (s.bubbleVisible) {
        return "showing";
      }
      if (s.bubbleCooldown > 0) {
        return `cd ${s.bubbleCooldown}f`;
      }
      return "ready";
    };

    const updateDebugHUD = () => {
      const s = stateRef.current;
      const activity = getActivityLabel();
      const stateColor = s.freerunMode ? debugColor.danger : debugColor.accent;
      const td = "padding:1px 0;";
      const labelTd = `${td}font-weight:bold;color:${debugColor.panelSubtle};padding-right:12px;`;
      const valueTd = `${td}text-align:right;`;
      const row = (label: string, value: string, color?: string) => {
        const valStyle = color ? `${valueTd}color:${color}` : valueTd;
        return `<tr><td style="${labelTd}">${label}</td><td style="${valStyle}">${value}</td></tr>`;
      };

      const speed = Math.hypot(s.nekoVelX, s.nekoVelY);
      const distToMouse = Math.hypot(s.mousePosX - s.nekoPosX, s.mousePosY - s.nekoPosY);

      debugHUD.innerHTML = `<table style="border-collapse:collapse;width:100%">${[
        row("state", activity, stateColor),
        row("pos", `${Math.round(s.nekoPosX)}, ${Math.round(s.nekoPosY)}`),
        row("vel", `${s.nekoVelX.toFixed(1)}, ${s.nekoVelY.toFixed(1)}`),
        row("speed", speed.toFixed(1)),
        row("target", `${Math.round(s.mousePosX)}, ${Math.round(s.mousePosY)}`),
        row("dist", `${Math.round(distToMouse)}px`),
        row("idle", `${s.idleTime}f`),
        row("frame", `${s.frameCount}`),
        row("trail", `${s.currentPath.length} pts`),
        row("step", `${s.pathWaypointIdx}/${s.currentPath.length}`),
        row("obstacles", `${s.obstacleRects.length}`),
        row("grid", `${s.gridCols} x ${s.gridRows}`),
        row("freerun", s.freerunMode ? `${s.freerunTimer}f left` : "off"),
        row("bubble", getBubbleStatus(s)),
      ].join("")}</table>`;
    };

    // Track whether blocked cells need a full rebuild (only on grid refresh)
    let lastBlockedGrid: Uint8Array | null = null;

    // Debug overlay rendering
    const renderDebug = () => {
      const s = stateRef.current;
      // Only rebuild blocked cells + obstacles when the grid changes
      if (s.grid !== lastBlockedGrid) {
        lastBlockedGrid = s.grid;
        if (s.grid) {
          updateBlockedCells(s.grid, s.gridCols, s.gridRows);
        } else {
          clearSVGGroup("oneko-blocked");
        }
        updateObstacleOutlines(s.obstacleRects);
      }
      updateDebugPath(s.currentPath, s.nekoPosX, s.nekoPosY);
      updateDebugHUD();
    };

    const pickFromPool = (pool: string[]) => {
      const s = stateRef.current;
      let idx = Math.floor(Math.random() * pool.length);
      if (idx === s.lastBubbleMsg) {
        idx = (idx + 1) % pool.length;
      }
      s.lastBubbleMsg = idx;
      return pool[idx];
    };

    const pickBubbleMessage = () => {
      const s = stateRef.current;
      if (s.idleAnimation === "sleeping") {
        return pickFromPool(SLEEPING_MESSAGES);
      }
      if (s.customBubbleText) {
        return s.customBubbleText;
      }
      if (s.idleAnimation === "tired") {
        return pickFromPool(TIRED_MESSAGES);
      }
      if (s.idleAnimation === "scratchSelf") {
        return pickFromPool(SCRATCHING_MESSAGES);
      }
      if (s.idleAnimation === "alert") {
        return pickFromPool(ALERT_MESSAGES);
      }
      if (s.idleAnimation?.startsWith("scratchWall")) {
        return pickFromPool(WALL_SCRATCH_MESSAGES);
      }
      if (s.idleTime > 0) {
        return pickFromPool(IDLE_MESSAGES);
      }
      if (Math.abs(s.mouseCircleWinding) >= MOUSE_LOOP_WINDING_TRIGGER) {
        return pickFromPool(CIRCLE_LOOP_MESSAGES);
      }
      return pickFromPool(MOVING_MESSAGES);
    };

    const showBubble = () => {
      const s = stateRef.current;
      s.bubbleVisible = true;
      s.bubbleTimer = s.bubbleDisplayFramesCfg;
      bubbleTextEl.textContent = pickBubbleMessage();
      bubbleEl.style.opacity = "1";
    };

    const hideBubble = () => {
      const s = stateRef.current;
      s.bubbleVisible = false;
      bubbleEl.style.opacity = "0";
      s.bubbleCooldown = s.bubbleCooldownFramesCfg;
    };

    const positionBubble = () => {
      const s = stateRef.current;
      const catX = Math.floor(s.nekoPosX);
      const catY = Math.floor(s.nekoPosY);
      const vw = window.innerWidth;
      const bubbleW = bubbleEl.offsetWidth || bubbleTextEl.offsetWidth || 100;
      const margin = 6;
      const halfCat = (TILE * s.scale) / 2;

      // Vertical: show above cat, flip below if too close to top (offsets track rendered sprite scale)
      const aboveY = Math.floor(catY - halfCat - 42);
      const belowY = Math.floor(catY + halfCat + 8);
      const showBelow = aboveY < margin;
      bubbleEl.style.top = `${Math.round(showBelow ? belowY : aboveY)}px`;
      bubbleEl.style.transform = `translateX(-50%) scale(${s.scale})`;
      bubbleEl.style.transformOrigin = showBelow ? "bottom center" : "top center";

      // Flip the tail direction via flex order + scaleY
      if (showBelow) {
        bubbleEl.style.flexDirection = "column-reverse";
        bubbleTail.style.transform = "scaleY(-1)";
        bubbleTail.style.marginTop = "0";
        bubbleTail.style.marginBottom = "-2px";
      } else {
        bubbleEl.style.flexDirection = "column";
        bubbleTail.style.transform = "";
        bubbleTail.style.marginTop = "-2px";
        bubbleTail.style.marginBottom = "0";
      }

      // Horizontal: center on cat, but clamp to viewport edges (wrapper is scaled from center)
      const halfBubble = (bubbleW * s.scale) / 2;
      let left = catX;
      if (catX - halfBubble < margin) {
        left = margin + halfBubble;
      } else if (catX + halfBubble > vw - margin) {
        left = vw - margin - halfBubble;
      }
      bubbleEl.style.left = `${Math.round(left)}px`;
    };

    const updateBubble = () => {
      const s = stateRef.current;
      if (!s.bubbleEnabledCfg) {
        if (s.bubbleVisible) hideBubble();
        return;
      }
      positionBubble();
      if (s.bubbleVisible) {
        s.bubbleTimer -= 1;
        if (s.bubbleTimer <= 0) {
          hideBubble();
        }
        return;
      }
      if (s.bubbleCooldown > 0) {
        s.bubbleCooldown -= 1;
        return;
      }
      const idleFrameThreshold = Math.max(1, Math.round(s.idleThresholdMs / 100));
      // bubbleChanceCfg 0.5 → base rates; scales linearly
      const idleRate = s.bubbleChanceCfg * 0.16;
      const moveRate = s.bubbleChanceCfg * 0.01;
      const loopW = Math.abs(s.mouseCircleWinding);
      const loopComplaining = s.idleTime === 0 && loopW >= MOUSE_LOOP_WINDING_TRIGGER;
      const moveRateBoost = loopComplaining ? 4.2 : 1;
      // Trigger while idle (higher chance)
      if (s.idleTime > idleFrameThreshold && Math.random() < idleRate) {
        showBubble();
        return;
      }
      // Trigger while moving (lower chance; higher while cursor is looping)
      if (s.idleTime === 0 && Math.random() < moveRate * moveRateBoost) {
        showBubble();
      }
    };

    const refreshGridIfNeeded = () => {
      const s = stateRef.current;
      if (s.frameCount - s.lastObstacleRefresh < OBSTACLE_INTERVAL) {
        return;
      }
      s.obstacleRects = collectObstacles();
      s.lastObstacleRefresh = s.frameCount;
      s.gridCols = Math.ceil(window.innerWidth / CELL_SIZE);
      s.gridRows = Math.ceil(window.innerHeight / CELL_SIZE);
      s.grid = buildGrid(s.obstacleRects, s.gridCols, s.gridRows);
      s.lastPathRecalcFrame = -PATH_RECALC_INTERVAL;
    };

    const recalcPathIfNeeded = () => {
      const s = stateRef.current;
      const mouseCol = Math.floor(s.mousePosX / CELL_SIZE);
      const mouseRow = Math.floor(s.mousePosY / CELL_SIZE);
      const mouseMoved =
        Math.abs(mouseCol - s.lastPathTargetCol) > PATH_RECALC_MOUSE_CELLS ||
        Math.abs(mouseRow - s.lastPathTargetRow) > PATH_RECALC_MOUSE_CELLS;
      if (s.frameCount - s.lastPathRecalcFrame >= PATH_RECALC_INTERVAL || mouseMoved) {
        recalculatePath();
      }
    };

    // When stateLocked (or noFollow) with no animation, freeze the cat in place.
    const freezeLockedState = () => {
      const s = stateRef.current;
      if (!(s.stateLocked || s.noFollow) || (s.freerunMode && !s.noFollow)) {
        return false;
      }
      s.nekoVelX *= 0.5;
      s.nekoVelY *= 0.5;
      s.idleTime = Math.max(s.idleTime, 1);
      setSprite("idle", s.frameCount);
      clearRotation();
      return true;
    };

    const maybeRenderDebug = () => {
      if (stateRef.current.debugMode) {
        renderDebug();
      }
    };

    const playSound = (pool: string[]) => {
      const s = stateRef.current;
      if (!s.enableMeow || s.soundCooldown > 0 || pool.length === 0) return;
      const url = pool[Math.floor(Math.random() * pool.length)];
      const audio = new Audio(url);
      audio.volume = s.soundVolumeCfg;
      // Set cooldown optimistically; reset on failure so blocked autoplay
      // doesn't permanently silence subsequent attempts after user interaction.
      s.soundCooldown = 20;
      audio.play().catch(() => {
        s.soundCooldown = 0;
      });
    };

    const frame = () => {
      const s = stateRef.current;
      s.frameCount += 1;
      s.mouseCircleWinding *= MOUSE_LOOP_WINDING_DECAY;
      if (Math.abs(s.mouseCircleWinding) < 0.35) {
        s.mouseCircleWinding = 0;
        s.loopPrevAngle = null;
      }
      s.soundCooldown = Math.max(0, s.soundCooldown - 1);
      refreshGridIfNeeded();
      const dist = Math.hypot(s.mousePosX - s.nekoPosX, s.mousePosY - s.nekoPosY);
      if (s.idleAnimation && dist > 32 && !s.stateLocked && !s.noFollow) {
        s.idleAnimation = null;
        s.idleAnimationFrame = 0;
        s.idleTime = 0;
      }
      recalcPathIfNeeded();
      updateBubble();
      if (s.laserPointerCfg) {
        const close = dist < s.followDistanceCfg + 4;
        if (close && !s.laserCaught) {
          s.laserCaught = true;
          playSound(LASER_CATCH_POOL);
        } else if (!close && dist > s.followDistanceCfg + 24) {
          s.laserCaught = false;
        }
      }
      if (!updateIdleAnimation() && !freezeLockedState()) {
        followPath(dist);
      }
      maybeRenderDebug();
      const currentState = getActivityLabel();
      if (currentState !== lastStateRef.current) {
        lastStateRef.current = currentState;
        onStateChangeRef.current?.(currentState);
        const pool = SOUND_POOLS[currentState];
        if (pool) playSound(pool);
      }
      // Ambient sounds: play periodically while staying in a state
      const { idleTime, frameCount } = s;
      if (currentState === "idle" && idleTime > 0 && idleTime % 60 === 0) {
        playSound(SOUND_POOLS.idle);
      } else if (currentState === "sleeping" && frameCount % 100 === 0) {
        playSound(SOUND_POOLS.sleeping);
      } else if (currentState === "moving" && frameCount % 80 === 0) {
        playSound(SOUND_POOLS.moving);
      }
      if (liveStateRef?.current) {
        const ls = liveStateRef.current;
        ls.state = currentState;
        ls.posX = s.nekoPosX;
        ls.posY = s.nekoPosY;
        ls.velMag = Math.hypot(s.nekoVelX, s.nekoVelY);
        ls.idleTime = s.idleTime;
        ls.distToMouse = dist;
        ls.frameCount = s.frameCount;
        ls.freerunActive = s.freerunMode;
        ls.freerunTimer = s.freerunTimer;
        ls.bubbleVisible = s.bubbleVisible;
        ls.pathLength = s.currentPath.length;
        ls.obstacleCount = s.obstacleRects.length;
      }
    };

    let rafId: number;
    const onAnimationFrame = (timestamp: number) => {
      const s = stateRef.current;
      if (!s.lastFrameTimestamp) {
        s.lastFrameTimestamp = timestamp;
      }
      if (timestamp - s.lastFrameTimestamp > 100) {
        s.lastFrameTimestamp = timestamp;
        if (!s.paused) {
          frame();
        }
      }
      rafId = window.requestAnimationFrame(onAnimationFrame);
    };
    rafId = window.requestAnimationFrame(onAnimationFrame);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", invalidateObstacles);
      window.removeEventListener("resize", invalidateObstacles);
      if (persistPosition) {
        window.removeEventListener("beforeunload", onBeforeUnload);
      }
      window.cancelAnimationFrame(rafId);
      if (el?.parentNode) {
        el.parentNode.removeChild(el);
      }
      if (debugSVG?.parentNode) {
        debugSVG.parentNode.removeChild(debugSVG);
      }
      if (debugWrapper?.parentNode) {
        debugWrapper.parentNode.removeChild(debugWrapper);
      }
      if (bubbleEl?.parentNode) {
        bubbleEl.parentNode.removeChild(bubbleEl);
      }
    };
  }, [persistPosition, zIndex]);

  // Update dynamic styles and stateRef when props change
  useEffect(() => {
    const s = stateRef.current;
    if (elRef.current) {
      // Preserve rotation computed by the frame loop
      elRef.current.style.transform = `scale(${scale}) rotate(${s.currentRotation}deg)`;
      elRef.current.style.opacity = String(opacity);
      elRef.current.style.filter = hueRotate ? `hue-rotate(${hueRotate}deg)` : "";
    }
    s.currentSpeed = speed;
    s.scale = scale;
    s.opacity = opacity;
    s.rotationAmount = rotationAmount;
    s.idleThresholdMs = idleThreshold;
    s.freerunChanceCfg = freerunChance;
    s.freerunDurationCfg = freerunDuration;
    s.bubbleEnabledCfg = bubbleEnabled;
    s.bubbleDisplayFramesCfg = bubbleDisplayFrames;
    s.bubbleCooldownFramesCfg = bubbleCooldown;
    s.bubbleChanceCfg = bubbleChance;
    s.followDistanceCfg = followDistance;
    s.animationSpeedCfg = animationSpeed;
    s.customBubbleText = bubbleText;
    s.enableMeow = meow;
    s.soundVolumeCfg = volume;
    s.laserPointerCfg = laserPointer;
    if (!laserPointer) s.laserCaught = false;
  }, [
    speed,
    scale,
    opacity,
    rotationAmount,
    idleThreshold,
    hueRotate,
    freerunChance,
    freerunDuration,
    bubbleEnabled,
    bubbleDisplayFrames,
    bubbleCooldown,
    bubbleChance,
    followDistance,
    animationSpeed,
    bubbleText,
    meow,
    volume,
    laserPointer,
  ]);

  useEffect(() => {
    if (!laserPointer) return;

    const DOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true" focusable="false" style="display:block;width:100%;height:100%"><rect x="3" y="0" width="1" height="1" fill="var(--destructive)"/><rect x="2" y="1" width="3" height="1" fill="var(--destructive)"/><rect x="1" y="2" width="5" height="1" fill="var(--destructive)"/><rect x="0" y="3" width="7" height="1" fill="var(--destructive)"/><rect x="1" y="4" width="5" height="1" fill="var(--destructive)"/><rect x="2" y="5" width="3" height="1" fill="var(--destructive)"/><rect x="3" y="6" width="1" height="1" fill="var(--destructive)"/><rect x="2" y="2" width="1" height="1" fill="var(--accent)"/></svg>`;

    const LASER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 5" shape-rendering="crispEdges" aria-hidden="true" focusable="false" style="display:block;width:100%;height:100%"><rect x="2" y="0" width="16" height="1" fill="var(--destructive)"/><rect x="1" y="1" width="18" height="1" fill="var(--destructive)"/><rect x="0" y="2" width="20" height="1" fill="var(--destructive)"/><rect x="1" y="3" width="18" height="1" fill="var(--destructive)"/><rect x="2" y="4" width="16" height="1" fill="var(--destructive)"/><rect x="11" y="1" width="1" height="1" fill="var(--primary-foreground)"/><rect x="13" y="1" width="1" height="1" fill="var(--primary-foreground)"/><rect x="15" y="1" width="1" height="1" fill="var(--primary-foreground)"/><rect x="11" y="2" width="1" height="1" fill="var(--primary-foreground)"/><rect x="13" y="2" width="1" height="1" fill="var(--primary-foreground)"/><rect x="15" y="2" width="1" height="1" fill="var(--primary-foreground)"/><rect x="11" y="3" width="1" height="1" fill="var(--primary-foreground)"/><rect x="13" y="3" width="1" height="1" fill="var(--primary-foreground)"/><rect x="15" y="3" width="1" height="1" fill="var(--primary-foreground)"/><rect x="4" y="0" width="3" height="1" fill="var(--primary)"/><rect x="4" y="1" width="3" height="1" fill="var(--primary)"/><rect x="18" y="1" width="3" height="1" fill="var(--accent)"/><rect x="18" y="2" width="3" height="1" fill="var(--accent)"/><rect x="18" y="3" width="3" height="1" fill="var(--accent)"/></svg>`;

    const DOT_SIZE = 9;
    const LASER_W = 88;
    const LASER_H = 20;
    const ANCHOR_INSET = 10;
    const TRAIL_LEN = 22;

    const makeDot = (size: number, opacity: number, glow: boolean) => {
      const d = document.createElement("div");
      d.setAttribute("aria-hidden", "true");
      d.style.cssText = [
        "position:fixed",
        `width:${size}px`,
        `height:${size}px`,
        "pointer-events:none",
        `z-index:${zIndex}`,
        "transform:translate(-50%,-50%)",
        "image-rendering:pixelated",
        "left:-100px",
        "top:-100px",
        `opacity:${opacity}`,
        glow
          ? "filter:drop-shadow(0 0 4px var(--destructive)) drop-shadow(0 0 12px color-mix(in srgb, var(--destructive) 55%, transparent))"
          : "",
      ].join(";");
      d.innerHTML = DOT_SVG;
      return d;
    };

    const dot = makeDot(DOT_SIZE, 1, true);

    const trail: HTMLDivElement[] = [];
    for (let i = 1; i <= TRAIL_LEN; i++) {
      const t = i / (TRAIL_LEN + 1);
      const size = Math.max(2, DOT_SIZE * (1 - t * 0.85));
      const opacity = 0.55 * (1 - t);
      trail.push(makeDot(size, opacity, false));
    }

    const laser = document.createElement("div");
    laser.setAttribute("aria-hidden", "true");
    laser.style.cssText = [
      "position:fixed",
      `width:${LASER_W}px`,
      `height:${LASER_H}px`,
      "pointer-events:none",
      `z-index:${zIndex}`,
      "image-rendering:pixelated",
      "transform-origin:100% 50%",
      "filter:drop-shadow(0 0 6px color-mix(in srgb, var(--destructive) 45%, transparent))",
      "will-change:transform,left,top",
    ].join(";");
    laser.innerHTML = LASER_SVG;

    document.body.appendChild(laser);
    for (const t of trail) document.body.appendChild(t);
    document.body.appendChild(dot);
    document.body.style.cursor = "none";

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;

    const history: { x: number; y: number }[] = [];
    for (let i = 0; i <= TRAIL_LEN; i++) {
      history.push({ x: pointerX, y: pointerY });
    }

    const positionLaser = () => {
      const anchorX = ANCHOR_INSET + LASER_W;
      const anchorY = ANCHOR_INSET + LASER_H / 2;
      laser.style.left = `${ANCHOR_INSET}px`;
      laser.style.top = `${ANCHOR_INSET}px`;
      const dx = pointerX - anchorX;
      const dy = pointerY - anchorY;
      // Tip points left in the source SVG; pivot is at the body (right) end.
      // Add 180° so the tip rotates to face the cursor.
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
      laser.style.transform = `rotate(${angle}deg)`;
    };

    let rafId = 0;
    const tick = () => {
      history.unshift({ x: pointerX, y: pointerY });
      if (history.length > TRAIL_LEN + 1) history.pop();
      dot.style.left = `${history[0].x}px`;
      dot.style.top = `${history[0].y}px`;
      for (let i = 0; i < trail.length; i++) {
        const p = history[i + 1] ?? history[history.length - 1];
        trail[i].style.left = `${p.x}px`;
        trail[i].style.top = `${p.y}px`;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      positionLaser();
    };

    positionLaser();
    rafId = window.requestAnimationFrame(tick);

    document.addEventListener("mousemove", onMove);
    window.addEventListener("resize", positionLaser);
    window.addEventListener("scroll", positionLaser, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", positionLaser);
      window.removeEventListener("scroll", positionLaser);
      if (dot.parentNode) dot.parentNode.removeChild(dot);
      for (const t of trail) {
        if (t.parentNode) t.parentNode.removeChild(t);
      }
      if (laser.parentNode) laser.parentNode.removeChild(laser);
      document.body.style.cursor = "";
    };
  }, [laserPointer, zIndex]);

  return null;
}
