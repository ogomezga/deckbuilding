import {
  AnalyzeCommunityBaselinesUseCase,
  ArchidektCommunityDeckSource,
  EdhrecCommunityDeckSource,
  MtgGoldfishCommunityDeckSource,
  MultiSourceCommunityDeckRepository
} from "./features/analyze-community-baselines/index.js";
import { AnalyzeDeckCompositionUseCase } from "./features/analyze-deck-composition/index.js";
import { BuildStrategicDiagnosisUseCase } from "./features/build-strategic-diagnosis/index.js";
import { ClassifyCardFeaturesUseCase, RuleBasedFeatureClassifier } from "./features/classify-card-features/index.js";
import { CuratedCommanderOptionRepository, DiscoverSimilarCommandersUseCase } from "./features/discover-similar-commanders/index.js";
import { EvaluateCommanderFitUseCase } from "./features/evaluate-commander-fit/index.js";
import { ExtractGamePlanUseCase, LlmGamePlanExtractor } from "./features/extract-game-plan/index.js";
import { FetchCardDataUseCase, ScryfallCardRepository } from "./features/fetch-card-data/index.js";
import { LlmResponseSynthesizer, OrchestrateAgentWorkflowUseCase } from "./features/orchestrate-agent-workflow/index.js";
import { RecommendChangesUseCase } from "./features/recommend-changes/index.js";
import type { DataSourceMetadata } from "./shared/domain/dataSource.js";
import { OpenAiLlmProvider } from "./shared/llm/openAiLlmProvider.js";

export type RuntimeConfig = {
  openAiApiKey: string;
  openAiModel: string;
};

export function runtimeConfigFromEnv(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const openAiApiKey = env.OPENAI_API_KEY;
  if (!openAiApiKey) {
    throw new Error(
      "Missing required environment variable OPENAI_API_KEY. Set it before running the CLI, for example: OPENAI_API_KEY=sk-... corepack pnpm cli analyze --deck <deck> --goal <goal> --output <report>"
    );
  }

  return {
    openAiApiKey,
    openAiModel: env.OPENAI_MODEL ?? "gpt-5-mini"
  };
}

export function createRuntimeOrchestrator(config: RuntimeConfig): OrchestrateAgentWorkflowUseCase {
  const llmProvider = new OpenAiLlmProvider({
    apiKey: config.openAiApiKey,
    model: config.openAiModel
  });

  const dataSources: DataSourceMetadata = {
    cardMetadata: { source: "Scryfall", status: "available" },
    gamePlanExtraction: { source: `OpenAI (${config.openAiModel})`, status: "available" },
    featureClassification: { source: "rule-based", status: "available" },
    communityBaselines: {
      source: "EDHREC, MTGGoldfish, Archidekt",
      status: "unavailable",
      warning: "Configured community sources are queried, but deck-level feature baselines are unavailable until source-specific deck parsing is implemented."
    },
    commanderOptions: { source: "curated dataset", status: "available" },
    responseSynthesis: { source: `OpenAI (${config.openAiModel})`, status: "available" }
  };

  return new OrchestrateAgentWorkflowUseCase({
    fetchCardData: new FetchCardDataUseCase(new ScryfallCardRepository()),
    extractGamePlan: new ExtractGamePlanUseCase(new LlmGamePlanExtractor(llmProvider)),
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
    recommendChanges: new RecommendChangesUseCase(),
    responseSynthesizer: new LlmResponseSynthesizer(llmProvider),
    dataSources
  });
}
