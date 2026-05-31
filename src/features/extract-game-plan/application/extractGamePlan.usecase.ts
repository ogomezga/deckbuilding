import type { ExtractGamePlanInput, ExtractGamePlanOutput, GamePlanExtractor } from "../domain/gamePlanExtractor.js";

export class ExtractGamePlanUseCase {
  constructor(private readonly extractor: GamePlanExtractor) {}

  async execute(input: ExtractGamePlanInput): Promise<ExtractGamePlanOutput> {
    const warnings: Array<{ reason: string }> = [];
    if (!input.commander.trim()) {
      return { gamePlan: null, clarificationQuestions: ["Which commander should be analyzed?"], warnings };
    }
    if (!input.description.trim()) {
      return { gamePlan: null, clarificationQuestions: ["What is the deck trying to accomplish?"], warnings };
    }
    if (input.targetWinTurn !== undefined && (!Number.isInteger(input.targetWinTurn) || input.targetWinTurn <= 0)) {
      throw new Error("targetWinTurn must be a positive integer.");
    }
    if (input.bracket !== undefined && (!Number.isInteger(input.bracket) || input.bracket < 1 || input.bracket > 5)) {
      throw new Error("bracket must be between 1 and 5.");
    }
    const output = await this.extractor.extract(input);
    return { ...output, warnings: [...warnings, ...output.warnings] };
  }
}
