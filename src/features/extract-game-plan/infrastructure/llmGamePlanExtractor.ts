import { featureNames, type DesiredFeature } from "../../../shared/domain/feature.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { LlmProvider } from "../../../shared/llm/llmProvider.js";
import type { ExtractGamePlanInput, ExtractGamePlanOutput, GamePlanExtractor } from "../domain/gamePlanExtractor.js";

type LlmGamePlan = {
  primaryObjective: string;
  winCondition: string;
  desiredFeatures: DesiredFeature[];
  constraints: string[];
  clarificationQuestions: string[];
  warnings: Array<{ reason: string }>;
};

export class LlmGamePlanExtractor implements GamePlanExtractor {
  constructor(private readonly llmProvider: LlmProvider) {}

  async extract(input: ExtractGamePlanInput): Promise<ExtractGamePlanOutput> {
    const result = await this.llmProvider.generateJson<LlmGamePlan>({
      schemaName: "game_plan_extraction",
      schema: gamePlanSchema,
      systemPrompt:
        "Extract a Commander deck game plan from the user's natural language. Do not analyze the decklist. Do not recommend cards. Use only the allowed feature names.",
      userPrompt: JSON.stringify({
        commander: input.commander,
        description: input.description,
        targetWinTurn: input.targetWinTurn,
        bracket: input.bracket,
        explicitConstraints: input.constraints ?? [],
        allowedFeatures: featureNames
      })
    });

    if (result.clarificationQuestions.length > 0 && result.desiredFeatures.length === 0) {
      return {
        gamePlan: null,
        clarificationQuestions: result.clarificationQuestions,
        warnings: result.warnings
      };
    }

    const gamePlan: GamePlan = {
      commander: input.commander,
      primaryObjective: result.primaryObjective,
      winCondition: result.winCondition,
      targetWinTurn: input.targetWinTurn,
      bracket: input.bracket,
      desiredFeatures: normalizeDesiredFeatures(result.desiredFeatures),
      constraints: Array.from(new Set([...(input.constraints ?? []), ...result.constraints])),
      rawDescription: input.description,
      preferences: input.preferences
    };

    return {
      gamePlan,
      clarificationQuestions: result.clarificationQuestions,
      warnings: result.warnings
    };
  }
}

const gamePlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["primaryObjective", "winCondition", "desiredFeatures", "constraints", "clarificationQuestions", "warnings"],
  properties: {
    primaryObjective: { type: "string" },
    winCondition: { type: "string" },
    desiredFeatures: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["feature", "role"],
        properties: {
          feature: { type: "string", enum: featureNames },
          role: { type: "string", enum: ["primary", "supporting", "optional"] }
        }
      }
    },
    constraints: { type: "array", items: { type: "string" } },
    clarificationQuestions: { type: "array", items: { type: "string" } },
    warnings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["reason"],
        properties: { reason: { type: "string" } }
      }
    }
  }
};

function normalizeDesiredFeatures(features: DesiredFeature[]): DesiredFeature[] {
  const seen = new Set<string>();
  return features.filter((feature) => {
    if (seen.has(feature.feature)) return false;
    seen.add(feature.feature);
    return true;
  });
}
