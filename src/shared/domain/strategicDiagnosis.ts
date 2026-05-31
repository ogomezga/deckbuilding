import type { FeatureName, DesiredFeatureRole } from "./feature.js";

export type DiagnosisEvidence = {
  source:
    | "deck_composition"
    | "commander_fit"
    | "commander_discovery"
    | "community_baseline"
    | "game_plan";
  detail: string;
};

export type FeatureGap = {
  feature: FeatureName;
  role: DesiredFeatureRole;
  currentDensity: number;
  expectedDensity?: number;
  communityMedian?: number;
  reason: string;
  evidence: DiagnosisEvidence[];
};

export type FeatureSurplus = {
  feature: FeatureName;
  currentDensity: number;
  reason: string;
  evidence: DiagnosisEvidence[];
};

export type FeatureTension = {
  type:
    | "payoff_without_enabler"
    | "enabler_without_payoff"
    | "competing_game_plans"
    | "speed_mismatch"
    | "resource_conflict";
  relatedFeatures: FeatureName[];
  reason: string;
  evidence: DiagnosisEvidence[];
};

export type CommanderTension = {
  type:
    | "missing_commander_support"
    | "commander_pushes_different_plan"
    | "commander_speed_mismatch"
    | "commander_resource_tension";
  relatedFeatures: FeatureName[];
  reason: string;
  evidence: DiagnosisEvidence[];
};

export type CommunityDivergence = {
  feature: FeatureName;
  currentDensity: number;
  observedMedian: number;
  observedRange: {
    lowerQuartile: number;
    upperQuartile: number;
  };
  reason: string;
  evidence: DiagnosisEvidence[];
};

export type PowerLevelConcern = {
  type: "too_slow_for_target" | "too_fast_for_bracket" | "insufficient_consistency" | "excessive_setup_requirement";
  reason: string;
  evidence: DiagnosisEvidence[];
};

export type StrategicDiagnosis = {
  featureGaps: FeatureGap[];
  featureSurpluses: FeatureSurplus[];
  featureTensions: FeatureTension[];
  commanderTensions: CommanderTension[];
  communityDivergences: CommunityDivergence[];
  powerLevelConcerns: PowerLevelConcern[];
  supportingEvidence: DiagnosisEvidence[];
};
