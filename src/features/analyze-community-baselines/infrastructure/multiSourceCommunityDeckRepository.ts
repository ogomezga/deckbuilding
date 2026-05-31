import type {
  CommunityDeck,
  CommunityDeckRepository,
  CommunityDeckRepositoryResult,
  CommunityDeckSource,
  SimilarDeckCriteria
} from "../domain/communityDeckRepository.js";

export class MultiSourceCommunityDeckRepository implements CommunityDeckRepository {
  constructor(private readonly sources: CommunityDeckSource[]) {}

  async findSimilarDecks(criteria: SimilarDeckCriteria): Promise<CommunityDeckRepositoryResult> {
    const results = await Promise.all(this.sources.map((source) => source.findSimilarDecks(criteria)));
    return {
      decks: results.flatMap((result) => result.decks),
      warnings: results.flatMap((result) => result.warnings),
      sources: results.flatMap((result) => result.sources)
    };
  }
}

export abstract class HttpCommunityDeckSource implements CommunityDeckSource {
  abstract readonly sourceName: string;

  constructor(protected readonly fetchImpl: typeof fetch = fetch) {}

  abstract buildUrl(criteria: SimilarDeckCriteria): string;

  async findSimilarDecks(criteria: SimilarDeckCriteria): Promise<CommunityDeckRepositoryResult> {
    const url = this.buildUrl(criteria);
    try {
      const response = await this.fetchImpl(url, {
        headers: {
          "User-Agent": "mtg-deckbuilding-assistant/0.1 (+https://localhost)"
        }
      });

      if (!response.ok) {
        return this.unavailable(
          `HTTP ${response.status} while querying ${this.sourceName}.`,
          [`Requested ${url}.`]
        );
      }

      await response.text();

      return this.unavailable(
        `${this.sourceName} was queried, but this adapter does not yet expose deck-level feature densities from the source response.`,
        [`Requested ${url}.`, `${this.sourceName} responded successfully.`]
      );
    } catch (error) {
      return {
        decks: [],
        warnings: [
          {
            reason: `${this.sourceName} community source failed: ${
              error instanceof Error ? error.message : "unknown error"
            }`
          }
        ],
        sources: [
          {
            source: this.sourceName,
            status: "failed",
            evidence: [`Requested ${url}.`],
            warning: error instanceof Error ? error.message : "Unknown community source failure."
          }
        ]
      };
    }
  }

  protected unavailable(warning: string, evidence: string[]): CommunityDeckRepositoryResult {
    return {
      decks: [] as CommunityDeck[],
      warnings: [{ reason: warning }],
      sources: [
        {
          source: this.sourceName,
          status: "queried",
          evidence,
          warning
        }
      ]
    };
  }
}

export class EdhrecCommunityDeckSource extends HttpCommunityDeckSource {
  readonly sourceName = "EDHREC";

  buildUrl(criteria: SimilarDeckCriteria): string {
    return `https://edhrec.com/commanders/${slugify(criteria.commander)}`;
  }
}

export class MtgGoldfishCommunityDeckSource extends HttpCommunityDeckSource {
  readonly sourceName = "MTGGoldfish";

  buildUrl(criteria: SimilarDeckCriteria): string {
    return `https://www.mtggoldfish.com/deck_searches/create?utf8=%E2%9C%93&deck_search%5Bname%5D=&deck_search%5Bformat%5D=commander&deck_search%5Bplayer%5D=&deck_search%5Bdate_range%5D=01%2F01%2F2024+-+12%2F31%2F2026&deck_search%5Bdeck_search_card_filters_attributes%5D%5B0%5D%5Bcard%5D=${encodeURIComponent(
      criteria.commander
    )}`;
  }
}

export class ArchidektCommunityDeckSource extends HttpCommunityDeckSource {
  readonly sourceName = "Archidekt";

  buildUrl(criteria: SimilarDeckCriteria): string {
    return `https://archidekt.com/search/decks?name=${encodeURIComponent(criteria.commander)}`;
  }
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
