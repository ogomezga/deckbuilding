import type { DesiredFeature } from "./feature.js";
import type { PlayerPreferences } from "./playerPreferences.js";

export type GamePlan = {
  commander: string;
  primaryObjective: string;
  winCondition: string;
  targetWinTurn?: number;
  bracket?: number;
  desiredFeatures: DesiredFeature[];
  constraints: string[];
  rawDescription: string;
  preferences?: PlayerPreferences;
  strategicAngles?: string[];
};
