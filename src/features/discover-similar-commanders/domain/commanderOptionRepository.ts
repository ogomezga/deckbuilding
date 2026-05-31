import type { Color, EnrichedCard } from "../../../shared/domain/card.js";
import type { DesiredFeature } from "../../../shared/domain/feature.js";
import type { FeatureAssignment } from "../../../shared/domain/featureAssignment.js";

export type CommanderOptionSource = {
  commander: EnrichedCard;
  features: FeatureAssignment[];
  strategicTags?: string[];
};

export type FindCommanderOptionsInput = {
  desiredFeatures: DesiredFeature[];
  includeOffColor: boolean;
  currentColorIdentity?: Color[];
};

export interface CommanderOptionRepository {
  findOptions(input: FindCommanderOptionsInput): Promise<CommanderOptionSource[]>;
}
