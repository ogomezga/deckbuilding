import type { CommunityBaselineReport } from "../../../shared/domain/communityBaseline.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { CommanderPreference } from "../../../shared/domain/playerPreferences.js";
import type { Recommendation, RecommendationPriority } from "../../../shared/domain/recommendation.js";
import type { StrategicDiagnosis } from "../../../shared/domain/strategicDiagnosis.js";
import type { Warning } from "../../../shared/domain/warning.js";
import type { DeckComposition } from "../../analyze-deck-composition/application/analyzeDeckComposition.usecase.js";

export type RecommendChangesInput = {
  gamePlan: GamePlan;
  diagnosis: StrategicDiagnosis;
  composition: DeckComposition;
  commanderPreference: CommanderPreference;
  communityBaselineReport: CommunityBaselineReport;
};

export type RecommendChangesOutput = {
  recommendations: Recommendation[];
  warnings: Warning[];
};

export class RecommendChangesUseCase {
  async execute(input: RecommendChangesInput): Promise<RecommendChangesOutput> {
    const recommendations: Recommendation[] = [];

    for (const gap of input.diagnosis.featureGaps) {
      const observed = input.communityBaselineReport.observedSolutions.find((solution) => solution.feature === gap.feature);
      const cards = (observed?.cards ?? fallbackCards(gap.feature)).slice(0, 4);
      const removeCard = findSwapCandidate(input, gap.feature);
      recommendations.push({
        priority: priorityFor(gap.role),
        strategicRecommendation: {
          title: `Increase ${gap.feature} support`,
          rationale: gap.reason,
          relatedFeatures: [gap.feature]
        },
        structuralRecommendation: {
          title: `Increase ${gap.feature} density`,
          rationale: `${gap.feature} is required by the declared game plan.`,
          targetState: gap.communityMedian ? `Approximately ${gap.communityMedian} supporting cards` : `At least ${gap.expectedDensity} supporting cards`
        },
        cardRecommendations: cards.map((cardName) => ({
          cardName,
          supportedFeatures: [gap.feature],
          rationale: `${cardName} directly addresses the diagnosed ${gap.feature} gap.`,
          source: observed ? "community_solution" : "diagnosis_resolution"
        })),
        swapRecommendations:
          removeCard && cards[0]
            ? [
                {
                  removeCard,
                  addCard: cards[0],
                  rationale: `Improves ${gap.feature} while trimming a card less connected to primary desired features.`,
                  gainedFeatures: [gap.feature],
                  lostFeatures: input.composition.cardFeatureMap[removeCard] ?? []
                }
              ]
            : [],
        evidence: gap.evidence
      });
    }

    for (const tension of input.diagnosis.featureTensions) {
      recommendations.push({
        priority: "high",
        strategicRecommendation: {
          title: "Resolve sacrifice infrastructure tension",
          rationale: tension.reason,
          relatedFeatures: tension.relatedFeatures
        },
        structuralRecommendation: {
          title: "Increase repeatable sacrifice outlets",
          rationale: "Sacrifice payoffs need reliable enablers to matter."
        },
        cardRecommendations: ["Goblin Bombardment", "Zuran Orb", "Ashnod's Altar"].map((cardName) => ({
          cardName,
          supportedFeatures: ["Sacrifice Outlet"],
          rationale: `${cardName} helps convert sacrifice payoffs into repeatable game actions.`,
          source: "diagnosis_resolution"
        })),
        swapRecommendations: [],
        evidence: tension.evidence
      });
    }

    if (input.commanderPreference !== "fixed") {
      for (const commanderTension of input.diagnosis.commanderTensions) {
        recommendations.push({
          priority: input.commanderPreference === "open" ? "medium" : "low",
          strategicRecommendation: {
            title: "Explore commander expressions with direct feature support",
            rationale: commanderTension.reason,
            relatedFeatures: commanderTension.relatedFeatures
          },
          cardRecommendations: [],
          swapRecommendations: [],
          evidence: commanderTension.evidence
        });
      }
    }

    return {
      recommendations,
      warnings: recommendations.length === 0 ? [{ reason: "No significant changes recommended." }] : []
    };
  }
}

function priorityFor(role: "primary" | "supporting" | "optional"): RecommendationPriority {
  if (role === "primary") return "high";
  if (role === "supporting") return "medium";
  return "low";
}

function fallbackCards(feature: string): string[] {
  const cards: Record<string, string[]> = {
    "Land Recursion": ["Life from the Loam", "Ramunap Excavator", "Crucible of Worlds", "Splendid Reclamation"],
    "Land Sacrifice": ["Fabled Passage", "Evolving Wilds", "Harrow"],
    "Combat Finisher": ["Craterhoof Behemoth", "Overwhelming Stampede"],
    "Sacrifice Outlet": ["Goblin Bombardment", "Zuran Orb"]
  };
  return cards[feature] ?? [];
}

function findSwapCandidate(input: RecommendChangesInput, gainedFeature: string): string | undefined {
  const desired = new Set(input.gamePlan.desiredFeatures.map((feature) => feature.feature));
  for (const [cardName, features] of Object.entries(input.composition.cardFeatureMap)) {
    if (!features.includes(gainedFeature as never) && !features.some((feature) => desired.has(feature))) return cardName;
  }
  return undefined;
}
