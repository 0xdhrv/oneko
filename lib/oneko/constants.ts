import type { CatActivityState } from "./types";

export const TILE = 32;
export const DEFAULT_Z_INDEX = 2_147_483_646;

// Movement config
export const STEER_LERP = 0.3;
export const MAX_VEL_FACTOR = 1.5;

// Obstacle config
export const OBSTACLE_INTERVAL = 30;
export const MIN_OBSTACLE_AREA = 500;
export const OBSTACLE_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,blockquote,a,button,img,svg,picture,video,nav,header,label,[role='button'],[data-oneko-obstacle]";

// Grid / route config
export const CELL_SIZE = 16;
export const SPRITE_RADIUS = 8;
export const PATH_RECALC_INTERVAL = 10;
export const PATH_RECALC_MOUSE_CELLS = 2;
export const WAYPOINT_REACH_DIST = CELL_SIZE;

// Chat bubble config
export const BUBBLE_DISPLAY_FRAMES = 180;
export const BUBBLE_COOLDOWN_FRAMES = 120;
/** Pixels between mouse samples before we treat movement as a new heading */
export const MOUSE_LOOP_MIN_STEP = 5;
/** Total radians of cursor-heading spin to count as “going in circles” */
export const MOUSE_LOOP_WINDING_TRIGGER = 6.2;
/** Soft cap so winding doesn’t run away (about two full spins) */
export const MOUSE_LOOP_WINDING_CAP = 13;
/** Per logic frame decay so old spinning fades out */
export const MOUSE_LOOP_WINDING_DECAY = 0.96;

export const IDLE_MESSAGES = [
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
export const MOVING_MESSAGES = [
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
export const CIRCLE_LOOP_MESSAGES = [
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
export const SLEEPING_MESSAGES = [
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
export const SCRATCHING_MESSAGES = [
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
export const TIRED_MESSAGES = [
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
export const WALL_SCRATCH_MESSAGES = [
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
export const ALERT_MESSAGES = [
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

export const FREERUN_MESSAGES = [
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
export const FREERUN_CHANCE = 0.06;
export const FREERUN_DURATION = 40;
export const DEFAULT_SPEED = 10;
export const DEFAULT_SCALE = 1;
export const DEFAULT_OPACITY = 1;
export const DEFAULT_ROTATION_AMOUNT = 15;
export const DEFAULT_IDLE_THRESHOLD_MS = 1000;
export const DEFAULT_VOLUME = 0.5;
export const DEFAULT_BUBBLE_CHANCE = 0.5;
export const DEFAULT_FOLLOW_DISTANCE = 20;
export const DEFAULT_ANIMATION_SPEED = 1;

// Played once when the cat catches the laser dot
export const LASER_CATCH_POOL = ["/cat-sounds/Cat_eat1.ogg", "/cat-sounds/Cat_eat2.ogg"];

// Sound pools keyed by activity label
const HISS_POOL = [
  "/cat-sounds/Cat_hiss1.ogg",
  "/cat-sounds/Cat_hiss2.ogg",
  "/cat-sounds/Cat_hiss3.ogg",
];
export const SOUND_POOLS: Record<CatActivityState, string[]> = {
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
export const KONAMI_SEQUENCE = [
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
export const KONAMI_TARGET = KONAMI_SEQUENCE.join(",");

// Direction table — module-level so it's not re-allocated every frame
export const DIRECTION_RANGES = [
  { min: -22.5, max: 22.5, dir: "E" },
  { min: 22.5, max: 67.5, dir: "SE" },
  { min: 67.5, max: 112.5, dir: "S" },
  { min: 112.5, max: 157.5, dir: "SW" },
  { min: -157.5, max: -112.5, dir: "NW" },
  { min: -112.5, max: -67.5, dir: "N" },
  { min: -67.5, max: -22.5, dir: "NE" },
] as const;

// 8-directional neighbor offsets: [rowDelta, colDelta, movementCost]
export const NEIGHBOR_OFFSETS: [number, number, number][] = [
  [-1, 0, 1.0],
  [1, 0, 1.0],
  [0, -1, 1.0],
  [0, 1, 1.0],
  [-1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [1, 1, Math.SQRT2],
];

export const defaultSpriteSets = {
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

export const IDLE_ANIMATION_DURATIONS: Record<string, number> = {
  sleeping: 80,
  scratchSelf: 24,
  tired: 40,
  scratchWallN: 24,
  scratchWallS: 24,
  scratchWallE: 24,
  scratchWallW: 24,
};

// Static colour tokens for the debug overlay. Hoisted to module scope so the
// object isn't reallocated every time the animation effect mounts/re-runs.
export const debugColor = {
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

export const DEFAULT_POSITION = {
  x: typeof window !== "undefined" ? window.innerWidth / 2 : 512,
  y: typeof window !== "undefined" ? window.innerHeight / 2 : 384,
};
