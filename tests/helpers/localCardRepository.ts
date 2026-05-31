import type { EnrichedCard } from "../../src/shared/domain/card.js";
import type { CardRepository, CardRepositoryResult } from "../../src/features/fetch-card-data/index.js";

const card = (overrides: Partial<EnrichedCard> & Pick<EnrichedCard, "name" | "typeLine">): EnrichedCard => ({
  name: overrides.name,
  manaValue: overrides.manaValue ?? 0,
  colors: overrides.colors ?? [],
  colorIdentity: overrides.colorIdentity ?? [],
  typeLine: overrides.typeLine,
  oracleText: overrides.oracleText ?? "",
  legalities: overrides.legalities ?? { commander: "legal" },
  keywords: overrides.keywords ?? []
});

export const localTestCards: EnrichedCard[] = [
  card({ name: "Korvold, Fae-Cursed King", manaValue: 5, colors: ["B", "R", "G"], colorIdentity: ["B", "R", "G"], typeLine: "Legendary Creature - Dragon Noble", oracleText: "Flying\nWhenever Korvold enters the battlefield or attacks, sacrifice another permanent.\nWhenever you sacrifice a permanent, put a +1/+1 counter on Korvold and draw a card.", keywords: ["Flying"] }),
  card({ name: "Sol Ring", manaValue: 1, typeLine: "Artifact", oracleText: "{T}: Add {C}{C}." }),
  card({ name: "Arcane Signet", manaValue: 2, typeLine: "Artifact", oracleText: "{T}: Add one mana of any color in your commander's color identity." }),
  card({ name: "Command Tower", typeLine: "Land", oracleText: "{T}: Add one mana of any color in your commander's color identity." }),
  card({ name: "Forest", typeLine: "Basic Land - Forest" }),
  card({ name: "Swamp", typeLine: "Basic Land - Swamp" }),
  card({ name: "Mountain", typeLine: "Basic Land - Mountain" }),
  card({ name: "Fabled Passage", typeLine: "Land", oracleText: "{T}, Sacrifice Fabled Passage: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle." }),
  card({ name: "Evolving Wilds", typeLine: "Land", oracleText: "{T}, Sacrifice Evolving Wilds: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle." }),
  card({ name: "Terramorphic Expanse", typeLine: "Land", oracleText: "{T}, Sacrifice Terramorphic Expanse: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle." }),
  card({ name: "Harrow", manaValue: 3, colors: ["G"], colorIdentity: ["G"], typeLine: "Instant", oracleText: "As an additional cost to cast this spell, sacrifice a land. Search your library for up to two basic land cards, put them onto the battlefield, then shuffle." }),
  card({ name: "Entish Restoration", manaValue: 3, colors: ["G"], colorIdentity: ["G"], typeLine: "Instant", oracleText: "Sacrifice a land. Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle. If you control a creature with power 4 or greater, search for up to three basic land cards instead." }),
  card({ name: "Crucible of Worlds", manaValue: 3, typeLine: "Artifact", oracleText: "You may play lands from your graveyard." }),
  card({ name: "Rampaging Baloths", manaValue: 6, colors: ["G"], colorIdentity: ["G"], typeLine: "Creature - Beast", oracleText: "Landfall - Whenever a land enters the battlefield under your control, create a 4/4 green Beast creature token." }),
  card({ name: "Avenger of Zendikar", manaValue: 7, colors: ["G"], colorIdentity: ["G"], typeLine: "Creature - Elemental", oracleText: "When Avenger of Zendikar enters the battlefield, create a 0/1 Plant creature token for each land you control. Landfall - Put a +1/+1 counter on each Plant creature you control." }),
  card({ name: "Craterhoof Behemoth", manaValue: 8, colors: ["G"], colorIdentity: ["G"], typeLine: "Creature - Beast", oracleText: "When Craterhoof Behemoth enters the battlefield, creatures you control gain trample and get +X/+X until end of turn." }),
  card({ name: "Mayhem Devil", manaValue: 3, colors: ["B", "R"], colorIdentity: ["B", "R"], typeLine: "Creature - Devil", oracleText: "Whenever a player sacrifices a permanent, Mayhem Devil deals 1 damage to any target." }),
  card({ name: "Skullclamp", manaValue: 1, typeLine: "Artifact - Equipment", oracleText: "Equipped creature gets +1/-1. When equipped creature dies, draw two cards." }),
  card({ name: "Hedron Archive", manaValue: 4, typeLine: "Artifact", oracleText: "{T}: Add {C}{C}. {2}, {T}, Sacrifice Hedron Archive: Draw two cards." }),
  card({ name: "Beast Within", manaValue: 3, colors: ["G"], colorIdentity: ["G"], typeLine: "Instant", oracleText: "Destroy target permanent. Its controller creates a 3/3 green Beast creature token." }),
  card({ name: "Heroic Intervention", manaValue: 2, colors: ["G"], colorIdentity: ["G"], typeLine: "Instant", oracleText: "Permanents you control gain hexproof and indestructible until end of turn." })
];

export class LocalTestCardRepository implements CardRepository {
  private readonly cardsByName = new Map(localTestCards.map((entry) => [entry.name.toLocaleLowerCase(), entry]));

  async findByNames(names: string[]): Promise<CardRepositoryResult> {
    return {
      cards: names.flatMap((name) => {
        const card = this.cardsByName.get(name.toLocaleLowerCase());
        return card ? [card] : [];
      }),
      notFound: names.filter((name) => !this.cardsByName.has(name.toLocaleLowerCase())),
      warnings: []
    };
  }
}
