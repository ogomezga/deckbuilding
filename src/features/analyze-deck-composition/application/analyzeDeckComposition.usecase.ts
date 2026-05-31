import type { Color, EnrichedCard } from "../../../shared/domain/card.js";
import type { ParsedDeck } from "../../../shared/domain/deck.js";
import type { FeatureName } from "../../../shared/domain/feature.js";
import type { CardFeature, FeatureAssignment } from "../../../shared/domain/featureAssignment.js";
import type { Warning } from "../../../shared/domain/warning.js";

export type ManaCurve = Record<number, number>;
export type ColorDistribution = Record<Color | "C", number>;
export type CardTypeDistribution = Record<string, number>;
export type FeatureDensity = Partial<Record<FeatureName, number>>;

export type FeatureContributionSummary = Partial<
  Record<
    FeatureName,
    {
      supportingCards: number;
      totalMagnitude: number;
      units: string[];
      conditionalContributions: number;
    }
  >
>;

export type CommanderProfile = {
  commander: string;
  features: FeatureAssignment[];
};

export type DeckFact =
  | { type: "feature_density"; feature: FeatureName; value: number }
  | { type: "mana_curve_peak"; manaValue: number; count: number }
  | { type: "land_count"; value: number }
  | { type: "average_mana_value"; value: number }
  | { type: "card_type_count"; cardType: string; value: number };

export type DeckComposition = {
  totalCards: number;
  landCount: number;
  nonLandCount: number;
  manaCurve: ManaCurve;
  averageManaValue: number;
  colorDistribution: ColorDistribution;
  cardTypeDistribution: CardTypeDistribution;
  featureDensity: FeatureDensity;
  featureContributionSummary: FeatureContributionSummary;
  detectedFeatures: FeatureName[];
  commanderProfile: CommanderProfile;
  facts: DeckFact[];
  cardFeatureMap: Record<string, FeatureName[]>;
};

export type AnalyzeDeckCompositionInput = {
  deck: ParsedDeck;
  cards: EnrichedCard[];
  cardFeatures: CardFeature[];
};

export type AnalyzeDeckCompositionOutput = {
  composition: DeckComposition;
  warnings: Warning[];
};

export class AnalyzeDeckCompositionUseCase {
  async execute(input: AnalyzeDeckCompositionInput): Promise<AnalyzeDeckCompositionOutput> {
    const cardByName = new Map(input.cards.map((card) => [card.name.toLocaleLowerCase(), card]));
    const featuresByName = new Map(input.cardFeatures.map((entry) => [entry.cardName.toLocaleLowerCase(), entry.features]));
    const warnings: Warning[] = [];
    const manaCurve: ManaCurve = {};
    const colorDistribution: ColorDistribution = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    const cardTypeDistribution: CardTypeDistribution = {};
    const featureDensity: FeatureDensity = {};
    const featureContributionSummary: FeatureContributionSummary = {};
    const cardFeatureMap: Record<string, FeatureName[]> = {};
    let landCount = 0;
    let nonLandCount = 0;
    let manaValueTotal = 0;
    let manaValueCount = 0;

    for (const deckCard of input.deck.mainboard) {
      const card = cardByName.get(deckCard.name.toLocaleLowerCase());
      if (!card) {
        warnings.push({ cardName: deckCard.name, reason: "Card metadata missing from composition input." });
        continue;
      }
      const isLand = card.typeLine.includes("Land");
      if (isLand) landCount += deckCard.quantity;
      else {
        nonLandCount += deckCard.quantity;
        const manaValue = Math.floor(card.manaValue);
        manaCurve[manaValue] = (manaCurve[manaValue] ?? 0) + deckCard.quantity;
        manaValueTotal += card.manaValue * deckCard.quantity;
        manaValueCount += deckCard.quantity;
      }
      const identities = card.colorIdentity.length === 0 ? ["C" as const] : card.colorIdentity;
      for (const color of identities) colorDistribution[color] += deckCard.quantity;
      for (const type of extractCardTypes(card.typeLine)) {
        cardTypeDistribution[type] = (cardTypeDistribution[type] ?? 0) + deckCard.quantity;
      }
      const assignments = featuresByName.get(card.name.toLocaleLowerCase()) ?? [];
      cardFeatureMap[card.name] = assignments.map((assignment) => assignment.name);
      for (const assignment of assignments) {
        featureDensity[assignment.name] = (featureDensity[assignment.name] ?? 0) + deckCard.quantity;
        const summary =
          featureContributionSummary[assignment.name] ??
          (featureContributionSummary[assignment.name] = {
            supportingCards: 0,
            totalMagnitude: 0,
            units: [],
            conditionalContributions: 0
          });
        summary.supportingCards += deckCard.quantity;
        if (assignment.magnitude) {
          summary.totalMagnitude += assignment.magnitude.value * deckCard.quantity;
          if (!summary.units.includes(assignment.magnitude.unit)) summary.units.push(assignment.magnitude.unit);
          if (assignment.magnitude.condition) summary.conditionalContributions += deckCard.quantity;
        }
      }
    }

    const commanderName = input.deck.commanders[0]?.name ?? "Unknown Commander";
    const commanderFeatures = featuresByName.get(commanderName.toLocaleLowerCase()) ?? [];
    const detectedFeatures = Object.keys(featureDensity) as FeatureName[];
    const facts: DeckFact[] = [
      { type: "land_count", value: landCount },
      { type: "average_mana_value", value: round(manaValueCount === 0 ? 0 : manaValueTotal / manaValueCount) },
      ...Object.entries(featureDensity).map(([feature, value]) => ({
        type: "feature_density" as const,
        feature: feature as FeatureName,
        value: value ?? 0
      })),
      ...Object.entries(cardTypeDistribution).map(([cardType, value]) => ({
        type: "card_type_count" as const,
        cardType,
        value
      }))
    ];
    const peak = Object.entries(manaCurve).sort((a, b) => b[1] - a[1])[0];
    if (peak) facts.push({ type: "mana_curve_peak", manaValue: Number(peak[0]), count: peak[1] });

    return {
      composition: {
        totalCards: landCount + nonLandCount,
        landCount,
        nonLandCount,
        manaCurve,
        averageManaValue: round(manaValueCount === 0 ? 0 : manaValueTotal / manaValueCount),
        colorDistribution,
        cardTypeDistribution,
        featureDensity,
        featureContributionSummary,
        detectedFeatures,
        commanderProfile: { commander: commanderName, features: commanderFeatures },
        facts,
        cardFeatureMap
      },
      warnings
    };
  }
}

function extractCardTypes(typeLine: string): string[] {
  const lower = typeLine.toLocaleLowerCase();
  return ["land", "creature", "artifact", "enchantment", "instant", "sorcery", "planeswalker"].filter((type) =>
    lower.includes(type)
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
