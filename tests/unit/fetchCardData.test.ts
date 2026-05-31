import { describe, expect, it } from "vitest";
import { FetchCardDataUseCase, type CardRepository } from "../../src/features/fetch-card-data/index.js";

describe("FetchCardDataUseCase", () => {
  it("deduplicates and ignores empty names with warning", async () => {
    const calls: string[][] = [];
    const repository: CardRepository = {
      async findByNames(names) {
        calls.push(names);
        return {
          cards: [{ name: "Sol Ring", manaValue: 1, colors: [], colorIdentity: [], typeLine: "Artifact", oracleText: "{T}: Add {C}{C}.", legalities: { commander: "legal" }, keywords: [] }],
          notFound: [],
          warnings: []
        };
      }
    };
    const result = await new FetchCardDataUseCase(repository).execute({ cardNames: ["Sol Ring", "sol ring", ""] });
    expect(result.ok).toBe(true);
    expect(calls[0]).toEqual(["Sol Ring"]);
    if (result.ok) expect(result.value.warnings).toContainEqual({ cardName: "", reason: "Empty card name ignored" });
  });
});
