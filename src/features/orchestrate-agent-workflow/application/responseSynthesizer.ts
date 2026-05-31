import type { CommunityBaselineReport } from "../../../shared/domain/communityBaseline.js";
import type { CommanderFit } from "../../../shared/domain/commanderFit.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { Recommendation } from "../../../shared/domain/recommendation.js";
import type { StrategicDiagnosis } from "../../../shared/domain/strategicDiagnosis.js";
import type { LlmProvider } from "../../../shared/llm/llmProvider.js";
import type { DeckComposition } from "../../analyze-deck-composition/index.js";

export type ResponseSynthesisInput = {
  gamePlan: GamePlan;
  composition: DeckComposition;
  commanderFit: CommanderFit;
  communityBaselineReport: CommunityBaselineReport;
  diagnosis: StrategicDiagnosis;
  recommendations: Recommendation[];
};

export interface ResponseSynthesizer {
  synthesize(input: ResponseSynthesisInput): Promise<string>;
}

export class LlmResponseSynthesizer implements ResponseSynthesizer {
  constructor(private readonly llmProvider: LlmProvider) {}

  async synthesize(input: ResponseSynthesisInput): Promise<string> {
    return this.llmProvider.generateText({
      systemPrompt:
        "Write a concise Commander deck analysis summary from the provided structured outputs. Do not invent evidence. Do not add card recommendations that are not present in the recommendations list.",
      userPrompt: JSON.stringify({
        gamePlan: input.gamePlan,
        composition: {
          totalCards: input.composition.totalCards,
          landCount: input.composition.landCount,
          averageManaValue: input.composition.averageManaValue,
          detectedFeatures: input.composition.detectedFeatures
        },
        commanderFit: input.commanderFit,
        communityBaselineReport: input.communityBaselineReport,
        diagnosis: input.diagnosis,
        recommendations: input.recommendations
      })
    });
  }
}
