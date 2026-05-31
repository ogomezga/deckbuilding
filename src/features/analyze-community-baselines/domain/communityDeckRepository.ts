import type { ParsedDeck } from "../../../shared/domain/deck.js";
import type { DesiredFeature } from "../../../shared/domain/feature.js";
import type { FeatureAssignment } from "../../../shared/domain/featureAssignment.js";

export type SimilarDeckCriteria = {
  commander: string;
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
  findSimilarDecks(criteria: SimilarDeckCriteria): Promise<CommunityDeckRepositoryResult>;
}

export type CommunityDeckRepositoryResult = {
  decks: CommunityDeck[];
  warnings: Array<{ reason: string }>;
  sources: Array<{
    source: string;
    status: "queried" | "unavailable" | "failed";
    evidence: string[];
    warning?: string;
  }>;
};

export interface CommunityDeckSource {
  readonly sourceName: string;
  findSimilarDecks(criteria: SimilarDeckCriteria): Promise<CommunityDeckRepositoryResult>;
}
