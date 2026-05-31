import type { CommanderFit } from "../../../shared/domain/commanderFit.js";
import type { EnrichedCard } from "../../../shared/domain/card.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { CommanderPreference } from "../../../shared/domain/playerPreferences.js";
import type { StrategicExpression } from "../../../shared/domain/strategicExpression.js";
import type { FeatureAssignment } from "../../../shared/domain/featureAssignment.js";
import type { Warning } from "../../../shared/domain/warning.js";
import type { CommanderOptionRepository, CommanderOptionSource } from "../domain/commanderOptionRepository.js";

export type DiscoverSimilarCommandersInput = {
  gamePlan: GamePlan;
  commanderPreference: CommanderPreference;
  currentCommander?: EnrichedCard;
  currentCommanderFeatures?: FeatureAssignment[];
  commanderFit?: CommanderFit;
  candidatePool?: CommanderOptionSource[];
};

export type DiscoverSimilarCommandersOutput = {
  strategicExpressions: StrategicExpression[];
  skipped: boolean;
  reason?: string;
  warnings: Warning[];
};

export class DiscoverSimilarCommandersUseCase {
  constructor(private readonly commanderOptionRepository: CommanderOptionRepository) {}

  async execute(input: DiscoverSimilarCommandersInput): Promise<DiscoverSimilarCommandersOutput> {
    if (input.commanderPreference === "fixed") {
      return {
        strategicExpressions: [],
        skipped: true,
        reason: "Commander preference is fixed. Alternative commander discovery was skipped.",
        warnings: []
      };
    }
    const candidates =
      input.candidatePool ??
      (await this.commanderOptionRepository.findOptions({
        desiredFeatures: input.gamePlan.desiredFeatures,
        includeOffColor: input.commanderPreference === "open",
        currentColorIdentity: input.currentCommander?.colorIdentity
      }));
    const desiredFeatures = input.gamePlan.desiredFeatures.map((feature) => feature.feature);
    const primaryFeatures = input.gamePlan.desiredFeatures.filter((feature) => feature.role === "primary").map((feature) => feature.feature);
    const grouped = new Map<string, StrategicExpression>();

    for (const candidate of candidates) {
      const matchingFeatures = candidate.features.filter((feature) => desiredFeatures.includes(feature.name)).map((feature) => feature.name);
      if (matchingFeatures.length === 0) continue;
      const missingFeatures = desiredFeatures.filter((feature) => !matchingFeatures.includes(feature));
      const tag = candidate.strategicTags?.[0] ?? matchingFeatures.join(" + ");
      const expression =
        grouped.get(tag) ??
        ({
          name: tag,
          description: `Commander-centered expression emphasizing ${matchingFeatures.join(", ")}.`,
          emphasizedFeatures: matchingFeatures,
          commanderOptions: [],
          tradeoffs: [],
          evidence: [`Expression created from desired features: ${desiredFeatures.join(", ")}.`]
        } satisfies StrategicExpression);
      const colorChanged =
        input.currentCommander &&
        candidate.commander.colorIdentity.join(",") !== input.currentCommander.colorIdentity.join(",");
      if (colorChanged) {
        expression.tradeoffs.push({
          type: "color_identity",
          description: "Changing color identity may require rebuilding parts of the deck.",
          evidence: [
            `Current commander color identity: ${input.currentCommander?.colorIdentity.join(",")}`,
            `Option color identity: ${candidate.commander.colorIdentity.join(",")}`
          ]
        });
      }
      expression.commanderOptions.push({
        commander: candidate.commander.name,
        colorIdentity: candidate.commander.colorIdentity,
        matchingFeatures,
        missingFeatures,
        uniqueFeatures: candidate.features.map((feature) => feature.name).filter((feature) => !desiredFeatures.includes(feature)),
        supportingAssignments: candidate.features.filter((feature) => matchingFeatures.includes(feature.name)),
        tensions: missingFeatures
          .filter((feature) => primaryFeatures.includes(feature))
          .map((feature) => ({
            type: "missing_primary_feature",
            relatedFeatures: [feature],
            evidence: [`Primary desired feature not found on commander option: ${feature}.`]
          })),
        evidence: matchingFeatures.map((feature) => `Commander option matches desired feature: ${feature}.`)
      });
      grouped.set(tag, expression);
    }

    return { strategicExpressions: Array.from(grouped.values()), skipped: false, warnings: [] };
  }
}
