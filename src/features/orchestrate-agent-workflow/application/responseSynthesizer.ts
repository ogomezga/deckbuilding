import type { CommunityBaselineReport } from "../../../shared/domain/communityBaseline.js";
import type { CommanderFit } from "../../../shared/domain/commanderFit.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { Recommendation } from "../../../shared/domain/recommendation.js";
import type { StrategicDiagnosis } from "../../../shared/domain/strategicDiagnosis.js";
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
