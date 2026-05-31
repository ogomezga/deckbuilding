import type { EnrichedCard } from "../../../shared/domain/card.js";
import type { FeatureAssignment } from "../../../shared/domain/featureAssignment.js";
import type { ClassifyCardFeaturesOutput, FeatureClassifier } from "../domain/featureClassifier.js";

export class RuleBasedFeatureClassifier implements FeatureClassifier {
  async classify(cards: EnrichedCard[]): Promise<ClassifyCardFeaturesOutput> {
    return {
      cardFeatures: cards.map((card) => ({ cardName: card.name, features: classifyOne(card) })),
      warnings: []
    };
  }
}

function classifyOne(card: EnrichedCard): FeatureAssignment[] {
  const text = `${card.typeLine}\n${card.oracleText}\n${card.keywords.join(" ")}`;
  const lower = text.toLocaleLowerCase();
  const features: FeatureAssignment[] = [];
  const add = (assignment: FeatureAssignment) => features.push(assignment);
  const isLand = /(^|\s|-)land(\s|$|—|-)/i.test(card.typeLine);

  if (isLand || /put (it|them|[^.]*land[^.]*) onto the battlefield|landfall|land enters the battlefield/i.test(text)) {
    add({ name: "Landfall Trigger", role: /landfall|whenever a land enters/i.test(text) ? "payoff" : "enabler", magnitude: { value: /two basic land|up to two/i.test(text) ? 2 : /three basic land|up to three/i.test(text) ? 3 : 1, unit: "land", condition: /power 4 or greater/i.test(text) ? "If you control a creature with power 4 or greater." : undefined }, evidence: isLand ? "Card is a land or can cause land entries." : "Can put one or more lands onto the battlefield." });
  }
  if (/sacrifice.*land|sacrifice [^.:]*passage|sacrifice [^.:]*expanse/i.test(text) || (isLand && /sacrifice/i.test(text))) {
    add({ name: "Land Sacrifice", role: "enabler", magnitude: { value: 1, unit: "permanent" }, evidence: "Oracle text sacrifices a land or the land itself." });
  }
  if (/play lands? from your graveyard|return .*land cards? from your graveyard/i.test(text)) {
    add({ name: "Land Recursion", role: /you may play lands? from your graveyard/i.test(text) ? "engine" : "support", magnitude: /up to three target land/i.test(text) ? { value: 3, unit: "land" } : undefined, evidence: "Oracle text returns or allows playing lands from the graveyard." });
  }
  if (/additional land/i.test(text)) {
    add({ name: "Extra Land Drop", role: "engine", evidence: "Allows additional land plays." });
  }
  if (/sacrifice (a|another|[^:]+):|as an additional cost.*sacrifice|sacrifice another permanent|sacrifice a creature/i.test(text)) {
    add({ name: "Sacrifice Outlet", role: /:/.test(card.oracleText) ? "engine" : "enabler", evidence: "Allows sacrificing permanents or creatures." });
  }
  if (/whenever (you|a player) sacrifice/i.test(lower)) {
    add({ name: "Sacrifice Payoff", role: "payoff", evidence: "Rewards sacrificing permanents." });
  }
  if (/\+1\/\+1 counter|gets \+x\/\+x|put .*counter/i.test(text)) {
    add({ name: "+1/+1 Counter Payoff", role: "payoff", magnitude: /\+1\/\+1 counter/i.test(text) ? { value: 1, unit: "counter" } : undefined, evidence: "References +1/+1 counters or scalable power." });
  }
  if (/draw (a|two|three) cards?|whenever.*draw|dredge|return up to three/i.test(text)) {
    add({ name: "Card Advantage Engine", role: /whenever|you may|dredge/i.test(text) ? "engine" : "support", evidence: "Provides recurring or meaningful card access." });
  }
  if (/\{t\}: add|add \{c\}\{c\}|add one mana|search your library for .*land.*battlefield|treasure/i.test(lower)) {
    add({ name: "Mana Acceleration", role: /\{t\}: add/i.test(lower) ? "engine" : "support", evidence: "Produces mana or ramps lands onto the battlefield." });
  }
  if (/destroy target|exile target|deals .* damage to any target|shuffles it into their library/i.test(lower)) {
    add({ name: "Removal", role: "support", evidence: "Answers opposing permanents or threats." });
  }
  if (/hexproof|indestructible|protection|phase out/i.test(lower)) {
    add({ name: "Protection", role: "support", evidence: "Protects permanents or creatures." });
  }
  if (/create .* token|create a .* creature token/i.test(lower)) {
    add({ name: "Token Producer", role: "enabler", evidence: "Creates creature tokens." });
    add({ name: "Go Wide", role: "enabler", evidence: "Creates or supports multiple bodies." });
  }
  if (/trample|extra combat|creatures you control get|gain trample|combat damage|flying/i.test(lower) && /creature|sorcery|enchantment/i.test(card.typeLine)) {
    add({ name: "Combat Finisher", role: /creatures you control|trample|\+x\/\+x/i.test(lower) ? "finisher" : "support", evidence: "Helps convert board presence into combat damage." });
  }
  if (/graveyard|dredge|discard/i.test(lower)) {
    add({ name: "Graveyard Enabler", role: "enabler", evidence: "Uses or loads the graveyard as a resource." });
  }

  return features;
}
