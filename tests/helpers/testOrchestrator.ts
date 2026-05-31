import { AnalyzeCommunityBaselinesUseCase } from "../../src/features/analyze-community-baselines/index.js";
import { AnalyzeDeckCompositionUseCase } from "../../src/features/analyze-deck-composition/index.js";
import { BuildStrategicDiagnosisUseCase } from "../../src/features/build-strategic-diagnosis/index.js";
import { ClassifyCardFeaturesUseCase, RuleBasedFeatureClassifier } from "../../src/features/classify-card-features/index.js";
import { CuratedCommanderOptionRepository, DiscoverSimilarCommandersUseCase } from "../../src/features/discover-similar-commanders/index.js";
import { EvaluateCommanderFitUseCase } from "../../src/features/evaluate-commander-fit/index.js";
import { ExtractGamePlanUseCase, RuleBasedGamePlanExtractor } from "../../src/features/extract-game-plan/index.js";
import { FetchCardDataUseCase } from "../../src/features/fetch-card-data/index.js";
import { OrchestrateAgentWorkflowUseCase, type ResponseSynthesizer } from "../../src/features/orchestrate-agent-workflow/index.js";
import { RecommendChangesUseCase } from "../../src/features/recommend-changes/index.js";
import { FixtureTestCommunityDeckRepository } from "./fixtureCommunityDeckRepository.js";
import { LocalTestCardRepository } from "./localCardRepository.js";

const responseSynthesizer: ResponseSynthesizer = {
  async synthesize() {
    return "Test synthesis.";
  }
};

export function createTestOrchestrator(): OrchestrateAgentWorkflowUseCase {
  return new OrchestrateAgentWorkflowUseCase({
    fetchCardData: new FetchCardDataUseCase(new LocalTestCardRepository()),
    extractGamePlan: new ExtractGamePlanUseCase(new RuleBasedGamePlanExtractor()),
    classifyCardFeatures: new ClassifyCardFeaturesUseCase(new RuleBasedFeatureClassifier()),
    analyzeDeckComposition: new AnalyzeDeckCompositionUseCase(),
    evaluateCommanderFit: new EvaluateCommanderFitUseCase(),
    discoverSimilarCommanders: new DiscoverSimilarCommandersUseCase(new CuratedCommanderOptionRepository()),
    analyzeCommunityBaselines: new AnalyzeCommunityBaselinesUseCase(new FixtureTestCommunityDeckRepository()),
    buildStrategicDiagnosis: new BuildStrategicDiagnosisUseCase(),
    recommendChanges: new RecommendChangesUseCase(),
    responseSynthesizer,
    dataSources: {
      cardMetadata: { source: "Scryfall", status: "available" },
      gamePlanExtraction: { source: "test extractor", status: "available" },
      featureClassification: { source: "rule-based", status: "available" },
      communityBaselines: { source: "test fixtures", status: "available" },
      commanderOptions: { source: "curated dataset", status: "available" },
      responseSynthesis: { source: "test synthesizer", status: "available" }
    }
  });
}
