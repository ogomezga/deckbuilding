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

type ScryfallCollectionResponse = {
  data?: ScryfallCard[];
  not_found?: Array<{ name?: string }>;
};

const COLLECTION_CHUNK_SIZE = 75;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export class ScryfallCardRepository implements CardRepository {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async findByNames(names: string[]): Promise<CardRepositoryResult> {
    const cards: EnrichedCard[] = [];
    const notFound: string[] = [];
    const warnings: Array<{ cardName: string; reason: string }> = [];

    for (let index = 0; index < names.length; index += COLLECTION_CHUNK_SIZE) {
      const chunk = names.slice(index, index + COLLECTION_CHUNK_SIZE);
      const response = await fetchCollectionWithRetry(this.fetchImpl, chunk);
      for (const missing of response.not_found ?? []) {
        if (missing.name) notFound.push(missing.name);
      }
      for (const raw of response.data ?? []) {
        if (!raw.name || !raw.type_line) {
          warnings.push({ cardName: raw.name ?? "Unknown card", reason: "Invalid Scryfall response ignored" });
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
    }

    return { cards, notFound, warnings };
  }
}

async function fetchCollectionWithRetry(
  fetchImpl: typeof fetch,
  names: string[]
): Promise<ScryfallCollectionResponse> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetchImpl("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "mtg-deckbuilding-assistant/0.1"
      },
      body: JSON.stringify({
        identifiers: names.map((name) => ({ name }))
      })
    });

    if (response.ok) return (await response.json()) as ScryfallCollectionResponse;
    if (response.status !== 429 || attempt === MAX_RETRIES) {
      throw new Error(`Scryfall collection request failed: ${response.status}`);
    }
    await delay(RETRY_DELAY_MS * attempt);
  }

  throw new Error("Scryfall collection request failed");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
