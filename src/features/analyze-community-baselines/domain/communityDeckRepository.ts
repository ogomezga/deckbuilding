import type { ParsedDeck } from "../../../shared/domain/deck.js";
import type { DesiredFeature } from "../../../shared/domain/feature.js";
import type { FeatureAssignment } from "../../../shared/domain/featureAssignment.js";

export type SimilarDeckCriteria = {
  desiredFeatures: DesiredFeature[];
  bracket?: number;
  targetWinTurn?: number;
  strategicExpressions?: string[];
};

export type CommunityDeck = {
  commander: string;
  decklist: ParsedDeck;
  strategicFeatures: FeatureAssignment[];
  observedCards?: Partial<Record<string, string[]>>;
};

export interface CommunityDeckRepository {
  findSimilarDecks(criteria: SimilarDeckCriteria): Promise<CommunityDeck[]>;
}
