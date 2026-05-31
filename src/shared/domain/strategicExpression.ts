import type { Color } from "./card.js";
import type { FeatureAssignment } from "./featureAssignment.js";
import type { FeatureName } from "./feature.js";

export type CommanderOptionTension = {
  type:
    | "missing_primary_feature"
    | "off_color_change"
    | "different_win_condition"
    | "slower_play_pattern"
    | "higher_rebuild_cost";
  relatedFeatures: FeatureName[];
  evidence: string[];
};

export type CommanderOption = {
  commander: string;
  colorIdentity: Color[];
  matchingFeatures: FeatureName[];
  missingFeatures: FeatureName[];
  uniqueFeatures: FeatureName[];
  supportingAssignments: FeatureAssignment[];
  tensions: CommanderOptionTension[];
  evidence: string[];
};

export type StrategicTradeoff = {
  type: "color_identity" | "speed" | "resilience" | "win_condition" | "resource_focus" | "deck_rebuild_cost";
  description: string;
  evidence: string[];
};

export type StrategicExpression = {
  name: string;
  description: string;
  emphasizedFeatures: FeatureName[];
  commanderOptions: CommanderOption[];
  tradeoffs: StrategicTradeoff[];
  evidence: string[];
};
