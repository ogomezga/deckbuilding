import type { EnrichedCard } from "../../../shared/domain/card.js";
import type { CardRepository, CardRepositoryResult } from "../domain/cardRepository.js";

type ScryfallCard = {
  name: string;
  cmc?: number;
  colors?: EnrichedCard["colors"];
  color_identity?: EnrichedCard["colorIdentity"];
  type_line?: string;
  oracle_text?: string;
  legalities?: Record<string, string>;
  keywords?: string[];
  card_faces?: Array<{ name?: string; oracle_text?: string }>;
};

export class ScryfallCardRepository implements CardRepository {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async findByNames(names: string[]): Promise<CardRepositoryResult> {
    const cards: EnrichedCard[] = [];
    const notFound: string[] = [];
    const warnings: Array<{ cardName: string; reason: string }> = [];

    for (const name of names) {
      const response = await this.fetchImpl(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`
      );
      if (response.status === 404) {
        notFound.push(name);
        continue;
      }
      if (!response.ok) throw new Error(`Scryfall request failed for ${name}: ${response.status}`);
      const raw = (await response.json()) as ScryfallCard;
      if (!raw.name || !raw.type_line) {
        warnings.push({ cardName: name, reason: "Invalid Scryfall response ignored" });
        continue;
      }
      cards.push({
        name: raw.name,
        manaValue: raw.cmc ?? 0,
        colors: raw.colors ?? [],
        colorIdentity: raw.color_identity ?? [],
        typeLine: raw.type_line,
        oracleText: normalizeOracleText(raw),
        legalities: raw.legalities ?? {},
        keywords: raw.keywords ?? []
      });
    }

    return { cards, notFound, warnings };
  }
}

function normalizeOracleText(card: ScryfallCard): string {
  if (card.oracle_text) return card.oracle_text;
  return (
    card.card_faces
      ?.map((face) => `${face.name ? `${face.name}:\n` : ""}${face.oracle_text ?? ""}`.trim())
      .filter(Boolean)
      .join("\n---\n") ?? ""
  );
}
