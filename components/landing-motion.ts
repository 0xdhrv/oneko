import { stagger, type Transition, type Variants } from "motion/react";

/** Soft, settle-without-overshoot spring shared by every entrance on the landing page. */
const settle: Transition = { type: "spring", visualDuration: 0.55, bounce: 0 };

/** The page staggers its sections; each section then staggers its own children. */
export const landingPage: Variants = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.09, { startDelay: 0.05 }) } },
};

export const landingGroup: Variants = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.07) } },
};

/** Rise, fade, and come into focus. Transform and filter are cleared afterwards so CSS
 * hover states and fixed-position descendants behave as if nothing had animated. */
export const landingRise: Variants = {
  hidden: { opacity: 0, transform: "translateY(10px)", filter: "blur(4px)" },
  show: {
    opacity: 1,
    transform: "translateY(0px)",
    filter: "blur(0px)",
    transition: settle,
    transitionEnd: { transform: "none", filter: "none" },
  },
};

/** The garden only fades and settles; it holds the cat's world, so no blur. */
export const landingWorld: Variants = {
  hidden: { opacity: 0, transform: "scale(0.985)" },
  show: {
    opacity: 1,
    transform: "scale(1)",
    transition: { ...settle, visualDuration: 0.7 },
    transitionEnd: { transform: "none" },
  },
};

/** Wordmark letters hop in one after another, with a little cat bounce. */
export const wordmark: Variants = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.045) } },
};

export const wordmarkLetter: Variants = {
  hidden: { opacity: 0, transform: "translateY(55%)", filter: "blur(3px)" },
  show: {
    opacity: 1,
    transform: "translateY(0%)",
    filter: "blur(0px)",
    transition: { type: "spring", visualDuration: 0.45, bounce: 0.35 },
    transitionEnd: { filter: "none" },
  },
};
