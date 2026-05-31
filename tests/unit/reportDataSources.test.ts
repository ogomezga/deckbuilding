import { describe, expect, it } from "vitest";
import { renderMarkdownReport } from "../../src/cli/report/writeMarkdownReport.js";
import type { OrchestrateAgentWorkflowOutput } from "../../src/features/orchestrate-agent-workflow/index.js";

describe("Markdown report data sources", () => {
  it("includes data source transparency and unavailable community evidence", () => {
    const output = minimalOutput();
    const markdown = renderMarkdownReport(output);
    expect(markdown).toContain("## Data Sources");
    expect(markdown).toContain("Card metadata: Scryfall");
    expect(markdown).toContain("Game plan extraction: Codex-created artifact");
    expect(markdown).toContain("Community baselines: EDHREC, MTGGoldfish, Archidekt (unavailable)");
    expect(markdown).toContain("deck-level feature baselines are unavailable");
    expect(markdown).toContain("EDHREC: unavailable");
    expect(markdown).toContain("## Synthesized Summary");
  });
});

function minimalOutput(): OrchestrateAgentWorkflowOutput {
  return {
    warnings: [{ reason: "Community baselines unavailable: no real community deck data adapter is configured." }],
    session: {
      deck: { mainboard: [], commanders: [{ name: "Korvold, Fae-Cursed King", quantity: 1 }] },
      cards: [],
      gamePlan: {
        commander: "Korvold, Fae-Cursed King",
        primaryObjective: "Generate landfall value.",
        winCondition: "Combat damage.",
        desiredFeatures: [],
        constraints: [],
        rawDescription: "Landfall combat."
      },
      cardFeatures: [],
      composition: {
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
      },
      commanderFit: {
        commander: "Korvold, Fae-Cursed King",
        supportingFeatures: [],
        unsupportedFeatures: [],
        indirectSupport: [],
        findings: []
      },
      strategicExpressions: [],
      communityBaselineReport: {
        analyzedDecks: 0,
        dataSources: [
          {
            source: "EDHREC",
            status: "unavailable",
            evidence: ["Requested EDHREC commander page."],
            warning: "Deck-level feature baselines are unavailable."
          }
        ],
        featureBaselines: [],
        observedSolutions: [],
        findings: []
      },
      diagnosis: {
        featureGaps: [],
        featureSurpluses: [],
        featureTensions: [],
        commanderTensions: [],
        communityDivergences: [],
        powerLevelConcerns: [],
        supportingEvidence: []
      },
      recommendations: [],
      responseSynthesis: "Codex-generated summary.",
      dataSources: {
        cardMetadata: { source: "Scryfall", status: "available" },
        gamePlanExtraction: { source: "Codex-created artifact", status: "available" },
        featureClassification: { source: "rule-based", status: "available" },
        communityBaselines: {
          source: "EDHREC, MTGGoldfish, Archidekt",
          status: "unavailable",
          warning:
            "Configured community sources are queried, but deck-level feature baselines are unavailable until source-specific deck parsing is implemented."
        },
        commanderOptions: { source: "curated dataset", status: "available" },
        responseSynthesis: { source: "Codex interactive session", status: "available" }
      }
    }
  };
}
