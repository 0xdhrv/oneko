import type { Treat } from "../treats";

export type PointLike = { x: number; y: number };

/** Something the cat goes off to do instead of chasing the cursor. */
export type Errand =
  | {
      kind: "goTo";
      target: Element | PointLike;
      frames: number;
      arrived: boolean;
      resolve?: (arrived: boolean) => void;
    }
  | { kind: "sit" }
  | { kind: "treat"; treat: Treat; frames: number }
  | { kind: "box"; el: Element; frames: number; arrived: boolean }
  | {
      kind: "knock";
      el: Element;
      frames: number;
      phase: "approach" | "stare";
      /** 1 pushes the element to the right, -1 to the left. */
      direction: 1 | -1;
    };

export type GrabState =
  | {
      phase: "held";
      samples: { x: number; y: number; t: number }[];
      startT: number;
      travel: number;
    }
  | { phase: "flying"; vx: number; vy: number; spin: number; hard: boolean }
  | { phase: "landed"; frames: number };

/** Multipliers from the visitor's clock; all 1 when timeOfDay is off. */
export type Mood = { speed: number; freerun: number; idle: number };
