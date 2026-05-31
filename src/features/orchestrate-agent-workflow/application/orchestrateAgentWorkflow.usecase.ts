import { AnalyzeCommunityBaselinesUseCase } from "../../analyze-community-baselines/index.js";
import { AnalyzeDeckCompositionUseCase, type DeckComposition } from "../../analyze-deck-composition/index.js";
import { BuildStrategicDiagnosisUseCase } from "../../build-strategic-diagnosis/index.js";
import { ClassifyCardFeaturesUseCase } from "../../classify-card-features/index.js";
import { DiscoverSimilarCommandersUseCase } from "../../discover-similar-commanders/index.js";
import { EvaluateCommanderFitUseCase } from "../../evaluate-commander-fit/index.js";
import { ExtractGamePlanUseCase } from "../../extract-game-plan/index.js";
import { FetchCardDataUseCase } from "../../fetch-card-data/index.js";
import { parseMoxfieldDecklist } from "../../parse-moxfield-decklist/index.js";
import { RecommendChangesUseCase } from "../../recommend-changes/index.js";
import type { EnrichedCard } from "../../../shared/domain/card.js";
import type { CardFeature } from "../../../shared/domain/featureAssignment.js";
import type { GamePlan } from "../../../shared/domain/gamePlan.js";
import type { CommanderPreference } from "../../../shared/domain/playerPreferences.js";
import type { Recommendation } from "../../../shared/domain/recommendation.js";
import type { StrategicDiagnosis } from "../../../shared/domain/strategicDiagnosis.js";
import type { CommunityBaselineReport } from "../../../shared/domain/communityBaseline.js";
import type { CommanderFit } from "../../../shared/domain/commanderFit.js";
import type { StrategicExpression } from "../../../shared/domain/strategicExpression.js";
import type { ParsedDeck } from "../../../shared/domain/deck.js";

export type OrchestrateAgentWorkflowInput = {
  rawDecklist: string;
  goalDescription: string;
  commanderPreference: CommanderPreference;
  targetWinTurn?: number;
  bracket?: number;
  constraints?: string[];
};

export type AnalysisSession = {
  deck?: ParsedDeck;
  cards?: EnrichedCard[];
  gamePlan?: GamePlan;
  cardFeatures?: CardFeature[];
  composition?: DeckComposition;
  commanderFit?: CommanderFit;
  strategicExpressions?: StrategicExpression[];
  communityBaselineReport?: CommunityBaselineReport;
  diagnosis?: StrategicDiagnosis;
  recommendations?: Recommendation[];
};

export type OrchestrateAgentWorkflowOutput = {
  session: Required<AnalysisSession>;
  warnings: Array<{ reason: string }>;
};

export type OrchestratorDependencies = {
  fetchCardData: FetchCardDataUseCase;
  extractGamePlan: ExtractGamePlanUseCase;
  classifyCardFeatures: ClassifyCardFeaturesUseCase;
  analyzeDeckComposition: AnalyzeDeckCompositionUseCase;
  evaluateCommanderFit: EvaluateCommanderFitUseCase;
  discoverSimilarCommanders: DiscoverSimilarCommandersUseCase;
  analyzeCommunityBaselines: AnalyzeCommunityBaselinesUseCase;
  buildStrategicDiagnosis: BuildStrategicDiagnosisUseCase;
  recommendChanges: RecommendChangesUseCase;
};

export class OrchestrateAgentWorkflowUseCase {
  constructor(private readonly dependencies: OrchestratorDependencies) {}

  async execute(input: OrchestrateAgentWorkflowInput): Promise<OrchestrateAgentWorkflowOutput> {
    const warnings: Array<{ reason: string }> = [];
    const parsed = parseMoxfieldDecklist({ rawDecklist: input.rawDecklist });
    if (!parsed.ok) throw new Error(parsed.error.message);
    warnings.push(...parsed.value.warnings.map((warning) => ({ reason: warning.reason })));

    const commanderName = parsed.value.deck.commanders[0]?.name;
    if (!commanderName) throw new Error("No commander found.");
    const cardNames = [...parsed.value.deck.mainboard, ...parsed.value.deck.commanders].map((card) => card.name);
    const fetched = await this.dependencies.fetchCardData.execute({ cardNames });
    if (!fetched.ok) throw new Error(fetched.error.message);
    warnings.push(...fetched.value.warnings.map((warning) => ({ reason: warning.reason })));

    const gamePlanOutput = await this.dependencies.extractGamePlan.execute({
      commander: commanderName,
      description: input.goalDescription,
      targetWinTurn: input.targetWinTurn,
      bracket: input.bracket,
      constraints: input.constraints,
      preferences: { commanderPreference: input.commanderPreference }
    });
    if (!gamePlanOutput.gamePlan) {
      throw new Error(`Game plan needs clarification: ${gamePlanOutput.clarificationQuestions.join(" ")}`);
    }
    warnings.push(...gamePlanOutput.warnings);

    const classified = await this.dependencies.classifyCardFeatures.execute({ cards: fetched.value.cards });
    warnings.push(...classified.warnings.map((warning) => ({ reason: warning.reason })));

    const compositionOutput = await this.dependencies.analyzeDeckComposition.execute({
      deck: parsed.value.deck,
      cards: fetched.value.cards,
      cardFeatures: classified.cardFeatures
    });
    warnings.push(...compositionOutput.warnings.map((warning) => ({ reason: warning.reason })));

    const commanderCard = fetched.value.cards.find((card) => card.name.toLocaleLowerCase() === commanderName.toLocaleLowerCase());
    if (!commanderCard) throw new Error(`Commander metadata not found: ${commanderName}`);
    const commanderFeatures =
      classified.cardFeatures.find((entry) => entry.cardName.toLocaleLowerCase() === commanderName.toLocaleLowerCase())?.features ?? [];
    const commanderFitOutput = await this.dependencies.evaluateCommanderFit.execute({
      commander: commanderCard,
      commanderFeatures,
      gamePlan: gamePlanOutput.gamePlan,
      composition: compositionOutput.composition
    });

    const commanderDiscoveryOutput = await this.dependencies.discoverSimilarCommanders.execute({
      gamePlan: gamePlanOutput.gamePlan,
      commanderPreference: input.commanderPreference,
      currentCommander: commanderCard,
      currentCommanderFeatures: commanderFeatures,
      commanderFit: commanderFitOutput.commanderFit
    });

    const communityOutput = await this.dependencies.analyzeCommunityBaselines.execute({
      gamePlan: gamePlanOutput.gamePlan,
      deckComposition: compositionOutput.composition,
      strategicExpressions: commanderDiscoveryOutput.strategicExpressions
    });

    const diagnosisOutput = await this.dependencies.buildStrategicDiagnosis.execute({
      gamePlan: gamePlanOutput.gamePlan,
      composition: compositionOutput.composition,
      commanderFit: commanderFitOutput.commanderFit,
      strategicExpressions: commanderDiscoveryOutput.strategicExpressions,
      communityBaselineReport: communityOutput.baselineReport
    });

    const recommendationsOutput = await this.dependencies.recommendChanges.execute({
      gamePlan: gamePlanOutput.gamePlan,
      diagnosis: diagnosisOutput.diagnosis,
      composition: compositionOutput.composition,
      commanderPreference: input.commanderPreference,
      communityBaselineReport: communityOutput.baselineReport
    });

    return {
      session: {
        deck: parsed.value.deck,
        cards: fetched.value.cards,
        gamePlan: gamePlanOutput.gamePlan,
        cardFeatures: classified.cardFeatures,
        composition: compositionOutput.composition,
        commanderFit: commanderFitOutput.commanderFit,
        strategicExpressions: commanderDiscoveryOutput.strategicExpressions,
        communityBaselineReport: communityOutput.baselineReport,
        diagnosis: diagnosisOutput.diagnosis,
        recommendations: recommendationsOutput.recommendations
      },
      warnings
    };
  }
}
