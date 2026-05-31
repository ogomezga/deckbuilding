import type { FeatureName } from "./feature.js";

export type FeatureBaseline = {
  feature: FeatureName;
  sampleSize: number;
  medianDensity: number;
  averageDensity: number;
  lowerQuartile: number;
  upperQuartile: number;
  evidence: string[];
};

export type ObservedSolution = {
  feature: FeatureName;
  cards: string[];
  occurrences: number;
  evidence: string[];
};

export type CommunityFinding = {
  feature: FeatureName;
  currentDensity: number;
  observedMedian: number;
  observedRange: {
    lowerQuartile: number;
    upperQuartile: number;
  };
  evidence: string[];
};

export type CommunityBaselineReport = {
  analyzedDecks: number;
  featureBaselines: FeatureBaseline[];
  observedSolutions: ObservedSolution[];
  findings: CommunityFinding[];
};
