# Feature: Discover Similar Commanders

## Purpose

Discover alternative strategic expressions of the player's declared game plan and identify commanders that may represent those expressions.

This feature is not a commander ranking engine.

This feature is not intended to declare that one commander is objectively better than another.

This feature does not recommend replacing the current commander.

The goal is to help the player explore different commander-based expressions of the same or similar strategic idea.

---

# Core Question

This feature answers:

> What other strategic expressions exist for this game plan, and which commanders represent them?

It does not answer:

> What is the best commander?

It does not answer:

> Which commander is objectively stronger?

It does not answer:

> Should the player change commanders?

Those questions belong to Strategic Diagnosis and Recommend Changes.

---

# User Story

As a player, I want to discover different ways to express the strategy I have in mind so that I can compare possible commander directions without being pushed toward a forced replacement.

I may decide to keep my current commander.

I may decide to explore alternatives.

The tool should support both modes.

---

# Design Principle

The player's game plan is the source of truth.

The current commander is context.

Alternative commanders are exploration options, not mandatory replacements.

The feature should reason from:

```text
Game Plan
↓
Desired Features
↓
Strategic Expressions
↓
Commander Options
```

not from:

```text
Current Commander
↓
Similar Commanders
```

---

# Commander Preference

The player may decide how open they are to changing the commander.

```ts
export type CommanderPreference =
  | "fixed"
  | "prefer_current"
  | "open";
```

## fixed

The current commander is treated as a hard constraint.

The system should not discover alternative commanders.

This mode is useful when the player wants to improve a specific commander deck.

## prefer_current

The current commander is preferred, but the player is open to seeing alternative strategic expressions.

This is the recommended default.

## open

The player is willing to explore commander options that support the declared game plan, even outside the current commander's color identity.

---

# Input

```ts
{
  gamePlan: GamePlan;

  commanderPreference: CommanderPreference;

  currentCommander?: EnrichedCard;

  currentCommanderFeatures?: FeatureAssignment[];

  commanderFit?: CommanderFit;

  candidatePool?: CommanderOptionSource[];
}
```

---

# Output

```ts
{
  strategicExpressions: StrategicExpression[];

  skipped: boolean;

  reason?: string;

  warnings: Warning[];
}
```

---

# Domain Model

```ts
export type StrategicExpression = {
  name: string;

  description: string;

  emphasizedFeatures: FeatureName[];

  commanderOptions: CommanderOption[];

  tradeoffs: StrategicTradeoff[];

  evidence: string[];
};
```

```ts
export type CommanderOption = {
  commander: string;

  colorIdentity: Color[];

  matchingFeatures: FeatureName[];

  missingFeatures: FeatureName[];

  uniqueFeatures: FeatureName[];

  supportingAssignments: FeatureAssignment[];

  tensions: CommanderOptionTension[];

  evidence: string[];
};
```

```ts
export type StrategicTradeoff = {
  type:
    | "color_identity"
    | "speed"
    | "resilience"
    | "win_condition"
    | "resource_focus"
    | "deck_rebuild_cost";

  description: string;

  evidence: string[];
};
```

```ts
export type CommanderOptionTension = {
  type:
    | "missing_primary_feature"
    | "off_color_change"
    | "different_win_condition"
    | "slower_play_pattern"
    | "higher_rebuild_cost";

  relatedFeatures: FeatureName[];

  evidence: string[];
};
```

---

# Candidate Source

```ts
export type CommanderOptionSource = {
  commander: EnrichedCard;

  features: FeatureAssignment[];

  strategicTags?: string[];
};
```

The feature should not require EDHREC in V1.

The candidate pool may come from:

* A curated local commander dataset.
* Scryfall search results enriched through feature classification.
* A future commander index.
* Manual test fixtures.

---

# Strategic Expression

A Strategic Expression is a commander-centered way of pursuing the declared game plan.

Examples:

## Land Recursion Focus

Emphasizes:

* Land Recursion
* Land Sacrifice
* Graveyard Value

Possible commanders:

* Lord Windgrace
* Soul of Windgrace
* The Gitrog Monster

## Sacrifice Value

Emphasizes:

* Sacrifice Payoff
* Card Advantage Engine
* Permanent Sacrifice

Possible commanders:

* Korvold, Fae-Cursed King
* Mazirek, Kraul Death Priest
* Meren of Clan Nel Toth

## Combat Scaling

Emphasizes:

* +1/+1 Counter Payoff
* Go Tall
* Combat Finisher

Possible commanders:

* Tifa Lockhart
* Kodama of the West Tree
* Halana and Alena, Partners

---

# V1 Discovery Strategy

V1 should use feature-based discovery.

The process should be:

```text
1. Read gamePlan.desiredFeatures.
2. Prioritize primary desired features.
3. Search commander options that match primary features.
4. Group commander options into strategic expressions.
5. Identify missing features and tensions.
6. Return exploration results.
```

---

# Feature Matching Rules

The system should compare:

```ts
gamePlan.desiredFeatures
```

against:

```ts
candidate.features
```

Desired features have roles:

```ts
primary
supporting
optional
```

Primary feature matches are more important than supporting or optional matches.

This should influence grouping and ordering.

It should not produce a numeric score.

---

# Current Commander Context

The current commander may be used as comparison context.

It must not be the main discovery driver.

Good:

```text
The current commander is included as one possible expression of the plan.
```

Bad:

```text
Find commanders similar to the current commander.
```

---

# Behavior by Commander Preference

## fixed

If:

```ts
commanderPreference = "fixed"
```

Then:

```ts
{
  strategicExpressions: [],
  skipped: true,
  reason: "Commander preference is fixed. Alternative commander discovery was skipped."
}
```

## prefer_current

If:

```ts
commanderPreference = "prefer_current"
```

Then:

* Include the current commander as context.
* Return alternative expressions only when they provide a meaningfully different feature emphasis.
* Avoid presenting alternatives as replacements.
* Frame output as exploration.

## open

If:

```ts
commanderPreference = "open"
```

Then:

* Explore commander options freely.
* Allow options outside current color identity.
* Group options by strategic expression.
* Explain color identity tradeoffs.

---

# Color Identity Policy

The system must support commander options outside the current commander's color identity when `commanderPreference` allows it.

Color identity changes must be represented as tradeoffs or tensions.

Example:

```text
Moving from Jund to Golgari may improve land recursion focus but removes red sacrifice and damage tools.
```

The system should not assume that staying in the same colors is always better.

The system should not assume that changing colors is always better.

---

# Similarity Is Not a Score

The system must not expose numeric similarity scores.

Bad:

```text
Lord Windgrace: 87/100
Korvold: 81/100
```

Good:

```ts
{
  name: "Land Recursion Focus",
  emphasizedFeatures: [
    "Land Recursion",
    "Land Sacrifice"
  ],
  commanderOptions: [
    {
      commander: "Lord Windgrace",
      matchingFeatures: [
        "Land Recursion",
        "Land Sacrifice"
      ],
      missingFeatures: [
        "Combat Finisher"
      ]
    }
  ]
}
```

---

# Evidence Rules

Every strategic expression and commander option must include evidence.

Evidence may include:

* matching desired features;
* commander feature assignments;
* oracle text-derived evidence;
* color identity differences;
* commander fit findings;
* declared game plan features.

Bad:

```text
Lord Windgrace is better for lands.
```

Good:

```text
Commander option matches primary desired feature: Land Recursion.
```

---

# Natural Language Boundary

This feature should avoid long-form natural language comparisons.

It may include short descriptions and evidence strings.

Detailed explanation belongs to the agent or response synthesis layer.

Bad:

```ts
comparisonToCurrentCommander:
  "Compared to Korvold, Lord Windgrace better supports land recursion..."
```

Good:

```ts
tradeoffs: [
  {
    type: "color_identity",
    description: "Changing color identity may require rebuilding parts of the deck.",
    evidence: ["Current commander: BRG", "Option commander: BG"]
  }
]
```

---

# Recommended V1 Data Source

Use a curated local commander dataset first.

This approach is:

* deterministic;
* testable;
* transparent;
* easy to expand.

Example:

```ts
[
  {
    commander: "Korvold, Fae-Cursed King",
    features: [
      {
        name: "Sacrifice Payoff",
        role: "payoff",
        evidence: "Rewards sacrificing permanents."
      },
      {
        name: "Card Advantage Engine",
        role: "engine",
        evidence: "Draws cards when permanents are sacrificed."
      }
    ],
    strategicTags: [
      "Sacrifice Value",
      "Jund Value"
    ]
  },
  {
    commander: "Lord Windgrace",
    features: [
      {
        name: "Land Recursion",
        role: "engine",
        evidence: "Returns land cards from graveyard to battlefield."
      },
      {
        name: "Graveyard Enabler",
        role: "enabler",
        evidence: "Discards cards as part of loyalty abilities."
      }
    ],
    strategicTags: [
      "Land Recursion Focus",
      "Graveyard Value"
    ]
  }
]
```

---

# Port

```ts
export interface CommanderOptionRepository {
  findOptions(
    input: FindCommanderOptionsInput
  ): Promise<CommanderOptionSource[]>;
}
```

```ts
export type FindCommanderOptionsInput = {
  desiredFeatures: DesiredFeature[];

  includeOffColor: boolean;

  currentColorIdentity?: Color[];
};
```

---

# Suggested TypeScript API

```ts
export type DiscoverSimilarCommandersInput = {
  gamePlan: GamePlan;

  commanderPreference: CommanderPreference;

  currentCommander?: EnrichedCard;

  currentCommanderFeatures?: FeatureAssignment[];

  commanderFit?: CommanderFit;

  candidatePool?: CommanderOptionSource[];
};

export type DiscoverSimilarCommandersOutput = {
  strategicExpressions: StrategicExpression[];

  skipped: boolean;

  reason?: string;

  warnings: Warning[];
};
```

```ts
export class DiscoverSimilarCommandersUseCase {
  constructor(
    private readonly commanderOptionRepository: CommanderOptionRepository
  ) {}

  async execute(
    input: DiscoverSimilarCommandersInput
  ): Promise<DiscoverSimilarCommandersOutput> {
    // validate input
    // respect commanderPreference
    // load commander options
    // match options against desired features
    // group options into strategic expressions
    // identify tradeoffs and tensions
    // return structured exploration results
  }
}
```

---

# Suggested Folder Structure

```text
/src/features/discover-similar-commanders

  /domain
    strategicExpression.ts
    commanderOption.ts
    commanderOptionRepository.ts
    commanderDiscoveryPolicy.ts

  /application
    discoverSimilarCommanders.usecase.ts

  /infrastructure
    curatedCommanderOptionRepository.ts

  /presentation
    discoverSimilarCommanders.schema.ts

  index.ts
```

---

# Acceptance Criteria

The feature must:

* Respect commander preference.
* Skip discovery when commander preference is fixed.
* Start discovery from the game plan, not from the current commander.
* Allow off-color options when commander preference allows it.
* Compare commander options by desired feature overlap.
* Respect desired feature roles.
* Group commander options into strategic expressions.
* Explain tradeoffs as structured data.
* Include evidence for each strategic expression.
* Include evidence for each commander option.
* Support a curated local dataset in V1.
* Avoid EDHREC dependency in V1.

The feature must not:

* Claim one commander is objectively better.
* Recommend replacing the current commander.
* Produce commander rankings.
* Produce numeric scores.
* Produce confidence labels.
* Depend on EDHREC.
* Require public deck statistics.
* Generate full decklists.
* Recommend card substitutions.
* Produce strategic diagnosis.

---

# Suggested Tests

## Test: skips discovery when commander is fixed

Input:

```ts
{
  commanderPreference: "fixed"
}
```

Expected:

```ts
{
  strategicExpressions: [],
  skipped: true,
  reason: "Commander preference is fixed. Alternative commander discovery was skipped."
}
```

---

## Test: starts from game plan desired features

Input:

```ts
gamePlan.desiredFeatures = [
  {
    feature: "Land Recursion",
    role: "primary"
  },
  {
    feature: "Land Sacrifice",
    role: "supporting"
  }
]
```

Expected repository input:

```ts
{
  desiredFeatures: [
    {
      feature: "Land Recursion",
      role: "primary"
    },
    {
      feature: "Land Sacrifice",
      role: "supporting"
    }
  ]
}
```

---

## Test: groups commanders by strategic expression

Input candidate pool:

```ts
[
  {
    commander: "Lord Windgrace",
    strategicTags: ["Land Recursion Focus"],
    features: [
      {
        name: "Land Recursion",
        role: "engine",
        evidence: "Returns lands from graveyard."
      }
    ]
  },
  {
    commander: "The Gitrog Monster",
    strategicTags: ["Land Recursion Focus"],
    features: [
      {
        name: "Land Recursion",
        role: "engine",
        evidence: "Rewards lands going to graveyard."
      }
    ]
  }
]
```

Expected:

```ts
strategicExpressions: [
  expect.objectContaining({
    name: "Land Recursion Focus",
    commanderOptions: expect.arrayContaining([
      expect.objectContaining({ commander: "Lord Windgrace" }),
      expect.objectContaining({ commander: "The Gitrog Monster" })
    ])
  })
]
```

---

## Test: does not expose score or confidence

Expected candidate:

```ts
{
  commander: "Lord Windgrace"
}
```

Not expected:

```ts
{
  score: 87,
  confidence: "medium"
}
```

---

## Test: explains color identity tradeoff structurally

Input:

```ts
currentCommander.colorIdentity = ["B", "R", "G"]

candidate.colorIdentity = ["B", "G"]
```

Expected tradeoff:

```ts
{
  type: "color_identity",
  evidence: [
    "Current commander color identity: B,R,G",
    "Option color identity: B,G"
  ]
}
```

---

# Non-Goals

This feature must not:

* Produce objective commander rankings.
* Claim one commander is strictly better.
* Generate replacement decklists.
* Recommend specific card swaps.
* Depend on popularity data.
* Depend on EDHREC.
* Replace player preference.
* Build strategic diagnosis.

This feature supports exploration.

It does not make the final decision for the player.
