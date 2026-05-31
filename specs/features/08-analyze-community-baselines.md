# Feature: Analyze Community Baselines

## Purpose

Analyze community decklists to establish empirical baselines for strategic features, feature packages, and commonly observed solutions.

This feature provides evidence about how similar strategies are typically implemented by other players.

Community data is treated as supporting evidence.

Community data is not treated as truth.

The purpose is not to tell the player what to play.

The purpose is to answer:

> How do other players typically solve similar strategic problems?

---

# Core Question

This feature answers:

> How are similar game plans commonly implemented across the community?

It does not answer:

> What cards should the player play?

It does not answer:

> Which implementation is correct?

It does not answer:

> Is the player's deck wrong?

Those questions belong to later features.

---

# Design Principle

Internal analysis remains the primary source of reasoning.

Community analysis provides context.

The system should prefer:

```text
Game Plan
↓
Desired Features
↓
Community Evidence
```

not:

```text
Commander
↓
Most Popular Cards
```

The project must remain strategy-first.

---

# User Story

As a player, I want to understand:

* how similar strategies are commonly implemented;
* what feature densities are commonly observed;
* what solution packages are commonly used;
* how my deck compares to those observations.

I do not want the system to blindly copy community trends.

---

# Conceptual Model

```text
Game Plan
↓
Desired Features
↓
Find Similar Community Decks
↓
Classify Features
↓
Aggregate Evidence
↓
Build Community Baselines
```

---

# Input

```ts
{
  gamePlan: GamePlan;

  deckComposition: DeckComposition;

  strategicExpressions?: StrategicExpression[];
}
```

---

# Output

```ts
{
  baselineReport: CommunityBaselineReport;

  warnings: Warning[];
}
```

---

# Domain Model

```ts
export type CommunityBaselineReport = {
  analyzedDecks: number;

  featureBaselines: FeatureBaseline[];

  observedSolutions: ObservedSolution[];

  findings: CommunityFinding[];
};
```

---

# Feature Baseline

A Feature Baseline describes how frequently a feature appears in similar decks.

```ts
export type FeatureBaseline = {
  feature: FeatureName;

  sampleSize: number;

  medianDensity: number;

  averageDensity: number;

  lowerQuartile: number;

  upperQuartile: number;

  evidence: string[];
};
```

Example:

```ts
{
  feature: "Land Recursion",

  sampleSize: 145,

  medianDensity: 5,

  averageDensity: 5.4,

  lowerQuartile: 4,

  upperQuartile: 7
}
```

---

# Observed Solution

An Observed Solution represents a commonly used way of supporting a feature.

```ts
export type ObservedSolution = {
  feature: FeatureName;

  cards: string[];

  occurrences: number;

  evidence: string[];
};
```

Example:

```ts
{
  feature: "Land Recursion",

  cards: [
    "Life from the Loam",
    "Ramunap Excavator",
    "Crucible of Worlds"
  ],

  occurrences: 92
}
```

---

# Why Observed Solutions Matter

Feature density alone is insufficient.

The system should help answer:

```text
How do players usually solve this problem?
```

not merely:

```text
How many cards do they use?
```

Example:

```text
Problem:
Land Recursion
```

Observed solutions:

```text
Life from the Loam Package

Crucible Package

World Shaper Package
```

These are observations.

Not recommendations.

---

# Community Finding

A Community Finding compares current deck composition against observed community baselines.

It provides evidence.

It does not produce a diagnosis.

```ts
export type CommunityFinding = {
  feature: FeatureName;

  currentDensity: number;

  observedMedian: number;

  observedRange: {
    lowerQuartile: number;
    upperQuartile: number;
  };

  evidence: string[];
};
```

---

# Similar Deck Selection

This is the most important part of the feature.

Deck selection should be strategy-first.

Bad:

```text
Korvold
↓
Korvold decks
```

Good:

```text
Landfall
Land Recursion
Land Sacrifice
Combat Scaling
↓
Similar Strategy Decks
```

---

# Similarity Signals

Similarity should primarily be derived from:

```text
Desired Features
Primary Features
Supporting Features
Declared Win Condition
Target Win Turn
Bracket
```

Additional signals:

```text
Strategic Expressions
Commander Features
Color Identity
```

Commander identity should be a secondary signal.

---

# Strategic Expression Integration

Community Baselines may use:

```ts
strategicExpressions
```

produced by:

```text
07 Discover Similar Commanders
```

to expand strategy discovery.

Example:

```text
Land Recursion Focus
```

may include:

```text
Lord Windgrace
The Gitrog Monster
Soul of Windgrace
Titania
```

even if the current commander is Korvold.

---

# Community Sources

The system should support multiple sources through adapters.

Potential sources:

```text
Moxfield
Archidekt
EDHREC
MTGGoldfish
```

No single source should dominate.

---

# Source Model

```ts
export interface CommunityDeckRepository {
  findSimilarDecks(
    criteria: SimilarDeckCriteria
  ): Promise<CommunityDeck[]>;
}
```

---

# Community Deck

```ts
export type CommunityDeck = {
  commander: string;

  decklist: ParsedDeck;

  strategicFeatures: FeatureAssignment[];
};
```

---

# Baseline Calculation

For every desired feature:

```text
Land Recursion
```

calculate:

```text
Median Density
Average Density
Lower Quartile
Upper Quartile
Observed Solutions
```

Example:

```ts
{
  feature: "Land Recursion",

  medianDensity: 5,

  lowerQuartile: 4,

  upperQuartile: 7
}
```

---

# Median Over Average

The system should prefer:

```text
Median
```

over:

```text
Average
```

because community decklists frequently contain outliers.

Median better reflects typical implementation patterns.

---

# Current Deck Comparison

The current deck should be compared against observed baselines.

Example:

Community:

```text
Land Recursion
Median = 5
```

Current Deck:

```text
Land Recursion
Density = 2
```

Finding:

```ts
{
  feature: "Land Recursion",

  currentDensity: 2,

  observedMedian: 5,

  observedRange: {
    lowerQuartile: 4,
    upperQuartile: 7
  }
}
```

This is evidence.

Not a recommendation.

---

# Evidence Rules

Every baseline and finding must include evidence.

Evidence may include:

* sample size;
* observed densities;
* source counts;
* observed solutions;
* strategic expressions used for discovery.

Bad:

```text
You need more recursion.
```

Good:

```text
Current density: 2

Observed median: 5

Sample size: 145
```

---

# Natural Language Boundary

This feature should avoid conclusions.

Bad:

```text
The deck lacks recursion.
```

Bad:

```text
The player should add Life from the Loam.
```

Good:

```text
Among 145 similar strategy decks, the median Land Recursion density is 5.
```

---

# Example Output

```ts
{
  baselineReport: {
    analyzedDecks: 145,

    featureBaselines: [
      {
        feature: "Land Recursion",

        sampleSize: 145,

        medianDensity: 5,

        averageDensity: 5.4,

        lowerQuartile: 4,

        upperQuartile: 7,

        evidence: [
          "145 similar strategy decks analyzed."
        ]
      }
    ],

    observedSolutions: [
      {
        feature: "Land Recursion",

        cards: [
          "Life from the Loam",
          "Ramunap Excavator",
          "Crucible of Worlds"
        ],

        occurrences: 92,

        evidence: [
          "Observed in 92 analyzed decks."
        ]
      }
    ],

    findings: [
      {
        feature: "Land Recursion",

        currentDensity: 2,

        observedMedian: 5,

        observedRange: {
          lowerQuartile: 4,
          upperQuartile: 7
        },

        evidence: [
          "Current Density: 2",
          "Observed Median: 5",
          "Sample Size: 145"
        ]
      }
    ]
  },

  warnings: []
}
```

---

# Port

```ts
export interface CommunityDeckRepository {
  findSimilarDecks(
    criteria: SimilarDeckCriteria
  ): Promise<CommunityDeck[]>;
}
```

---

# Similar Deck Criteria

```ts
export type SimilarDeckCriteria = {
  desiredFeatures: DesiredFeature[];

  bracket?: number;

  targetWinTurn?: number;

  strategicExpressions?: string[];
};
```

---

# Suggested TypeScript API

```ts
export type AnalyzeCommunityBaselinesInput = {
  gamePlan: GamePlan;

  deckComposition: DeckComposition;

  strategicExpressions?: StrategicExpression[];
};

export type AnalyzeCommunityBaselinesOutput = {
  baselineReport: CommunityBaselineReport;

  warnings: Warning[];
};
```

```ts
export class AnalyzeCommunityBaselinesUseCase {
  constructor(
    private readonly communityDeckRepository: CommunityDeckRepository
  ) {}

  async execute(
    input: AnalyzeCommunityBaselinesInput
  ): Promise<AnalyzeCommunityBaselinesOutput> {
    // validate input
    // find similar strategy decks
    // classify features
    // build baselines
    // extract observed solutions
    // compare against current deck
    // return evidence
  }
}
```

---

# Suggested Folder Structure

```text
/src/features/analyze-community-baselines

  /domain
    communityBaseline.ts
    communityFinding.ts
    observedSolution.ts
    communityDeckRepository.ts

  /application
    analyzeCommunityBaselines.usecase.ts

  /infrastructure
    moxfieldRepository.ts
    archidektRepository.ts
    edhrecRepository.ts
    mtgGoldfishRepository.ts

  /presentation
    analyzeCommunityBaselines.schema.ts

  index.ts
```

---

# Acceptance Criteria

The feature must:

* Analyze similar strategy decks.
* Remain strategy-first.
* Build empirical feature baselines.
* Calculate median densities.
* Calculate average densities.
* Calculate quartiles.
* Extract observed solutions.
* Compare current deck densities against observed baselines.
* Support multiple community sources.
* Treat community data as evidence.
* Provide structured outputs.

The feature must not:

* Generate recommendations.
* Recommend cards.
* Rank cards.
* Produce confidence labels.
* Produce assessments.
* Produce diagnoses.
* Override internal analysis.
* Depend exclusively on a single source.

---

# Suggested Tests

## Test: calculates baseline median

Input:

```ts
[2, 4, 5, 5, 7]
```

Expected:

```ts
medianDensity: 5
```

---

## Test: extracts observed solutions

Input:

```ts
Feature:
Land Recursion
```

Community cards:

```ts
[
  "Life from the Loam",
  "Ramunap Excavator",
  "Crucible of Worlds"
]
```

Expected:

```ts
ObservedSolution
```

---

## Test: compares current density

Current:

```ts
2
```

Median:

```ts
5
```

Expected:

```ts
CommunityFinding
```

No assessment label should be generated.

---

## Test: discovery is strategy-first

Input:

```ts
desiredFeatures = [
  "Land Recursion",
  "Land Sacrifice"
]
```

Expected:

```ts
criteria.desiredFeatures
```

The query must not rely solely on commander identity.

---

# Non-Goals

This feature must not:

* Decide what cards should be played.
* Determine optimal decklists.
* Recommend commanders.
* Replace Commander Fit.
* Replace Strategic Diagnosis.
* Replace player judgment.

This feature provides evidence.

Diagnosis happens later.
