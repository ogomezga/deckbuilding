import { describe, expect, it } from "vitest";
import { parseMoxfieldDecklist } from "../../src/features/parse-moxfield-decklist/index.js";

describe("parseMoxfieldDecklist", () => {
  it("parses mainboard and commander", () => {
    const result = parseMoxfieldDecklist({
      rawDecklist: "1 Abrade\n1 Arcane Signet\n29 Mountain\n\n1 Krenko, Mob Boss"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.deck.mainboard).toContainEqual({ name: "Mountain", quantity: 29 });
      expect(result.value.deck.commanders).toEqual([{ name: "Krenko, Mob Boss", quantity: 1 }]);
    }
  });

  it("returns warnings for invalid lines", () => {
    const result = parseMoxfieldDecklist({
      rawDecklist: "1 Sol Ring\nThis is invalid\n\n1 Krenko, Mob Boss"
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.warnings).toContainEqual({ line: "This is invalid", reason: "Unrecognized decklist line" });
  });

  it("returns missing commander block for one block", () => {
    const result = parseMoxfieldDecklist({ rawDecklist: "1 Sol Ring\n1 Mountain" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.type).toBe("missing_commander_block");
  });
});
