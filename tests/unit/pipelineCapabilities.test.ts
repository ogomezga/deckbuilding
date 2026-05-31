import { describe, expect, it } from "vitest";
import { AnalyzeCommunityBaselinesUseCase } from "../../src/features/analyze-community-baselines/index.js";
import { AnalyzeDeckCompositionUseCase } from "../../src/features/analyze-deck-composition/index.js";
import { BuildStrategicDiagnosisUseCase } from "../../src/features/build-strategic-diagnosis/index.js";
import { ClassifyCardFeaturesUseCase, RuleBasedFeatureClassifier } from "../../src/features/classify-card-features/index.js";
import { CuratedCommanderOptionRepository, DiscoverSimilarCommandersUseCase } from "../../src/features/discover-similar-commanders/index.js";
import { EvaluateCommanderFitUseCase } from "../../src/features/evaluate-commander-fit/index.js";
import { FetchCardDataUseCase } from "../../src/features/fetch-card-data/index.js";
import { parseMoxfieldDecklist } from "../../src/features/parse-moxfield-decklist/index.js";
import { RecommendChangesUseCase } from "../../src/features/recommend-changes/index.js";
import { FixtureTestCommunityDeckRepository } from "../helpers/fixtureCommunityDeckRepository.js";
import { LocalTestCardRepository } from "../helpers/localCardRepository.js";

const rawDecklist = "1 Sol Ring\n1 Fabled Passage\n1 Crucible of Worlds\n1 Hedron Archive\n\n1 Korvold, Fae-Cursed King";
const gamePlan = {
  commander: "Korvold, Fae-Cursed King",
  primaryObjective: "Generate repeated landfall and sacrifice triggers.",
  winCondition: "Combat damage through large creatures.",
  targetWinTurn: 6,
  bracket: 3,
  desiredFeatures: [
    { feature: "Land Recursion" as const, role: "primary" as const },
    { feature: "Land Sacrifice" as const, role: "primary" as const },
    { feature: "Combat Finisher" as const, role: "primary" as const }
  ],
  constraints: [],
  rawDescription: "landfall recursion combat"
};

describe("pipeline capabilities", () => {
  it("analyzes composition, commander fit, discovery, baselines, diagnosis, and recommendations", async () => {
    const parsed = parseMoxfieldDecklist({ rawDecklist });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const fetched = await new FetchCardDataUseCase(new LocalTestCardRepository()).execute({
      cardNames: [...parsed.value.deck.mainboard, ...parsed.value.deck.commanders].map((card) => card.name)
    });
    expect(fetched.ok).toBe(true);
    if (!fetched.ok) return;
    const classified = await new ClassifyCardFeaturesUseCase(new RuleBasedFeatureClassifier()).execute({ cards: fetched.value.cards });
    const composition = await new AnalyzeDeckCompositionUseCase().execute({
      deck: parsed.value.deck,
      cards: fetched.value.cards,
      cardFeatures: classified.cardFeatures
    });
    expect(composition.composition.landCount).toBe(1);
    expect(composition.composition.featureDensity["Land Recursion"]).toBe(1);
    const commander = fetched.value.cards.find((card) => card.name === "Korvold, Fae-Cursed King")!;
    const commanderFeatures = classified.cardFeatures.find((entry) => entry.cardName === commander.name)!.features;
    const fit = await new EvaluateCommanderFitUseCase().execute({ commander, commanderFeatures, gamePlan, composition: composition.composition });
    expect(fit.commanderFit.unsupportedFeatures.map((feature) => feature.feature)).toContain("Land Recursion");
    const discovery = await new DiscoverSimilarCommandersUseCase(new CuratedCommanderOptionRepository()).execute({
      gamePlan,
      commanderPreference: "prefer_current",
      currentCommander: commander,
      commanderFit: fit.commanderFit
    });
    expect(discovery.strategicExpressions.length).toBeGreaterThan(0);
    const community = await new AnalyzeCommunityBaselinesUseCase(new FixtureTestCommunityDeckRepository()).execute({
      gamePlan,
      deckComposition: composition.composition,
      strategicExpressions: discovery.strategicExpressions
    });
    expect(community.baselineReport.analyzedDecks).toBeGreaterThan(0);
    const diagnosis = await new BuildStrategicDiagnosisUseCase().execute({
      gamePlan,
      composition: composition.composition,
      commanderFit: fit.commanderFit,
      strategicExpressions: discovery.strategicExpressions,
      communityBaselineReport: community.baselineReport
    });
    expect(diagnosis.diagnosis.featureGaps.length).toBeGreaterThan(0);
    const recommendations = await new RecommendChangesUseCase().execute({
      gamePlan,
      diagnosis: diagnosis.diagnosis,
      composition: composition.composition,
      commanderPreference: "prefer_current",
      communityBaselineReport: community.baselineReport
    });
    expect(recommendations.recommendations.some((rec) => rec.cardRecommendations.length > 0)).toBe(true);
  });
});
