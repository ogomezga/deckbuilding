import type { CommanderOptionRepository, CommanderOptionSource, FindCommanderOptionsInput } from "../domain/commanderOptionRepository.js";

const commander = (name: string, colorIdentity: CommanderOptionSource["commander"]["colorIdentity"]): CommanderOptionSource["commander"] => ({
  name,
  colorIdentity,
  colors: colorIdentity,
  manaValue: name === "Korvold, Fae-Cursed King" ? 5 : 4,
  typeLine: "Legendary Creature",
  oracleText: "",
  legalities: { commander: "legal" },
  keywords: []
});

export const curatedCommanderOptions: CommanderOptionSource[] = [
  {
    commander: commander("Korvold, Fae-Cursed King", ["B", "R", "G"]),
    strategicTags: ["Sacrifice Value", "Jund Value"],
    features: [
      { name: "Sacrifice Payoff", role: "payoff", evidence: "Rewards sacrificing permanents." },
      { name: "Card Advantage Engine", role: "engine", evidence: "Draws cards when permanents are sacrificed." },
      { name: "+1/+1 Counter Payoff", role: "payoff", evidence: "Grows from sacrifice triggers." }
    ]
  },
  {
    commander: commander("Lord Windgrace", ["B", "R", "G"]),
    strategicTags: ["Land Recursion Focus", "Graveyard Value"],
    features: [
      { name: "Land Recursion", role: "engine", evidence: "Returns land cards from graveyard to battlefield." },
      { name: "Graveyard Enabler", role: "enabler", evidence: "Discards cards as part of loyalty abilities." }
    ]
  },
  {
    commander: commander("The Gitrog Monster", ["B", "G"]),
    strategicTags: ["Land Recursion Focus", "Sacrifice Value"],
    features: [
      { name: "Land Sacrifice", role: "engine", evidence: "Encourages sacrificing lands." },
      { name: "Card Advantage Engine", role: "engine", evidence: "Draws cards when lands go to graveyard." },
      { name: "Land Recursion", role: "support", evidence: "Supports land-graveyard loops." }
    ]
  },
  {
    commander: commander("Tifa Lockhart", ["G"]),
    strategicTags: ["Combat Scaling"],
    features: [
      { name: "Landfall Trigger", role: "payoff", evidence: "Rewards lands entering the battlefield." },
      { name: "Combat Finisher", role: "finisher", evidence: "Converts landfall into combat damage." },
      { name: "Go Tall", role: "payoff", evidence: "Scales a single attacker." }
    ]
  }
];

export class CuratedCommanderOptionRepository implements CommanderOptionRepository {
  async findOptions(input: FindCommanderOptionsInput): Promise<CommanderOptionSource[]> {
    const desired = new Set(input.desiredFeatures.map((feature) => feature.feature));
    return curatedCommanderOptions.filter((option) => {
      if (!input.includeOffColor && input.currentColorIdentity) {
        const inColors = option.commander.colorIdentity.every((color) => input.currentColorIdentity?.includes(color));
        if (!inColors) return false;
      }
      return option.features.some((feature) => desired.has(feature.name));
    });
  }
}
