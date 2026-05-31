import type { EnrichedCard } from "../../../shared/domain/card.js";
import type { CommanderFit } from "../../../shared/domain/commanderFit.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { FeatureAssignment } from "../../../shared/domain/featureAssignment.js";
import type { Warning } from "../../../shared/domain/warning.js";
import type { DeckComposition } from "../../analyze-deck-composition/application/analyzeDeckComposition.usecase.js";

export type EvaluateCommanderFitInput = {
  commander: EnrichedCard;
  commanderFeatures: FeatureAssignment[];
  gamePlan: GamePlan;
  composition: DeckComposition;
};

export type EvaluateCommanderFitOutput = {
  commanderFit: CommanderFit;
  warnings: Warning[];
};

export class EvaluateCommanderFitUseCase {
  async execute(input: EvaluateCommanderFitInput): Promise<EvaluateCommanderFitOutput> {
    const commanderFeatureNames = new Set(input.commanderFeatures.map((feature) => feature.name));
    const supportingFeatures = input.gamePlan.desiredFeatures
      .filter((desired) => commanderFeatureNames.has(desired.feature))
      .map((desired) => ({
        feature: desired.feature,
        evidence: input.commanderFeatures.filter((feature) => feature.name === desired.feature).map((feature) => feature.evidence)
      }));
    const unsupportedFeatures = input.gamePlan.desiredFeatures
      .filter((desired) => !commanderFeatureNames.has(desired.feature))
      .map((desired) => ({
        feature: desired.feature,
        reason: `The commander does not directly support ${desired.feature}.`
      }));
    const indirectSupport =
      commanderFeatureNames.has("Card Advantage Engine") &&
      input.gamePlan.desiredFeatures.some((desired) => desired.feature === "Combat Finisher")
        ? [
            {
              feature: "Combat Finisher" as const,
              path: ["Card Advantage Engine", "Resource Accumulation"],
              evidence: ["Repeated card access can improve access to finishers."]
            }
          ]
        : [];
    const findings: CommanderFit["findings"] = [
      ...supportingFeatures.map((feature) => ({
        type: "strength" as const,
        category: "feature_support" as const,
        relatedFeatures: [feature.feature],
        evidence: feature.evidence
      })),
      ...unsupportedFeatures.map((feature) => ({
        type: "weakness" as const,
        category: "missing_support" as const,
        relatedFeatures: [feature.feature],
        evidence: [feature.reason]
      }))
    ];
    if (input.gamePlan.targetWinTurn && input.gamePlan.targetWinTurn <= 6 && input.commander.manaValue >= 5) {
      findings.push({
        type: "tension",
        category: "speed",
        relatedFeatures: input.gamePlan.desiredFeatures.map((feature) => feature.feature),
        evidence: [`Target win turn is ${input.gamePlan.targetWinTurn}. Commander mana value is ${input.commander.manaValue}.`]
      });
    }

    return {
      commanderFit: {
        commander: input.commander.name,
        supportingFeatures,
        unsupportedFeatures,
        indirectSupport,
        findings
      },
      warnings: []
    };
  }
}
