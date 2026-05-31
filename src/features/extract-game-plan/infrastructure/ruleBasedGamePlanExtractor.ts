import type { DesiredFeature, FeatureName } from "../../../shared/domain/feature.js";
import type { ExtractGamePlanInput, ExtractGamePlanOutput, GamePlanExtractor } from "../domain/gamePlanExtractor.js";

const patterns: Array<{ feature: FeatureName; regex: RegExp; role: DesiredFeature["role"] }> = [
  { feature: "Landfall Trigger", regex: /landfall|land enters|fetchland|fetchlands/i, role: "primary" },
  { feature: "Land Sacrifice", regex: /sacrifice.*land|land sacrifice|fetchland|fetchlands/i, role: "primary" },
  { feature: "Land Recursion", regex: /recurs?.*land|land recursion|lands?.*graveyard|from your graveyard/i, role: "primary" },
  { feature: "Extra Land Drop", regex: /additional land|extra land/i, role: "supporting" },
  { feature: "Sacrifice Outlet", regex: /sacrifice outlet|sac outlet/i, role: "supporting" },
  { feature: "Sacrifice Payoff", regex: /sacrifice payoff|whenever.*sacrifice|sacrifice value/i, role: "supporting" },
  { feature: "Graveyard Enabler", regex: /graveyard|dredge|mill/i, role: "supporting" },
  { feature: "+1/+1 Counter Payoff", regex: /\+1\/\+1|counter/i, role: "supporting" },
  { feature: "Combat Finisher", regex: /combat damage|attack|attacking|trample|win through combat/i, role: "primary" },
  { feature: "Mana Acceleration", regex: /ramp|fast|accelerat/i, role: "supporting" },
  { feature: "Protection", regex: /resilien|protect|hexproof|indestructible/i, role: "supporting" },
  { feature: "Token Producer", regex: /token|tokens/i, role: "supporting" },
  { feature: "Aristocrats Payoff", regex: /aristocrat|drain/i, role: "primary" }
];

export class RuleBasedGamePlanExtractor implements GamePlanExtractor {
  async extract(input: ExtractGamePlanInput): Promise<ExtractGamePlanOutput> {
    const description = input.description.trim();
    const detected = new Map<FeatureName, DesiredFeature["role"]>();

    for (const pattern of patterns) {
      if (pattern.regex.test(description)) detected.set(pattern.feature, pattern.role);
    }

    const constraints = [...(input.constraints ?? [])];
    if (/no infinite|no infinites|without infinite/i.test(description) && !constraints.includes("No infinite combos")) {
      constraints.push("No infinite combos");
    }

    if (detected.size < 2 && /fun deck|casual deck|good deck/i.test(description)) {
      return {
        gamePlan: null,
        clarificationQuestions: [
          "How does the deck mainly intend to win?",
          "Which strategic features should the deck emphasize?"
        ],
        warnings: []
      };
    }

    const desiredFeatures = Array.from(detected, ([feature, role]) => ({ feature, role }));
    const winCondition = /combat|attack|trample/i.test(description)
      ? "Combat damage through large creatures."
      : /drain|aristocrat/i.test(description)
        ? "Aristocrats drain."
        : "Value accumulation into a board-based finish.";

    return {
      gamePlan: {
        commander: input.commander,
        primaryObjective: summarizeObjective(desiredFeatures),
        winCondition,
        targetWinTurn: input.targetWinTurn,
        bracket: input.bracket,
        desiredFeatures,
        constraints,
        rawDescription: description,
        preferences: input.preferences
      },
      clarificationQuestions: [],
      warnings: desiredFeatures.length === 0 ? [{ reason: "No known strategic features detected." }] : []
    };
  }
}

function summarizeObjective(features: DesiredFeature[]): string {
  if (features.some((entry) => entry.feature === "Landfall Trigger")) {
    return "Generate repeated landfall and sacrifice triggers to build a decisive combat position.";
  }
  return "Execute the declared strategy through the detected feature package.";
}
