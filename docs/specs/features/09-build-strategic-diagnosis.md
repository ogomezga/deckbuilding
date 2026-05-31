# Feature: Build Strategic Diagnosis

## Purpose

Build a strategic diagnosis from all available analysis evidence.

This feature is the first place where the system is allowed to produce conclusions.

It consumes evidence from previous capabilities and identifies the strategic problems, tensions, gaps, and divergences that may prevent the deck from executing the player's declared game plan.

This feature does not recommend specific changes.

It prepares the structured diagnosis that `10-recommend-changes.md` will use to decide what changes are needed.

---

# Core Question

This feature answers:

> What strategic issues prevent the current deck from executing the player's declared game plan?

It does not answer:

> What cards should be added?

It does not answer:

> What cards should be removed?

It does not answer:

> What commander should be played?

Those questions belong to later capabilities.

---

# User Story

As a player, I want the assistant to combine all available evidence about my deck, commander, alternatives, and community baselines so that I can understand what is preventing my deck from achieving the game plan I described.

---

# Design Principle

Strategic Diagnosis is the only capability allowed to emit strategic conclusions.

Previous capabilities produce evidence.

Strategic Diagnosis interprets that evidence.

Recommendations come later.

```text
Analysis
↓
Diagnosis
↓
Recommendation
```

---

# Input

```ts
{
  gamePlan: GamePlan;

  composition: DeckComposition;

  commanderFit: CommanderFit;

  strategicExpressions: StrategicExpression[];

  communityBaselineReport: CommunityBaselineReport;
}
```

---

# Output

```ts
{
  diagnosis: StrategicDiagnosis;

  warnings: Warning[];
}
```

---

# Domain Model

```ts
export type StrategicDiagnosis = {
  featureGaps: FeatureGap[];

  featureSurpluses: FeatureSurplus[];

  featureTensions: FeatureTension[];

  commanderTensions: CommanderTension[];

  communityDivergences: CommunityDivergence[];

  powerLevelConcerns: PowerLevelConcern[];

  supportingEvidence: DiagnosisEvidence[];
};
```

---

# Feature Gap

A desired feature that appears missing or insufficient for the declared game plan.

```ts
export type FeatureGap = {
  feature: FeatureName;

  role:
    | "primary"
    | "supporting"
    | "optional";

  currentDensity: number;

  expectedDensity?: number;

  communityMedian?: number;

  reason: string;

  evidence: DiagnosisEvidence[];
};
```

Example:

```ts
{
  feature: "Land Recursion",

  role: "primary",

  currentDensity: 2,

  communityMedian: 5,

  reason:
    "The game plan depends on recurring lands, but current density is low compared with both the declared role and observed community baselines."
}
```

---

# Feature Surplus

A feature that appears strongly represented but has weak connection to the declared game plan.

```ts
export type FeatureSurplus = {
  feature: FeatureName;

  currentDensity: number;

  reason: string;

  evidence: DiagnosisEvidence[];
};
```

This does not mean the feature is bad.

It means the feature may be consuming deck space without clearly supporting the declared plan.

---

# Feature Tension

A structural conflict between features.

```ts
export type FeatureTension = {
  type:
    | "payoff_without_enabler"
    | "enabler_without_payoff"
    | "competing_game_plans"
    | "speed_mismatch"
    | "resource_conflict";

  relatedFeatures: FeatureName[];

  reason: string;

  evidence: DiagnosisEvidence[];
};
```

Example:

```ts
{
  type: "payoff_without_enabler",

  relatedFeatures: [
    "Sacrifice Payoff",
    "Sacrifice Outlet"
  ],

  reason:
    "The deck contains several sacrifice payoffs but relatively few repeatable sacrifice outlets."
}
```

---

# Commander Tension

A strategic mismatch between commander contribution and the declared game plan.

```ts
export type CommanderTension = {
  type:
    | "missing_commander_support"
    | "commander_pushes_different_plan"
    | "commander_speed_mismatch"
    | "commander_resource_tension";

  relatedFeatures: FeatureName[];

  reason: string;

  evidence: DiagnosisEvidence[];
};
```

Example:

```ts
{
  type: "missing_commander_support",

  relatedFeatures: [
    "Land Recursion"
  ],

  reason:
    "Land Recursion is central to the game plan, but the commander provides no direct support for recurring lands."
}
```

---

# Community Divergence

A meaningful difference between the current deck and observed community baselines for similar strategies.

```ts
export type CommunityDivergence = {
  feature: FeatureName;

  currentDensity: number;

  observedMedian: number;

  observedRange: {
    lowerQuartile: number;
    upperQuartile: number;
  };

  reason: string;

  evidence: DiagnosisEvidence[];
};
```

Community divergence is not automatically a problem.

It becomes diagnostically relevant when it affects a desired feature, power level, consistency, or game speed.

---

# Power Level Concern

A concern related to the player's declared bracket, target speed, or power expectations.

```ts
export type PowerLevelConcern = {
  type:
    | "too_slow_for_target"
    | "too_fast_for_bracket"
    | "insufficient_consistency"
    | "excessive_setup_requirement";

  reason: string;

  evidence: DiagnosisEvidence[];
};
```

Example:

```ts
{
  type: "too_slow_for_target",

  reason:
    "The player wants to threaten wins around turn 6, but the deck has high average mana value and limited acceleration."
}
```

---

# Diagnosis Evidence

```ts
export type DiagnosisEvidence = {
  source:
    | "deck_composition"
    | "commander_fit"
    | "commander_discovery"
    | "community_baseline"
    | "game_plan";

  detail: string;
};
```

Example:

```ts
{
  source: "community_baseline",
  detail: "Land Recursion observed median density: 5."
}
```

---

# Diagnosis Rules

## Rule 1: Diagnose only from evidence

The system must not invent problems.

Every diagnosis item must reference evidence from previous capabilities.

---

## Rule 2: Respect Desired Feature Roles

Primary features matter more than supporting or optional features.

A missing primary feature is more diagnostically important than a missing optional feature.

---

## Rule 3: Use Community Data as Context

Community baselines may support a diagnosis.

They must not be the only reason for a diagnosis.

Bad:

```text
Community decks play more recursion, so this deck is wrong.
```

Good:

```text
The game plan declares Land Recursion as primary, the deck contains only 2 such cards, and similar strategies commonly show higher recursion density.
```

---

## Rule 4: Commander Alternatives Are Evidence, Not Orders

Strategic expressions from `Discover Similar Commanders` may reveal alternative ways to pursue the plan.

They must not automatically imply the commander should be changed.

---

## Rule 5: No Global Score

Strategic Diagnosis must not produce:

* alignment score;
* commander score;
* deck score;
* global grade;
* final verdict.

The output should be a structured list of diagnosed issues and supporting evidence.

---

# Example Output

```ts
{
  diagnosis: {
    featureGaps: [
      {
        feature: "Land Recursion",

        role: "primary",

        currentDensity: 2,

        communityMedian: 5,

        reason:
          "The game plan relies on recurring lands, but the deck appears light on Land Recursion support.",

        evidence: [
          {
            source: "game_plan",
            detail: "Land Recursion is a primary desired feature."
          },
          {
            source: "deck_composition",
            detail: "Current Land Recursion density: 2."
          },
          {
            source: "community_baseline",
            detail: "Observed median Land Recursion density: 5."
          }
        ]
      }
    ],

    featureSurpluses: [],

    featureTensions: [
      {
        type: "payoff_without_enabler",

        relatedFeatures: [
          "Sacrifice Payoff",
          "Sacrifice Outlet"
        ],

        reason:
          "The deck appears to contain more sacrifice payoffs than repeatable sacrifice outlets.",

        evidence: [
          {
            source: "deck_composition",
            detail: "Sacrifice Payoff density: 7."
          },
          {
            source: "deck_composition",
            detail: "Sacrifice Outlet density: 2."
          }
        ]
      }
    ],

    commanderTensions: [
      {
        type: "missing_commander_support",

        relatedFeatures: [
          "Land Recursion"
        ],

        reason:
          "The commander does not directly support one of the primary features of the declared game plan.",

        evidence: [
          {
            source: "commander_fit",
            detail: "Commander provides no direct Land Recursion support."
          }
        ]
      }
    ],

    communityDivergences: [
      {
        feature: "Land Recursion",

        currentDensity: 2,

        observedMedian: 5,

        observedRange: {
          lowerQuartile: 4,
          upperQuartile: 7
        },

        reason:
          "Current Land Recursion density is lower than commonly observed in similar strategies.",

        evidence: [
          {
            source: "community_baseline",
            detail: "Observed range: 4–7."
          }
        ]
      }
    ],

    powerLevelConcerns: [
      {
        type: "too_slow_for_target",

        reason:
          "The target win turn is 6, but the deck may require more setup than the target allows.",

        evidence: [
          {
            source: "game_plan",
            detail: "Target win turn: 6."
          },
          {
            source: "deck_composition",
            detail: "Average mana value: 3.8."
          }
        ]
      }
    ],

    supportingEvidence: []
  },

  warnings: []
}
```

---

# Suggested TypeScript API

```ts
export type BuildStrategicDiagnosisInput = {
  gamePlan: GamePlan;

  composition: DeckComposition;

  commanderFit: CommanderFit;

  strategicExpressions: StrategicExpression[];

  communityBaselineReport: CommunityBaselineReport;
};

export type BuildStrategicDiagnosisOutput = {
  diagnosis: StrategicDiagnosis;

  warnings: Warning[];
};
```

```ts
export class BuildStrategicDiagnosisUseCase {
  async execute(
    input: BuildStrategicDiagnosisInput
  ): Promise<BuildStrategicDiagnosisOutput>;
}
```

---

# Suggested Folder Structure

```text
/src/features/build-strategic-diagnosis

  /domain
    strategicDiagnosis.ts
    diagnosisEvidence.ts
    featureGap.ts
    featureTension.ts
    commanderTension.ts
    communityDivergence.ts
    diagnosisPolicy.ts

  /application
    buildStrategicDiagnosis.usecase.ts

  /presentation
    buildStrategicDiagnosis.schema.ts

  index.ts
```

---

# Acceptance Criteria

The feature must:

* Consume deck composition.
* Consume commander fit findings.
* Consume strategic expressions.
* Consume community baselines.
* Identify feature gaps.
* Identify feature surpluses.
* Identify feature tensions.
* Identify commander tensions.
* Identify community divergences.
* Identify power level concerns.
* Include evidence for every diagnosis item.
* Avoid global scores.
* Avoid recommendations.

The feature must not:

* Recommend cards.
* Recommend commander changes.
* Produce card substitutions.
* Generate decklists.
* Use EDHREC directly.
* Fetch card data.
* Parse decklists.
* Produce final deck quality scores.

This feature diagnoses strategic issues.

Recommendations happen later.
