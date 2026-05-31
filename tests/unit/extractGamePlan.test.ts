import { describe, expect, it } from "vitest";
import { ExtractGamePlanUseCase, RuleBasedGamePlanExtractor } from "../../src/features/extract-game-plan/index.js";

describe("ExtractGamePlanUseCase", () => {
  const useCase = new ExtractGamePlanUseCase(new RuleBasedGamePlanExtractor());

  it("extracts landfall sacrifice game plan", async () => {
    const output = await useCase.execute({
      commander: "Korvold, Fae-Cursed King",
      description: "Use fetchlands and land recursion to trigger landfall repeatedly, grow creatures with +1/+1 counters and win through combat damage.",
      targetWinTurn: 6,
      bracket: 3
    });
    expect(output.gamePlan?.desiredFeatures.map((feature) => feature.feature)).toEqual(
      expect.arrayContaining(["Landfall Trigger", "Land Sacrifice", "Land Recursion", "+1/+1 Counter Payoff", "Combat Finisher"])
    );
    expect(output.gamePlan?.targetWinTurn).toBe(6);
    expect(output.gamePlan?.bracket).toBe(3);
  });

  it("asks clarification for vague descriptions", async () => {
    const output = await useCase.execute({ commander: "Korvold, Fae-Cursed King", description: "I want a fun deck." });
    expect(output.gamePlan).toBeNull();
    expect(output.clarificationQuestions.length).toBeGreaterThan(0);
  });
});
