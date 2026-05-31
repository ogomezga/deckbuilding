import type { EnrichedCard } from "../../../shared/domain/card.js";
import type { CardFeature } from "../../../shared/domain/featureAssignment.js";

export type ClassifyCardFeaturesInput = {
  cards: EnrichedCard[];
};

export type ClassifyCardFeaturesOutput = {
  cardFeatures: CardFeature[];
  warnings: Array<{ cardName: string; reason: string }>;
};

export interface FeatureClassifier {
  classify(cards: EnrichedCard[]): Promise<ClassifyCardFeaturesOutput>;
}
