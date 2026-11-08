/** Allowed values for the string options. Types, validators, and framework props derive from these. */
export const BUBBLE_PLACEMENTS = ["auto", "above", "below"] as const;
export const REDUCED_MOTION_MODES = ["hide", "rest"] as const;
export const CHASE_TARGETS = ["cursor", "cat"] as const;

export function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}
