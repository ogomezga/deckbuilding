import { AnalyzeCommunityBaselinesUseCase, FixtureCommunityDeckRepository } from "./features/analyze-community-baselines/index.js";
import { AnalyzeDeckCompositionUseCase } from "./features/analyze-deck-composition/index.js";
import { BuildStrategicDiagnosisUseCase } from "./features/build-strategic-diagnosis/index.js";
import { ClassifyCardFeaturesUseCase, RuleBasedFeatureClassifier } from "./features/classify-card-features/index.js";
import { CuratedCommanderOptionRepository, DiscoverSimilarCommandersUseCase } from "./features/discover-similar-commanders/index.js";
import { EvaluateCommanderFitUseCase } from "./features/evaluate-commander-fit/index.js";
import { ExtractGamePlanUseCase, RuleBasedGamePlanExtractor } from "./features/extract-game-plan/index.js";
import { FetchCardDataUseCase, LocalCardRepository } from "./features/fetch-card-data/index.js";
import { OrchestrateAgentWorkflowUseCase } from "./features/orchestrate-agent-workflow/index.js";
import { RecommendChangesUseCase } from "./features/recommend-changes/index.js";

export function createDefaultOrchestrator(): OrchestrateAgentWorkflowUseCase {
  return new OrchestrateAgentWorkflowUseCase({
    fetchCardData: new FetchCardDataUseCase(new LocalCardRepository()),
    extractGamePlan: new ExtractGamePlanUseCase(new RuleBasedGamePlanExtractor()),
    classifyCardFeatures: new ClassifyCardFeaturesUseCase(new RuleBasedFeatureClassifier()),
    analyzeDeckComposition: new AnalyzeDeckCompositionUseCase(),
    evaluateCommanderFit: new EvaluateCommanderFitUseCase(),
    discoverSimilarCommanders: new DiscoverSimilarCommandersUseCase(new CuratedCommanderOptionRepository()),
    analyzeCommunityBaselines: new AnalyzeCommunityBaselinesUseCase(new FixtureCommunityDeckRepository()),
    buildStrategicDiagnosis: new BuildStrategicDiagnosisUseCase(),
    recommendChanges: new RecommendChangesUseCase()
  });
}
