const truthy = (value: string | undefined): boolean =>
  value === "true" || value === "1" || value === "yes";

export const FEATURE_FLAGS = {} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;

// `truthy` kept exported for any future env-driven flags.
export { truthy };
