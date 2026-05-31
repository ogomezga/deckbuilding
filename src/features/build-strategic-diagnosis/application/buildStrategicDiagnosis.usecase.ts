import type { CommanderFit } from "../../../shared/domain/commanderFit.js";
import type { CommunityBaselineReport } from "../../../shared/domain/communityBaseline.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { StrategicDiagnosis } from "../../../shared/domain/strategicDiagnosis.js";
import type { StrategicExpression } from "../../../shared/domain/strategicExpression.js";
import type { Warning } from "../../../shared/domain/warning.js";
import type { DeckComposition } from "../../analyze-deck-composition/application/analyzeDeckComposition.usecase.js";

export type BuildStrategicDiagnosisInput = {
  gamePlan: GamePlan;
  composition: DeckComposition;
  commanderFit: CommanderFit;
  strategicExpressions: StrategicExpression[];
  communityBaselineReport: CommunityBaselineReport;
};

export type BuildStrategicDiagnosisOutput = {
  diagnosis: StrategicDiagnosis;
  warnings: Warning[];
};

export class BuildStrategicDiagnosisUseCase {
  async execute(input: BuildStrategicDiagnosisInput): Promise<BuildStrategicDiagnosisOutput> {
    const featureGaps: StrategicDiagnosis["featureGaps"] = [];
    const communityDivergences: StrategicDiagnosis["communityDivergences"] = [];
    const commanderTensions: StrategicDiagnosis["commanderTensions"] = [];
    const featureTensions: StrategicDiagnosis["featureTensions"] = [];
    const featureSurpluses: StrategicDiagnosis["featureSurpluses"] = [];
    const powerLevelConcerns: StrategicDiagnosis["powerLevelConcerns"] = [];

    for (const desired of input.gamePlan.desiredFeatures) {
      const currentDensity = input.composition.featureDensity[desired.feature] ?? 0;
      const baseline = input.communityBaselineReport.featureBaselines.find((entry) => entry.feature === desired.feature);
      const expectedDensity = desired.role === "primary" ? 4 : desired.role === "supporting" ? 2 : 1;
      if (currentDensity < expectedDensity) {
        featureGaps.push({
          feature: desired.feature,
          role: desired.role,
          currentDensity,
          expectedDensity,
          communityMedian: baseline?.medianDensity,
          reason: `${desired.feature} is a ${desired.role} desired feature, but current density is low for that role.`,
          evidence: [
            { source: "game_plan", detail: `${desired.feature} is a ${desired.role} desired feature.` },
            { source: "deck_composition", detail: `Current ${desired.feature} density: ${currentDensity}.` },
            ...(baseline ? [{ source: "community_baseline" as const, detail: `Observed median ${desired.feature} density: ${baseline.medianDensity}.` }] : [])
          ]
        });
      }
    }

    for (const finding of input.communityBaselineReport.findings) {
      const desired = input.gamePlan.desiredFeatures.find((feature) => feature.feature === finding.feature);
      if (desired && finding.currentDensity < finding.observedRange.lowerQuartile) {
        communityDivergences.push({
          feature: finding.feature,
          currentDensity: finding.currentDensity,
          observedMedian: finding.observedMedian,
          observedRange: finding.observedRange,
          reason: `Current ${finding.feature} density is lower than commonly observed for similar strategies.`,
          evidence: [{ source: "community_baseline", detail: `Observed range: ${finding.observedRange.lowerQuartile}-${finding.observedRange.upperQuartile}.` }]
        });
      }
    }

    for (const unsupported of input.commanderFit.unsupportedFeatures) {
      const desired = input.gamePlan.desiredFeatures.find((feature) => feature.feature === unsupported.feature);
      if (desired?.role === "primary") {
        commanderTensions.push({
          type: "missing_commander_support",
          relatedFeatures: [unsupported.feature],
          reason: `The commander does not directly support primary feature ${unsupported.feature}.`,
          evidence: [{ source: "commander_fit", detail: unsupported.reason }]
        });
      }
    }

    const sacrificePayoff = input.composition.featureDensity["Sacrifice Payoff"] ?? 0;
    const sacrificeOutlet = input.composition.featureDensity["Sacrifice Outlet"] ?? 0;
    if (sacrificePayoff >= 3 && sacrificeOutlet < 2) {
      featureTensions.push({
        type: "payoff_without_enabler",
        relatedFeatures: ["Sacrifice Payoff", "Sacrifice Outlet"],
        reason: "The deck appears to contain more sacrifice payoffs than repeatable sacrifice outlets.",
        evidence: [
          { source: "deck_composition", detail: `Sacrifice Payoff density: ${sacrificePayoff}.` },
          { source: "deck_composition", detail: `Sacrifice Outlet density: ${sacrificeOutlet}.` }
        ]
      });
    }

    const desiredFeatures = new Set(input.gamePlan.desiredFeatures.map((feature) => feature.feature));
    for (const [feature, density] of Object.entries(input.composition.featureDensity)) {
      if (density && density >= 5 && !desiredFeatures.has(feature as never)) {
        featureSurpluses.push({
          feature: feature as never,
          currentDensity: density,
          reason: `${feature} has meaningful density without a direct declared role in the game plan.`,
          evidence: [{ source: "deck_composition", detail: `Current ${feature} density: ${density}.` }]
        });
      }
    }

    if (input.gamePlan.targetWinTurn && input.gamePlan.targetWinTurn <= 6 && input.composition.averageManaValue >= 3.6) {
      powerLevelConcerns.push({
        type: "too_slow_for_target",
        reason: "The target win turn is early, but average mana value suggests meaningful setup cost.",
        evidence: [
          { source: "game_plan", detail: `Target win turn: ${input.gamePlan.targetWinTurn}.` },
          { source: "deck_composition", detail: `Average mana value: ${input.composition.averageManaValue}.` }
        ]
      });
    }

    return {
      diagnosis: {
        featureGaps,
        featureSurpluses,
        featureTensions,
        commanderTensions,
        communityDivergences,
        powerLevelConcerns,
        supportingEvidence: input.strategicExpressions.map((expression) => ({
          source: "commander_discovery",
          detail: `Discovered strategic expression: ${expression.name}.`
        }))
      },
      warnings: []
    };
  }
}
