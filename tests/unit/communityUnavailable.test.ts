import { describe, expect, it } from "vitest";
import {
  AnalyzeCommunityBaselinesUseCase,
  MultiSourceCommunityDeckRepository,
  type CommunityDeckSource
} from "../../src/features/analyze-community-baselines/index.js";

describe("unavailable community baselines", () => {
  it("reports unavailable community data instead of fabricated baselines", async () => {
    const unavailableSource: CommunityDeckSource = {
      sourceName: "EDHREC",
      async findSimilarDecks() {
        return {
          decks: [],
          warnings: [{ reason: "EDHREC queried but deck-level data unavailable." }],
          sources: [
            {
              source: "EDHREC",
              status: "unavailable",
              evidence: ["Requested EDHREC commander page."],
              warning: "Deck-level feature data unavailable."
            }
          ]
        };
      }
    };
    const output = await new AnalyzeCommunityBaselinesUseCase(
      new MultiSourceCommunityDeckRepository([unavailableSource])
    ).execute({
      gamePlan: {
        commander: "Korvold, Fae-Cursed King",
        primaryObjective: "Generate landfall value.",
        winCondition: "Combat damage.",
        desiredFeatures: [{ feature: "Land Recursion", role: "primary" }],
        constraints: [],
        rawDescription: "Land recursion."
      },
      deckComposition: {
        totalCards: 0,
        landCount: 0,
        nonLandCount: 0,
        manaCurve: {},
        averageManaValue: 0,
        colorDistribution: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
        cardTypeDistribution: {},
        featureDensity: {},
        featureContributionSummary: {},
        detectedFeatures: [],
        commanderProfile: { commander: "Korvold, Fae-Cursed King", features: [] },
        facts: [],
        cardFeatureMap: {}
      }
    });

    expect(output.baselineReport.analyzedDecks).toBe(0);
    expect(output.baselineReport.dataSources[0]?.source).toBe("EDHREC");
    expect(output.baselineReport.featureBaselines).toEqual([]);
    expect(output.baselineReport.observedSolutions).toEqual([]);
    expect(output.warnings.map((warning) => warning.reason).join(" ")).toMatch(/unavailable/i);
  });
});
