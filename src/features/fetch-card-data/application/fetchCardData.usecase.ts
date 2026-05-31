import type { EnrichedCard } from "../../../shared/domain/card.js";
import type { CardRepository } from "../domain/cardRepository.js";

export type FetchCardDataInput = {
  cardNames: string[];
};

export type FetchCardDataOutput = {
  cards: EnrichedCard[];
  notFound: string[];
  warnings: Array<{ cardName: string; reason: string }>;
};

export type FetchCardDataResult =
  | { ok: true; value: FetchCardDataOutput }
  | { ok: false; error: { type: "empty_input" | "repository_failure"; message: string } };

export class FetchCardDataUseCase {
  constructor(private readonly cardRepository: CardRepository) {}

  async execute(input: FetchCardDataInput): Promise<FetchCardDataResult> {
    const warnings: Array<{ cardName: string; reason: string }> = [];
    const uniqueNames: string[] = [];
    const seen = new Set<string>();

    for (const rawName of input.cardNames) {
      const name = rawName.trim();
      if (!name) {
        warnings.push({ cardName: rawName, reason: "Empty card name ignored" });
        continue;
      }
      const key = name.toLocaleLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueNames.push(name);
      }
    }

    if (uniqueNames.length === 0) {
      return { ok: false, error: { type: "empty_input", message: "No card names provided." } };
    }

    try {
      const result = await this.cardRepository.findByNames(uniqueNames);
      return {
        ok: true,
        value: {
          cards: result.cards,
          notFound: result.notFound,
          warnings: [...warnings, ...result.warnings]
        }
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          type: "repository_failure",
          message: error instanceof Error ? error.message : "Card repository failed."
        }
      };
    }
  }
}
