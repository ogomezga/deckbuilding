import type { FeatureName } from "./feature.js";
import type { DiagnosisEvidence } from "./strategicDiagnosis.js";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";

export type StrategicRecommendation = {
  title: string;
  rationale: string;
  relatedFeatures: FeatureName[];
};

export type StructuralRecommendation = {
  title: string;
  rationale: string;
  targetState?: string;
};

export type CardRecommendation = {
  cardName: string;
  supportedFeatures: FeatureName[];
  rationale: string;
  source: "community_solution" | "feature_match" | "commander_synergy" | "diagnosis_resolution";
};

export type SwapRecommendation = {
  removeCard: string;
  addCard: string;
  rationale: string;
  gainedFeatures: FeatureName[];
  lostFeatures: FeatureName[];
};

export type Recommendation = {
  priority: RecommendationPriority;
  strategicRecommendation: StrategicRecommendation;
  structuralRecommendation?: StructuralRecommendation;
  cardRecommendations: CardRecommendation[];
  swapRecommendations: SwapRecommendation[];
  evidence: DiagnosisEvidence[];
};
