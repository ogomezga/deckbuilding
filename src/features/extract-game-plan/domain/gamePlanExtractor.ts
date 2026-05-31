import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { PlayerPreferences } from "../../../shared/domain/playerPreferences.js";

export type ExtractGamePlanInput = {
  commander: string;
  description: string;
  targetWinTurn?: number;
  bracket?: number;
  constraints?: string[];
  preferences?: PlayerPreferences;
};

export type ExtractGamePlanOutput = {
  gamePlan: GamePlan | null;
  clarificationQuestions: string[];
  warnings: Array<{ reason: string }>;
};

export interface GamePlanExtractor {
  extract(input: ExtractGamePlanInput): Promise<ExtractGamePlanOutput>;
}
