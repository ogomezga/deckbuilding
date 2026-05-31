import type { FeatureName } from "./feature.js";

export type FeatureContributionRole = "enabler" | "payoff" | "engine" | "finisher" | "support";

export type FeatureMagnitude = {
  value: number;
  unit: "trigger" | "card" | "mana" | "permanent" | "land" | "counter" | "creature" | "token";
  condition?: string;
};

export type FeatureAssignment = {
  name: FeatureName;
  role: FeatureContributionRole;
  magnitude?: FeatureMagnitude;
  evidence: string;
};

export type CardFeature = {
  cardName: string;
  features: FeatureAssignment[];
};
