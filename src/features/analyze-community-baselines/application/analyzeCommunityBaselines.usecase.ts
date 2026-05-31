import type { CommunityBaselineReport } from "../../../shared/domain/communityBaseline.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { StrategicExpression } from "../../../shared/domain/strategicExpression.js";
import type { Warning } from "../../../shared/domain/warning.js";
import type { DeckComposition } from "../../analyze-deck-composition/application/analyzeDeckComposition.usecase.js";
import type { CommunityDeckRepository } from "../domain/communityDeckRepository.js";

export type AnalyzeCommunityBaselinesInput = {
  gamePlan: GamePlan;
  deckComposition: DeckComposition;
  strategicExpressions?: StrategicExpression[];
};

export type AnalyzeCommunityBaselinesOutput = {
  baselineReport: CommunityBaselineReport;
  warnings: Warning[];
};

export class AnalyzeCommunityBaselinesUseCase {
  constructor(private readonly communityDeckRepository: CommunityDeckRepository) {}

  async execute(input: AnalyzeCommunityBaselinesInput): Promise<AnalyzeCommunityBaselinesOutput> {
    const decks = await this.communityDeckRepository.findSimilarDecks({
      commander: input.gamePlan.commander,
      desiredFeatures: input.gamePlan.desiredFeatures,
      bracket: input.gamePlan.bracket,
      targetWinTurn: input.gamePlan.targetWinTurn,
      strategicExpressions: input.strategicExpressions?.map((expression) => expression.name)
    });
    const featureBaselines: CommunityBaselineReport["featureBaselines"] = [];
    const observedSolutions: CommunityBaselineReport["observedSolutions"] = [];
    const findings: CommunityBaselineReport["findings"] = [];

    for (const desired of input.gamePlan.desiredFeatures) {
      const densities = decks.decks.map(
        (deck) => deck.strategicFeatures.filter((assignment) => assignment.name === desired.feature).length
      );
      if (densities.length === 0) continue;
      const sorted = [...densities].sort((a, b) => a - b);
      const baseline = {
        feature: desired.feature,
        sampleSize: densities.length,
        medianDensity: median(sorted),
        averageDensity: round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
        lowerQuartile: percentile(sorted, 0.25),
        upperQuartile: percentile(sorted, 0.75),
        evidence: [`${densities.length} similar strategy decks analyzed.`]
      };
      featureBaselines.push(baseline);
      const currentDensity = input.deckComposition.featureDensity[desired.feature] ?? 0;
      findings.push({
        feature: desired.feature,
        currentDensity,
        observedMedian: baseline.medianDensity,
        observedRange: { lowerQuartile: baseline.lowerQuartile, upperQuartile: baseline.upperQuartile },
        evidence: [`Current Density: ${currentDensity}`, `Observed Median: ${baseline.medianDensity}`, `Sample Size: ${baseline.sampleSize}`]
      });
      const cards = Array.from(new Set(decks.decks.flatMap((deck) => deck.observedCards?.[desired.feature] ?? []))).slice(0, 4);
      if (cards.length > 0) {
        observedSolutions.push({
          feature: desired.feature,
          cards,
          occurrences: decks.decks.filter((deck) => (deck.observedCards?.[desired.feature] ?? []).length > 0).length,
          evidence: [`Observed solution cards for ${desired.feature} from configured community sources.`]
        });
      }
    }

    return {
      baselineReport: {
        analyzedDecks: decks.decks.length,
        dataSources: decks.sources,
        featureBaselines,
        observedSolutions,
        findings
      },
      warnings:
        decks.decks.length === 0
          ? [
              ...decks.warnings,
              { reason: "Community baselines unavailable: configured community sources did not return deck-level feature data." }
            ]
          : decks.warnings
    };
  }
}

function median(sorted: number[]): number {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1]! + sorted[middle]!) / 2 : sorted[middle]!;
}

function percentile(sorted: number[], position: number): number {
  return sorted[Math.floor((sorted.length - 1) * position)] ?? 0;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
