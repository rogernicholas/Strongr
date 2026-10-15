/**
 * Which features exist in this build. A flag that is off hides the feature
 * entirely; user preferences live in settings instead.
 */
export const featureFlags = {
  /** Phase 4 scoreboard. Deferred: stays off until Roger approves. */
  social: false,
  plateCalculator: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}
