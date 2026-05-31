import type { EnrichedCard } from "../../../shared/domain/card.js";

export type CardRepositoryResult = {
  cards: EnrichedCard[];
  notFound: string[];
  warnings: Array<{ cardName: string; reason: string }>;
};

export interface CardRepository {
  findByNames(names: string[]): Promise<CardRepositoryResult>;
}
