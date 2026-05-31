# Feature: Classify Card Features

## Purpose

Assign atomic strategic features to enriched Magic: The Gathering cards.

This feature transforms card text and metadata into domain-level capabilities such as:

* Landfall Trigger
* Land Sacrifice
* Land Recursion
* Sacrifice Outlet
* Sacrifice Payoff
* Card Advantage Engine
* Mana Acceleration
* Combat Finisher

This is one of the core features of the system.

The assistant should reason from features, not only from card names or commander popularity.

---

# User Story

As the assistant, I need to understand what each card contributes strategically so that I can later evaluate whether the deck supports the player's game plan.

---

# Input

```ts
{
  cards: EnrichedCard[];
}
```

Example:

```ts
{
  cards: [
    {
      name: "Fabled Passage",
      manaValue: 0,
      colors: [],
      colorIdentity: [],
      typeLine: "Land",
      oracleText: "{T}, Sacrifice Fabled Passage: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
      legalities: { commander: "legal" },
      keywords: []
    }
  ]
}
```

---

# Output

```ts
{
  cardFeatures: CardFeature[];
  warnings: Array<{
    cardName: string;
    reason: string;
  }>;
}
```

Example:

```ts
{
  cardFeatures: [
    {
      cardName: "Fabled Passage",
      features: [
        {
          name: "Landfall Trigger",
          role: "enabler",
          magnitude: {
            value: 1,
            unit: "land"
          },
          evidence: "Can put a basic land onto the battlefield."
        },
        {
          name: "Land Sacrifice",
          role: "enabler",
          magnitude: {
            value: 1,
            unit: "permanent"
          },
          evidence: "Oracle text contains 'Sacrifice Fabled Passage'."
        }
      ]
    }
  ],
  warnings: []
}
```

---

# Domain Model

`FeatureName` is defined in the shared domain model.

This document describes the V1 vocabulary currently supported by the classifier.

Current V1 vocabulary includes:

```ts
export type FeatureName =
  | "Landfall Trigger"
  | "Land Sacrifice"
  | "Land Recursion"
  | "Extra Land Drop"
  | "Sacrifice Outlet"
  | "Sacrifice Payoff"
  | "Graveyard Enabler"
  | "Permanent Recursion"
  | "Token Producer"
  | "Token Payoff"
  | "+1/+1 Counter Payoff"
  | "Combat Finisher"
  | "Card Advantage Engine"
  | "Mana Acceleration"
  | "Removal"
  | "Board Wipe"
  | "Protection"
  | "Tutor"
  | "Aristocrats Payoff"
  | "ETB Trigger"
  | "ETB Payoff"
  | "Reanimation"
  | "Discard Outlet"
  | "Treasure Production"
  | "Treasure Payoff"
  | "Go Wide"
  | "Go Tall";
```

```ts
export type FeatureContributionRole =
  | "enabler"
  | "payoff"
  | "engine"
  | "finisher"
  | "support";
```

```ts
export type FeatureMagnitude = {
  value: number;
  unit:
    | "trigger"
    | "card"
    | "mana"
    | "permanent"
    | "land"
    | "counter"
    | "creature"
    | "token";

  condition?: string;
};
```

```ts
export type FeatureAssignment = {
  name: FeatureName;
  role: FeatureContributionRole;
  magnitude?: FeatureMagnitude;
  evidence: string;
};
```

```ts
export type CardFeature = {
  cardName: string;
  features: FeatureAssignment[];
};
```

---

# Contribution Model

This feature does not assign confidence scores.

The classifier should not answer:

> How confident are we that this feature exists?

Instead, it should answer:

> What does this card contribute to this feature?

The system should describe contribution using:

* `role`
* `magnitude`
* `condition`
* `evidence`

This makes downstream analysis more useful and avoids vague confidence labels such as `high`, `medium`, or `low`.

---

# Contribution Roles

## enabler

A card enables a feature or creates the conditions for it.

Examples:

* Fabled Passage enables Landfall Trigger.
* Harrow enables Landfall Trigger and Land Sacrifice.
* Viscera Seer enables Sacrifice Outlet.

---

## payoff

A card rewards a feature happening.

Examples:

* Korvold rewards sacrificing permanents.
* Mayhem Devil rewards permanents being sacrificed.
* Rampaging Baloths rewards lands entering the battlefield.

---

## engine

A card can repeatedly generate value for a feature over time.

Examples:

* Crucible of Worlds is a Land Recursion engine.
* Skullclamp is a Card Advantage Engine.
* Korvold can become a Sacrifice Payoff engine.

---

## finisher

A card helps convert a plan into a win condition.

Examples:

* Craterhoof Behemoth is a Combat Finisher.
* Shared Animosity is a Combat Finisher.
* Tifa Lockhart may be a Combat Finisher in landfall combat strategies.

---

## support

A card supports a strategy but is not the main enabler, payoff, engine, or finisher.

Examples:

* Lightning Greaves supports protecting key creatures.
* Tutors may support consistency.
* Removal supports interaction.

---

# Magnitude

Magnitude describes how much a card contributes when that contribution can be expressed in a simple, useful way.

Magnitude is optional.

It should be used only when the contribution is reasonably clear.

Examples:

## Harrow

```ts
{
  name: "Landfall Trigger",
  role: "enabler",
  magnitude: {
    value: 2,
    unit: "land"
  },
  evidence: "Sacrifices a land and puts two basic lands onto the battlefield."
}
```

```ts
{
  name: "Land Sacrifice",
  role: "enabler",
  magnitude: {
    value: 1,
    unit: "permanent"
  },
  evidence: "Sacrifices a land as an additional cost."
}
```

## Entish Restoration

```ts
{
  name: "Landfall Trigger",
  role: "enabler",
  magnitude: {
    value: 2,
    unit: "land"
  },
  evidence: "Searches for two basic lands and puts them onto the battlefield."
}
```

```ts
{
  name: "Landfall Trigger",
  role: "enabler",
  magnitude: {
    value: 3,
    unit: "land",
    condition: "If you control a creature with power 4 or greater."
  },
  evidence: "May search for three basic lands instead if the condition is met."
}
```

---

# Conditions

Some contributions depend on a condition.

Conditions should be explicit.

Examples:

* "If you control a creature with power 4 or greater."
* "If this creature attacks."
* "If a creature died this turn."
* "Only once each turn."

Conditional contributions are not weaker by default.

They are simply conditional.

Downstream analysis may decide how important the condition is for the player's game plan.

---

# Classification Strategy

V1 should support two classifiers.

## RuleBasedFeatureClassifier

A deterministic classifier based on:

* Card type line.
* Oracle text.
* Keywords.
* Simple patterns.
* Known phrase mappings.

This classifier is required for V1.

It makes the feature testable without relying on an LLM.

## LlmFeatureClassifier

An optional classifier that uses an LLM to classify ambiguous cards.

This classifier may be added in V1, but the rule-based classifier should exist first.

The LLM must return structured output validated by schema.

---

# Responsibility Boundary

This feature classifies cards individually.

It does not evaluate:

* feature relationships;
* feature synergy;
* feature density;
* strategic alignment;
* commander fit;
* recommendations.

Strategic Angles are not produced by this feature.

They are derived later from feature combinations and feature relationships.

---

# Important Design Rule

The feature classifier must be explainable.

Every feature assignment must include evidence.

Bad output:

```ts
{
  name: "Land Sacrifice",
  role: "enabler"
}
```

Good output:

```ts
{
  name: "Land Sacrifice",
  role: "enabler",
  magnitude: {
    value: 1,
    unit: "permanent"
  },
  evidence: "Oracle text contains 'Sacrifice Fabled Passage'."
}
```

---

# Rule-Based Classification Examples

## Landfall Trigger

Assign when:

* Card is a land.
* Card can put one or more lands onto the battlefield.
* Oracle text mentions "land enters the battlefield" or "landfall".

Examples:

* Fabled Passage
* Evolving Wilds
* Harrow
* Scapeshift
* Rampaging Baloths

Role guidance:

* Cards that cause lands to enter should usually be `enabler`.
* Cards that reward lands entering should usually be `payoff`.

---

## Land Sacrifice

Assign when:

* Oracle text contains "sacrifice" and refers to a land.
* The card itself sacrifices as part of its cost and is a land.
* The card sacrifices lands as an effect or cost.

Examples:

* Fabled Passage
* Evolving Wilds
* Harrow
* Zuran Orb

Role guidance:

* Cards that sacrifice lands are usually `enabler`.
* Cards that reward sacrificing lands or permanents are usually `payoff`.

---

## Land Recursion

Assign when:

* Oracle text allows lands to be played from the graveyard.
* Oracle text returns land cards from graveyard to hand or battlefield.

Examples:

* Crucible of Worlds
* Ramunap Excavator
* Splendid Reclamation
* Life from the Loam

Role guidance:

* Repeatable recursion should usually be `engine`.
* One-shot recursion should usually be `support`.

---

## Extra Land Drop

Assign when:

* Oracle text allows the player to play additional lands.

Examples:

* Exploration
* Azusa, Lost but Seeking
* Dryad of the Ilysian Grove

Role guidance:

* Repeated additional land drops are usually `engine`.
* One-shot additional land effects are usually `support`.

---

## Sacrifice Outlet

Assign when:

* The card allows sacrificing a permanent or creature as a cost or activated ability.

Examples:

* Goblin Bombardment
* Ashnod's Altar
* Viscera Seer
* Zuran Orb

Role guidance:

* Repeatable sacrifice outlets are usually `engine`.
* One-shot sacrifice effects are usually `enabler`.

---

## Sacrifice Payoff

Assign when:

* The card rewards sacrificing permanents.
* Oracle text contains patterns like "Whenever you sacrifice".

Examples:

* Korvold, Fae-Cursed King
* Mayhem Devil
* Super Shredder

Role guidance:

* Repeated rewards are usually `engine` or `payoff`.
* One-shot rewards are usually `payoff`.

---

## +1/+1 Counter Payoff

Assign when:

* The card grows creatures through +1/+1 counters.
* The card rewards counters.
* Oracle text references putting +1/+1 counters.

Examples:

* Korvold, Fae-Cursed King
* Super Shredder
* Mossborn Hydra

Role guidance:

* Cards that repeatedly grow from the plan are usually `payoff`.
* Cards that convert growth into lethal damage may also be `finisher`.

---

## Combat Finisher

Assign when:

* The card helps end the game through combat damage.
* The card grants power boosts, evasion, trample, extra combat, or large scaling bodies.

Examples:

* Craterhoof Behemoth
* Overwhelming Stampede
* Tifa Lockhart
* Shared Animosity

Role guidance:

* Cards whose main purpose is ending the game through combat are usually `finisher`.

---

## Card Advantage Engine

Assign when:

* The card repeatedly draws cards.
* The card generates recurring access to cards.
* Oracle text includes repeated draw triggers.

Examples:

* Korvold, Fae-Cursed King
* Skullclamp
* Beast Whisperer

Role guidance:

* Repeatable draw should usually be `engine`.
* One-shot draw should usually be `support`.

---

## Mana Acceleration

Assign when:

* The card produces mana beyond normal land-per-turn development.
* The card searches lands onto the battlefield.
* The card is a mana rock, dork, or ritual.

Examples:

* Sol Ring
* Arcane Signet
* Nature's Lore
* Harrow
* Dockside Extortionist

Role guidance:

* Repeatable mana production is usually `engine`.
* One-shot ramp is usually `support` or `enabler`.

---

## Removal

Assign when:

* The card destroys, exiles, bounces, fights, deals damage to, or otherwise answers opposing threats.

Examples:

* Abrade
* Chaos Warp
* Assassin's Trophy
* Beast Within

Role guidance:

* Removal is usually `support`.

---

## Protection

Assign when:

* The card protects key permanents or the player.
* The card grants hexproof, indestructible, phase out, protection, regeneration, or similar effects.

Examples:

* Heroic Intervention
* Lightning Greaves
* Swiftfoot Boots
* Tamiyo's Safekeeping

Role guidance:

* Protection is usually `support`.

---

# Input Rules

* `cards` is required.
* Empty card arrays should return validation error.
* Cards without oracle text are valid if their type line is useful.
* Basic lands should be classifiable based on type line alone.

---

# Output Rules

* Return one `CardFeature` per input card.
* A card may have zero, one, or many features.
* Feature assignments must not be duplicated.
* Evidence must be human-readable.
* Role must describe how the card contributes to the feature.
* Magnitude should be included when the contribution is clear and useful.
* Conditions should be explicit when contribution depends on a condition.

---

# Suggested TypeScript API

```ts
export type ClassifyCardFeaturesInput = {
  cards: EnrichedCard[];
};

export type ClassifyCardFeaturesOutput = {
  cardFeatures: CardFeature[];
  warnings: Array<{
    cardName: string;
    reason: string;
  }>;
};

export interface FeatureClassifier {
  classify(cards: EnrichedCard[]): Promise<ClassifyCardFeaturesOutput>;
}

export class ClassifyCardFeaturesUseCase {
  constructor(private readonly classifier: FeatureClassifier) {}

  async execute(
    input: ClassifyCardFeaturesInput
  ): Promise<ClassifyCardFeaturesOutput> {
    // validate input
    // call classifier
    // validate feature assignments
    // remove duplicates
    // return result
  }
}
```

---

# Suggested Folder Structure

```text
/src/features/classify-card-features
  /domain
    featureClassifier.ts
    featureVocabulary.ts

  /application
    classifyCardFeatures.usecase.ts

  /infrastructure
    ruleBasedFeatureClassifier.ts
    llmFeatureClassifier.ts

  /presentation
    classifyCardFeatures.schema.ts

  index.ts
```

---

# Acceptance Criteria

* Assigns strategic features to enriched cards.
* Supports multiple features per card.
* Supports zero features per card.
* Describes the card's contribution role for every feature.
* Supports magnitude when contribution is measurable.
* Supports conditional contributions.
* Provides evidence for every feature.
* Uses normalized feature names.
* Avoids duplicate feature assignments.
* Supports deterministic rule-based classification.
* Allows future LLM-based classification.
* Does not recommend cards.
* Does not evaluate the deck as a whole.
* Does not depend on EDHREC or popularity data.

---

# Suggested Tests

## Test: classifies Fabled Passage

Input:

```ts
{
  cards: [
    {
      name: "Fabled Passage",
      manaValue: 0,
      colors: [],
      colorIdentity: [],
      typeLine: "Land",
      oracleText: "{T}, Sacrifice Fabled Passage: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
      legalities: { commander: "legal" },
      keywords: []
    }
  ]
}
```

Expected:

```ts
{
  cardFeatures: [
    {
      cardName: "Fabled Passage",
      features: expect.arrayContaining([
        expect.objectContaining({
          name: "Land Sacrifice",
          role: "enabler"
        }),
        expect.objectContaining({
          name: "Landfall Trigger",
          role: "enabler"
        })
      ])
    }
  ]
}
```

---

## Test: classifies Harrow magnitude

Expected features:

```ts
[
  {
    name: "Land Sacrifice",
    role: "enabler",
    magnitude: {
      value: 1,
      unit: "permanent"
    }
  },
  {
    name: "Landfall Trigger",
    role: "enabler",
    magnitude: {
      value: 2,
      unit: "land"
    }
  },
  {
    name: "Mana Acceleration",
    role: "support"
  }
]
```

---

## Test: classifies Entish Restoration conditional magnitude

Expected feature:

```ts
{
  name: "Landfall Trigger",
  role: "enabler",
  magnitude: {
    value: 3,
    unit: "land",
    condition: "If you control a creature with power 4 or greater."
  }
}
```

---

## Test: classifies Korvold

Input:

```ts
{
  cards: [
    {
      name: "Korvold, Fae-Cursed King",
      manaValue: 5,
      colors: ["B", "R", "G"],
      colorIdentity: ["B", "R", "G"],
      typeLine: "Legendary Creature — Dragon Noble",
      oracleText: "Flying\nWhenever Korvold, Fae-Cursed King enters the battlefield or attacks, sacrifice another permanent.\nWhenever you sacrifice a permanent, put a +1/+1 counter on Korvold and draw a card.",
      legalities: { commander: "legal" },
      keywords: ["Flying"]
    }
  ]
}
```

Expected features:

```ts
[
  {
    name: "Sacrifice Outlet",
    role: "enabler"
  },
  {
    name: "Sacrifice Payoff",
    role: "payoff"
  },
  {
    name: "+1/+1 Counter Payoff",
    role: "payoff"
  },
  {
    name: "Card Advantage Engine",
    role: "engine"
  },
  {
    name: "Combat Finisher",
    role: "finisher"
  }
]
```

---

## Test: classifies Sol Ring

Expected features:

```ts
[
  {
    name: "Mana Acceleration",
    role: "engine"
  }
]
```

---

## Test: classifies Abrade

Expected features:

```ts
[
  {
    name: "Removal",
    role: "support"
  }
]
```

---

## Test: allows zero-feature cards

Some cards may not match V1 rules.

Expected:

```ts
{
  cardName: "Unknown Card",
  features: []
}
```

---

# Non-Goals

This feature must not:

* Parse decklists.
* Fetch card data.
* Analyze total deck composition.
* Compare against player intent.
* Evaluate commander fit.
* Recommend changes.
* Evaluate feature synergy.
* Claim perfect semantic understanding.
