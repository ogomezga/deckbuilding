# Feature: Analyze Deck Composition

## Purpose

Generate a structural representation of a Commander deck.

This feature describes what the deck currently is.

It does not evaluate whether the deck is good.

It does not compare the deck against the player's intent.

It simply produces a factual summary of the deck.

---

# User Story

As the assistant, I need to understand the composition of the deck so that later features can evaluate strategic alignment, commander fit, community baselines, and recommendations.

---

# Core Question

This feature answers:

> What does the deck currently contain?

It does not answer:

> What should the deck contain?

---

# Input

```ts
{
  deck: ParsedDeck;
  cards: EnrichedCard[];
  cardFeatures: CardFeature[];
}
```

---

# Output

```ts
{
  composition: DeckComposition;
  warnings: Warning[];
}
```

---

# Domain Model

```ts
export type DeckComposition = {
  totalCards: number;

  landCount: number;

  nonLandCount: number;

  manaCurve: ManaCurve;

  averageManaValue: number;

  colorDistribution: ColorDistribution;

  cardTypeDistribution: CardTypeDistribution;

  featureDensity: FeatureDensity;

  featureContributionSummary: FeatureContributionSummary;

  detectedFeatures: FeatureName[];

  commanderProfile: CommanderProfile;

  facts: DeckFact[];
};
```

---

# Mana Curve

## Definition

Distribution of mana values across the deck.

Example:

```ts
{
  0: 3,
  1: 12,
  2: 19,
  3: 24,
  4: 14,
  5: 8,
  6: 5,
  7: 2
}
```

---

# Mana Curve Rules

* Lands should not contribute to mana curve.
* Commander cards should not contribute to mana curve.
* MDFCs should use their front-face mana value.
* X spells should use printed mana value.

---

# Average Mana Value

The composition should calculate:

```ts
averageManaValue: number;
```

Example:

```ts
2.84
```

Rules:

* Lands should not contribute to average mana value.
* Commander cards should not contribute to average mana value.
* Only nonland mainboard cards should contribute.

---

# Land Count

The composition should calculate:

```ts
landCount: number;
nonLandCount: number;
```

Rules:

* Cards with `Land` in their type line count as lands.
* Commander cards should not be included in `landCount` or `nonLandCount`.
* Quantities must be respected.

---

# Color Distribution

## Definition

How much each color contributes to the deck.

Example:

```ts
{
  W: 0,
  U: 0,
  B: 32,
  R: 41,
  G: 27,
  C: 10
}
```

---

# Color Distribution Rules

Use color identity.

Hybrid cards contribute to all represented colors.

Colorless cards contribute to:

```ts
C
```

Commander cards should contribute to color identity calculations when producing commander-level context.

Mainboard color distribution should be calculated separately from commander color identity when useful.

---

# Card Type Distribution

## Definition

Distribution of card types.

Example:

```ts
{
  land: 36,
  creature: 28,
  artifact: 9,
  enchantment: 7,
  instant: 8,
  sorcery: 10,
  planeswalker: 1
}
```

---

# Card Type Rules

A card may contribute to multiple types.

Example:

```text
Artifact Creature
```

contributes to:

```text
artifact
creature
```

Commander cards should not be included in mainboard card type distribution.

Quantities must be respected.

---

# Feature Density

## Definition

Number of cards supporting a feature.

Example:

```ts
{
  "Landfall Trigger": 14,
  "Land Recursion": 5,
  "Land Sacrifice": 9,
  "Combat Finisher": 3,
  "Card Advantage Engine": 7
}
```

---

# Important Rule

Feature Density counts cards.

Not triggers.

Not power.

Not impact.

Only supporting cards.

Example:

Two cards may both support `Landfall Trigger`, even if one produces one landfall trigger and another produces three.

That difference is represented by `featureContributionSummary`, not by `featureDensity`.

---

# Feature Contribution Summary

## Definition

Aggregated factual contribution data derived from `FeatureAssignment`.

This summary captures measurable contribution details when available.

Example:

```ts
{
  "Landfall Trigger": {
    supportingCards: 5,
    totalMagnitude: 11,
    units: ["land"],
    conditionalContributions: 2
  },

  "Land Sacrifice": {
    supportingCards: 4,
    totalMagnitude: 4,
    units: ["permanent"],
    conditionalContributions: 0
  }
}
```

---

# Feature Contribution Summary Rules

* Count supporting cards per feature.
* Sum magnitudes only when units match and values are present.
* Track conditional contributions separately.
* Do not infer power level from magnitude.
* Do not evaluate whether the magnitude is sufficient.
* Do not compare against the game plan.

This feature produces factual aggregation only.

Interpretation belongs to later capabilities.

---

# Detected Features

## Definition

Unique features currently present in the deck.

Example:

```ts
[
  "Landfall Trigger",
  "Land Recursion",
  "Land Sacrifice",
  "Combat Finisher",
  "Card Advantage Engine"
]
```

This replaces the previous term `Feature Coverage`.

Reason:

`Feature Coverage` implies comparison against a desired game plan.

That comparison belongs to Strategic Alignment, not Deck Composition.

---

# Commander Profile

## Definition

Feature summary of the commander.

Example:

```ts
{
  commander: "Korvold, Fae-Cursed King",

  features: [
    {
      name: "Sacrifice Payoff",
      role: "payoff",
      evidence: "Rewards sacrificing permanents."
    },
    {
      name: "+1/+1 Counter Payoff",
      role: "payoff",
      evidence: "Gets a +1/+1 counter whenever a permanent is sacrificed."
    },
    {
      name: "Card Advantage Engine",
      role: "engine",
      evidence: "Draws a card whenever a permanent is sacrificed."
    }
  ]
}
```

---

# Commander Profile Rules

Commander profile should reuse existing `FeatureAssignment` data.

It should not reduce commander features to plain feature names.

This preserves:

* role;
* magnitude;
* condition;
* evidence.

Commander profile is factual.

Commander Fit evaluates whether those features support the game plan.

---

# Facts

This feature should produce structured facts instead of natural-language observations.

Bad:

```ts
observations: [
  "The deck contains 9 cards classified as Land Sacrifice."
]
```

Good:

```ts
facts: [
  {
    type: "feature_density",
    feature: "Land Sacrifice",
    value: 9
  }
]
```

---

# DeckFact Model

```ts
export type DeckFact =
  | {
      type: "feature_density";
      feature: FeatureName;
      value: number;
    }
  | {
      type: "mana_curve_peak";
      manaValue: number;
      count: number;
    }
  | {
      type: "land_count";
      value: number;
    }
  | {
      type: "average_mana_value";
      value: number;
    }
  | {
      type: "card_type_count";
      cardType: string;
      value: number;
    };
```

---

# Important Constraint

Facts must be descriptive.

Bad:

```text
The deck should play more recursion.
```

Good:

```ts
{
  type: "feature_density",
  feature: "Land Recursion",
  value: 3
}
```

Recommendations belong to later features.

Natural-language explanation belongs to the agent or response synthesis layer.

---

# Metrics Included

The composition should include:

```ts
export type DeckCompositionMetrics = {
  averageManaValue: number;

  landCount: number;

  nonLandCount: number;

  uniqueFeatureCount: number;

  mostCommonFeatures: FeatureDensityEntry[];

  leastCommonFeatures: FeatureDensityEntry[];
};
```

These metrics may either be embedded directly in `DeckComposition` or derived from it.

---

# Suggested TypeScript API

```ts
export type AnalyzeDeckCompositionInput = {
  deck: ParsedDeck;
  cards: EnrichedCard[];
  cardFeatures: CardFeature[];
};

export type AnalyzeDeckCompositionOutput = {
  composition: DeckComposition;
  warnings: Warning[];
};
```

```ts
export class AnalyzeDeckCompositionUseCase {
  async execute(
    input: AnalyzeDeckCompositionInput
  ): Promise<AnalyzeDeckCompositionOutput>;
}
```

---

# Suggested Folder Structure

```text
/src/features/analyze-deck-composition

  /domain
    deckComposition.ts
    manaCurve.ts
    featureDensity.ts
    featureContributionSummary.ts
    deckFact.ts

  /application
    analyzeDeckComposition.usecase.ts

  /presentation
    analyzeDeckComposition.schema.ts

  index.ts
```

---

# Acceptance Criteria

The feature must:

* Calculate total cards.
* Calculate land count.
* Calculate nonland count.
* Calculate mana curve.
* Calculate average mana value.
* Calculate color distribution.
* Calculate card type distribution.
* Calculate feature density.
* Calculate feature contribution summary.
* Calculate detected features.
* Build commander profile using `FeatureAssignment`.
* Generate structured factual `DeckFact` entries.
* Support multi-type cards.
* Support multi-feature cards.
* Respect card quantities.

The feature must not:

* Recommend cards.
* Evaluate alignment.
* Evaluate commander fit.
* Compare against player intent.
* Compare against external decklists.
* Generate natural-language advice.
* Use an LLM.

---

# Suggested Tests

## Test: calculates mana curve

Input:

```ts
[
  Sol Ring (1),
  Arcane Signet (2),
  Korvold (5)
]
```

Expected:

```ts
{
  manaCurve: {
    1: 1,
    2: 1
  }
}
```

Korvold is excluded because commander cards should not contribute to mainboard mana curve.

---

## Test: excludes lands from mana curve

Input:

```ts
[
  Mountain,
  Forest,
  Sol Ring
]
```

Expected:

```ts
{
  manaCurve: {
    1: 1
  }
}
```

---

## Test: calculates land count

Input:

```ts
[
  29 Mountain,
  1 Sol Ring,
  1 Arcane Signet
]
```

Expected:

```ts
{
  landCount: 29,
  nonLandCount: 2
}
```

---

## Test: calculates feature density

Input:

```ts
[
  Land Recursion,
  Land Recursion,
  Landfall Trigger
]
```

Expected:

```ts
{
  featureDensity: {
    "Land Recursion": 2,
    "Landfall Trigger": 1
  }
}
```

---

## Test: calculates feature contribution summary

Input feature assignments:

```ts
[
  {
    name: "Landfall Trigger",
    role: "enabler",
    magnitude: {
      value: 2,
      unit: "land"
    }
  },
  {
    name: "Landfall Trigger",
    role: "enabler",
    magnitude: {
      value: 3,
      unit: "land",
      condition: "If you control a creature with power 4 or greater."
    }
  }
]
```

Expected:

```ts
{
  featureContributionSummary: {
    "Landfall Trigger": {
      supportingCards: 2,
      totalMagnitude: 5,
      units: ["land"],
      conditionalContributions: 1
    }
  }
}
```

---

## Test: creates commander profile

Input:

```ts
Korvold
```

Expected:

```ts
{
  commanderProfile: {
    commander: "Korvold, Fae-Cursed King",
    features: [
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
      }
    ]
  }
}
```

---

## Test: generates factual deck facts

Expected:

```ts
{
  facts: [
    {
      type: "feature_density",
      feature: "Land Sacrifice",
      value: 9
    }
  ]
}
```

Not:

```text
The deck should add more sacrifice cards.
```

---

# Non-Goals

This feature must not:

* Judge deck quality.
* Determine power level.
* Determine strategic alignment.
* Determine commander fit.
* Recommend cards.
* Use EDHREC.
* Use public deck statistics.
* Use an LLM.

This feature produces facts.

Interpretation happens later.
