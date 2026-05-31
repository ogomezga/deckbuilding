import type { CommunityDeck, CommunityDeckRepository, SimilarDeckCriteria } from "../domain/communityDeckRepository.js";

const feature = (name: CommunityDeck["strategicFeatures"][number]["name"]): CommunityDeck["strategicFeatures"][number] => ({
  name,
  role: "support",
  evidence: `Fixture deck contains ${name}.`
});

const makeDeck = (commander: string, featureNames: Array<CommunityDeck["strategicFeatures"][number]["name"]>): CommunityDeck => ({
  commander,
  decklist: { mainboard: [], commanders: [{ name: commander, quantity: 1 }] },
  strategicFeatures: featureNames.map(feature),
  observedCards: {
    "Land Recursion": ["Life from the Loam", "Ramunap Excavator", "Crucible of Worlds", "Splendid Reclamation"],
    "Sacrifice Outlet": ["Goblin Bombardment", "Zuran Orb", "Ashnod's Altar"],
    "Combat Finisher": ["Craterhoof Behemoth", "Overwhelming Stampede"],
    "Land Sacrifice": ["Fabled Passage", "Evolving Wilds", "Harrow"]
  }
});

export class FixtureCommunityDeckRepository implements CommunityDeckRepository {
  async findSimilarDecks(criteria: SimilarDeckCriteria): Promise<CommunityDeck[]> {
    const desired = new Set(criteria.desiredFeatures.map((feature) => feature.feature));
    return [
      makeDeck("Lord Windgrace", ["Land Recursion", "Land Recursion", "Land Recursion", "Land Recursion", "Land Recursion", "Land Sacrifice", "Graveyard Enabler"]),
      makeDeck("The Gitrog Monster", ["Land Recursion", "Land Recursion", "Land Recursion", "Land Sacrifice", "Land Sacrifice", "Card Advantage Engine"]),
      makeDeck("Korvold, Fae-Cursed King", ["Land Sacrifice", "Sacrifice Payoff", "Sacrifice Outlet", "Card Advantage Engine", "Land Recursion"]),
      makeDeck("Tifa Lockhart", ["Landfall Trigger", "Combat Finisher", "Combat Finisher", "+1/+1 Counter Payoff", "Land Sacrifice"])
    ].filter((deck) => deck.strategicFeatures.some((assignment) => desired.has(assignment.name)));
  }
}
