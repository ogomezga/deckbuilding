import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createTestOrchestrator } from "../helpers/testOrchestrator.js";

describe("Korvold landfall-sacrifice pipeline", () => {
  it("runs end to end and produces a card-level recommendation", async () => {
    const [rawDecklist, goalDescription] = await Promise.all([
      readFile("tests/fixtures/korvold-landfall.txt", "utf8"),
      readFile("tests/fixtures/korvold-goal.txt", "utf8")
    ]);
    const output = await createTestOrchestrator().execute({
      rawDecklist,
      goalDescription,
      commanderPreference: "prefer_current",
      targetWinTurn: 6,
      bracket: 3
    });
    expect(output.session.deck.mainboard.length).toBeGreaterThan(0);
    expect(output.session.cards.length).toBeGreaterThan(0);
    expect(output.session.cardFeatures.length).toBeGreaterThan(0);
    expect(output.session.composition.detectedFeatures).toContain("Landfall Trigger");
    expect(output.session.commanderFit.findings.length).toBeGreaterThan(0);
    expect(output.session.strategicExpressions.length).toBeGreaterThan(0);
    expect(output.session.communityBaselineReport.analyzedDecks).toBeGreaterThan(0);
    expect(output.session.diagnosis.featureGaps.length).toBeGreaterThan(0);
    expect(output.session.recommendations.some((recommendation) => recommendation.cardRecommendations.length > 0)).toBe(true);
  });
});
