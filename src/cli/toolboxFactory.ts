import {
  AnalyzeCommunityBaselinesUseCase,
  ArchidektCommunityDeckSource,
  EdhrecCommunityDeckSource,
  MtgGoldfishCommunityDeckSource,
  MultiSourceCommunityDeckRepository
} from "../features/analyze-community-baselines/index.js";
import { AnalyzeDeckCompositionUseCase } from "../features/analyze-deck-composition/index.js";
import { BuildStrategicDiagnosisUseCase } from "../features/build-strategic-diagnosis/index.js";
import { ClassifyCardFeaturesUseCase, RuleBasedFeatureClassifier } from "../features/classify-card-features/index.js";
import { CuratedCommanderOptionRepository, DiscoverSimilarCommandersUseCase } from "../features/discover-similar-commanders/index.js";
import { EvaluateCommanderFitUseCase } from "../features/evaluate-commander-fit/index.js";
import { FetchCardDataUseCase, ScryfallCardRepository } from "../features/fetch-card-data/index.js";
import { RecommendChangesUseCase } from "../features/recommend-changes/index.js";

export function createToolbox() {
  return {
    fetchCardData: new FetchCardDataUseCase(new ScryfallCardRepository()),
    classifyCardFeatures: new ClassifyCardFeaturesUseCase(new RuleBasedFeatureClassifier()),
    analyzeDeckComposition: new AnalyzeDeckCompositionUseCase(),
    evaluateCommanderFit: new EvaluateCommanderFitUseCase(),
    discoverSimilarCommanders: new DiscoverSimilarCommandersUseCase(new CuratedCommanderOptionRepository()),
    analyzeCommunityBaselines: new AnalyzeCommunityBaselinesUseCase(
      new MultiSourceCommunityDeckRepository([
        new EdhrecCommunityDeckSource(),
        new MtgGoldfishCommunityDeckSource(),
        new ArchidektCommunityDeckSource()
      ])
    ),
    buildStrategicDiagnosis: new BuildStrategicDiagnosisUseCase(),
    recommendChanges: new RecommendChangesUseCase()
  };
}
