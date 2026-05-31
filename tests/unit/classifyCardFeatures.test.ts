import { describe, expect, it } from "vitest";
import { ClassifyCardFeaturesUseCase, RuleBasedFeatureClassifier } from "../../src/features/classify-card-features/index.js";

describe("ClassifyCardFeaturesUseCase", () => {
  const useCase = new ClassifyCardFeaturesUseCase(new RuleBasedFeatureClassifier());

  it("classifies Fabled Passage", async () => {
    const output = await useCase.execute({
      cards: [{ name: "Fabled Passage", manaValue: 0, colors: [], colorIdentity: [], typeLine: "Land", oracleText: "{T}, Sacrifice Fabled Passage: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.", legalities: { commander: "legal" }, keywords: [] }]
    });
    expect(output.cardFeatures[0]?.features.map((feature) => feature.name)).toEqual(expect.arrayContaining(["Land Sacrifice", "Landfall Trigger"]));
  });

  it("classifies Korvold", async () => {
    const output = await useCase.execute({
      cards: [{ name: "Korvold, Fae-Cursed King", manaValue: 5, colors: ["B", "R", "G"], colorIdentity: ["B", "R", "G"], typeLine: "Legendary Creature - Dragon Noble", oracleText: "Flying\nWhenever Korvold enters the battlefield or attacks, sacrifice another permanent.\nWhenever you sacrifice a permanent, put a +1/+1 counter on Korvold and draw a card.", legalities: { commander: "legal" }, keywords: ["Flying"] }]
    });
    expect(output.cardFeatures[0]?.features.map((feature) => feature.name)).toEqual(expect.arrayContaining(["Sacrifice Outlet", "Sacrifice Payoff", "+1/+1 Counter Payoff", "Card Advantage Engine"]));
  });
});
