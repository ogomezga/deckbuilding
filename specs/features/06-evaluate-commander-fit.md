# Feature: Evaluate Commander Fit

## Purpose

Analyze how the selected commander supports, enables, or conflicts with the player's declared game plan.

This feature does not evaluate commander strength.

This feature does not evaluate commander popularity.

This feature does not determine whether the commander should be replaced.

This feature only produces structured findings describing the relationship between:

* Commander capabilities
* Desired features
* Desired play patterns
* Desired win conditions
* Desired game speed

---

# Core Question

This feature answers:

> How does the commander interact with the declared game plan?

It does not answer:

> Is this the best commander?

It does not answer:

> Should the player change commanders?

Those questions belong to later features.

---

# User Story

As a player, I want to understand how my commander contributes to my declared game plan and where it may create tensions or leave important requirements unsupported.

---

# Conceptual Model

Commander Fit compares:

```text
Commander Features
        ↓
Desired Features
        ↓
Desired Play Patterns
        ↓
Desired Win Conditions
        ↓
Desired Game Speed
```

The commander is treated as a strategic component.

The commander is not treated as the source of truth.

The player's intent remains the source of truth.

---

# Design Principle

The player's goal is the source of truth.

The commander is one possible implementation.

The system must be willing to conclude:

> The commander contributes strongly to some aspects of the plan while contributing little to others.

This is considered a valid result.

---

# Input

```ts
{
  commander: EnrichedCard;

  commanderFeatures: FeatureAssignment[];

  gamePlan: GamePlan;

  composition: DeckComposition;
}
```

---

# Output

```ts
{
  commanderFit: CommanderFit;
  warnings: Warning[];
}
```

---

# Domain Model

```ts
export type CommanderFit = {
  commander: string;

  supportingFeatures: SupportingFeature[];

  unsupportedFeatures: UnsupportedFeature[];

  indirectSupport: IndirectSupport[];

  findings: CommanderFitFinding[];
};
```

---

# Supporting Feature

A desired feature directly enabled by the commander.

```ts
export type SupportingFeature = {
  feature: FeatureName;

  evidence: string[];
};
```

Example:

```ts
{
  feature: "Sacrifice Payoff",

  evidence: [
    "Whenever you sacrifice a permanent, draw a card and put a +1/+1 counter on Korvold."
  ]
}
```

---

# Unsupported Feature

A desired feature that receives little or no direct support from the commander.

```ts
export type UnsupportedFeature = {
  feature: FeatureName;

  reason: string;
};
```

Example:

```ts
{
  feature: "Land Recursion",

  reason:
    "The commander does not directly return lands from the graveyard."
}
```

---

# Indirect Support

A commander may support a feature indirectly.

Indirect support should always be weaker than direct support.

```ts
export type IndirectSupport = {
  feature: FeatureName;

  path: string[];

  evidence: string[];
};
```

Example:

```ts
{
  feature: "Combat Finisher",

  path: [
    "Card Advantage Engine",
    "Resource Accumulation"
  ],

  evidence: [
    "Repeated card draw increases access to finishers."
  ]
}
```

---

# Commander Fit Finding

Commander Fit should produce structured findings.

Not conclusions.

Not recommendations.

Not commander rankings.

```ts
export type CommanderFitFinding = {
  type:
    | "strength"
    | "weakness"
    | "tension";

  category:
    | "feature_support"
    | "missing_support"
    | "speed"
    | "win_condition"
    | "resource_usage"
    | "play_pattern";

  relatedFeatures: FeatureName[];

  evidence: string[];
};
```

---

# Evaluation Scope

Commander Fit evaluates:

```ts
commanderFeatures
```

against:

```ts
gamePlan.desiredFeatures
```

and

```ts
gamePlan.primaryObjective
```

and

```ts
gamePlan.winCondition
```

and

```ts
gamePlan.targetWinTurn
```

---

# Direct Support

A commander directly supports a feature when the feature is explicitly present in the commander's feature profile.

Example:

```ts
Desired:
[
  "Sacrifice Payoff"
]

Commander:
[
  "Sacrifice Payoff"
]
```

Result:

```ts
SupportingFeature
```

---

# Indirect Support

A commander may contribute to a feature without directly enabling it.

Example:

```text
Commander:
Card Advantage Engine

Desired:
Combat Finisher
```

The commander does not directly finish the game.

However, additional card access may improve consistency.

This should be recorded as indirect support.

---

# Strategic Leverage

Commander Fit should identify where the commander provides leverage.

Leverage means:

```text
Small commander contribution
↓
Large impact on game-plan execution
```

Examples:

* Sacrifice commanders enabling aristocrats plans.
* Land recursion commanders enabling landfall loops.
* Token commanders enabling go-wide plans.

Leverage should appear as findings.

Not as scores.

---

# Feature Tensions

A tension exists when the commander encourages behavior that differs from the declared plan.

---

## Feature Mismatch

Example:

```text
Desired Plan:
Landfall

Commander:
Treasure Production
```

Potential finding:

```ts
{
  type: "tension",
  category: "feature_support"
}
```

---

## Resource Tension

Example:

```text
Commander:
Requires sacrificing creatures

Game Plan:
Preserve creatures for combat
```

Potential finding:

```ts
{
  type: "tension",
  category: "resource_usage"
}
```

---

## Play Pattern Tension

Example:

```text
Commander:
Incremental value

Player Goal:
Explosive combat turns
```

Potential finding:

```ts
{
  type: "tension",
  category: "play_pattern"
}
```

---

## Speed Tension

Example:

```text
Target Win Turn:
6

Commander:
Requires extended setup
```

Potential finding:

```ts
{
  type: "tension",
  category: "speed"
}
```

---

## Win Condition Tension

Example:

```text
Desired:
Combat Damage

Commander:
Combo-Oriented Engine
```

Potential finding:

```ts
{
  type: "tension",
  category: "win_condition"
}
```

---

# Evidence Rules

Every finding must contain evidence.

Evidence may come from:

* commander features;
* oracle text;
* desired features;
* declared game plan;
* desired win condition;
* target win turn;
* deck composition.

Bad:

```text
The commander is weak.
```

Good:

```text
Land Recursion is declared as a primary feature.

The commander provides no direct land-recursion capability.
```

---

# Commander Policy

Player preferences influence how results are consumed.

```ts
export type CommanderPreference =
  | "fixed"
  | "prefer_current"
  | "open";
```

Commander Fit does not change its analysis based on preference.

It always produces objective findings.

Preferences influence later stages:

* Discover Similar Commanders
* Strategic Diagnosis
* Recommend Changes

---

# Example Output

```ts
{
  commanderFit: {
    commander: "Korvold, Fae-Cursed King",

    supportingFeatures: [
      {
        feature: "Sacrifice Payoff",

        evidence: [
          "Commander rewards every sacrifice with cards and counters."
        ]
      },
      {
        feature: "+1/+1 Counter Payoff",

        evidence: [
          "Commander grows whenever a permanent is sacrificed."
        ]
      }
    ],

    unsupportedFeatures: [
      {
        feature: "Land Recursion",

        reason:
          "The commander does not directly recur lands."
      }
    ],

    indirectSupport: [
      {
        feature: "Combat Finisher",

        path: [
          "Card Advantage Engine",
          "Resource Accumulation"
        ],

        evidence: [
          "Repeated card draw improves access to finishers."
        ]
      }
    ],

    findings: [
      {
        type: "strength",

        category: "feature_support",

        relatedFeatures: [
          "Sacrifice Payoff"
        ],

        evidence: [
          "Commander converts every sacrifice into value."
        ]
      },
      {
        type: "weakness",

        category: "missing_support",

        relatedFeatures: [
          "Land Recursion"
        ],

        evidence: [
          "No direct land-recursion capability detected."
        ]
      }
    ]
  },

  warnings: []
}
```

---

# Suggested TypeScript API

```ts
export type EvaluateCommanderFitInput = {
  commander: EnrichedCard;

  commanderFeatures: FeatureAssignment[];

  gamePlan: GamePlan;

  composition: DeckComposition;
};

export type EvaluateCommanderFitOutput = {
  commanderFit: CommanderFit;
  warnings: Warning[];
};
```

```ts
export class EvaluateCommanderFitUseCase {
  async execute(
    input: EvaluateCommanderFitInput
  ): Promise<EvaluateCommanderFitOutput>;
}
```

---

# Suggested Folder Structure

```text
/src/features/evaluate-commander-fit

  /domain
    commanderFit.ts
    commanderFitFinding.ts

  /application
    evaluateCommanderFit.usecase.ts

  /presentation
    evaluateCommanderFit.schema.ts

  index.ts
```

---

# Acceptance Criteria

The feature must:

* Compare commander features against desired features.
* Detect direct support.
* Detect indirect support.
* Detect unsupported features.
* Detect feature tensions.
* Detect resource tensions.
* Detect speed tensions.
* Detect play-pattern tensions.
* Detect win-condition tensions.
* Produce structured findings.
* Include evidence for every finding.
* Remain commander-agnostic.

The feature must not:

* Recommend replacement commanders.
* Recommend cards.
* Produce rankings.
* Produce scores.
* Produce assessments.
* Use popularity data.
* Use community baselines.
* Assume the commander is correct.

---

# Non-Goals

This feature must not:

* Discover similar commanders.
* Generate decklists.
* Optimize cards.
* Produce strategic diagnosis.

This feature gathers evidence.

Diagnosis happens later.
