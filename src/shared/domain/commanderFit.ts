import type { FeatureName } from "./feature.js";

export type SupportingFeature = {
  feature: FeatureName;
  evidence: string[];
};

export type UnsupportedFeature = {
  feature: FeatureName;
  reason: string;
};

export type IndirectSupport = {
  feature: FeatureName;
  path: string[];
  evidence: string[];
};

export type CommanderFitFinding = {
  type: "strength" | "weakness" | "tension";
  category:
    | "feature_support"
    | "missing_support"
    | "speed"
    | "win_condition"
    | "resource_usage"
    | "play_pattern";
  relatedFeatures: FeatureName[];
  evidence: string[];
};

export type CommanderFit = {
  commander: string;
  supportingFeatures: SupportingFeature[];
  unsupportedFeatures: UnsupportedFeature[];
  indirectSupport: IndirectSupport[];
  findings: CommanderFitFinding[];
};
