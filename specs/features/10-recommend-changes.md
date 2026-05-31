# Feature: Recommend Changes

## Purpose

Generate actionable deck improvements from a completed Strategic Diagnosis.

This feature is responsible for transforming diagnosed strategic problems into concrete deckbuilding actions.

Unlike previous features, this capability may recommend:

* Strategic changes
* Structural changes
* Card additions
* Card removals
* Card swaps
* Commander exploration directions

Every recommendation must be supported by evidence.

The system must remain strategy-first.

Recommendations should emerge from the declared game plan and diagnosis, not from popularity alone.

---

# Core Question

This feature answers:

> What changes should be made to better achieve the player's declared game plan?

It does not answer:

> What cards are most popular?

It does not answer:

> What cards are played most often with this commander?

---

# User Story

As a player, I want to know:

* what problems exist in my deck;
* what should change;
* which cards could solve those problems;
* which cards are likely candidates for replacement;
* why each change improves my declared strategy.

---

# Design Principle

Recommendations must follow a hierarchy.

The system should first explain the strategic problem.

Then explain the structural adjustment.

Then suggest concrete implementations.

```text
Strategic Diagnosis
↓
Strategic Recommendation
↓
Structural Recommendation
↓
Card Recommendation
↓
Swap Recommendation
```

---

# Input

```ts
{
  gamePlan: GamePlan;

  diagnosis: StrategicDiagnosis;

  composition: DeckComposition;

  commanderPreference: CommanderPreference;

  communityBaselineReport: CommunityBaselineReport;
}
```

---

# Output

```ts
{
  recommendations: Recommendation[];

  warnings: Warning[];
}
```

---

# Domain Model

```ts
export type Recommendation = {
  priority: RecommendationPriority;

  strategicRecommendation: StrategicRecommendation;

  structuralRecommendation?: StructuralRecommendation;

  cardRecommendations: CardRecommendation[];

  swapRecommendations: SwapRecommendation[];

  evidence: DiagnosisEvidence[];
};
```

---

# Strategic Recommendation

Represents the strategic problem being addressed.

```ts
export type StrategicRecommendation = {
  title: string;

  rationale: string;

  relatedFeatures: FeatureName[];
};
```

Example:

```text
Increase Land Recursion support.
```

---

# Structural Recommendation

Represents the structural deckbuilding adjustment.

```ts
export type StructuralRecommendation = {
  title: string;

  rationale: string;

  targetState?: string;
};
```

Example:

```text
Increase Land Recursion density from 2 to approximately 5 supporting cards.
```

---

# Card Recommendation

Represents a card that may help solve the diagnosed problem.

```ts
export type CardRecommendation = {
  cardName: string;

  supportedFeatures: FeatureName[];

  rationale: string;

  source:
    | "community_solution"
    | "feature_match"
    | "commander_synergy"
    | "diagnosis_resolution";
};
```

---

# Swap Recommendation

Represents a proposed implementation.

```ts
export type SwapRecommendation = {
  removeCard: string;

  addCard: string;

  rationale: string;

  gainedFeatures: FeatureName[];

  lostFeatures: FeatureName[];
};
```

---

# Recommendation Sources

Recommendations may originate from:

* Feature Gaps
* Feature Surpluses
* Feature Tensions
* Commander Tensions
* Community Divergences
* Power Level Concerns

---

# Feature Gap Recommendations

Example diagnosis:

```text
Primary Feature:
Land Recursion

Current Density:
2

Observed Median:
5
```

Produces:

## Strategic Recommendation

```text
Increase Land Recursion support.
```

## Structural Recommendation

```text
Increase Land Recursion density.
```

## Card Recommendations

```text
Life from the Loam
Ramunap Excavator
Crucible of Worlds
World Shaper
```

These cards are suggested because they directly solve the diagnosed gap.

Not because they are popular.

---

# Feature Tension Recommendations

Example diagnosis:

```text
Sacrifice Payoffs

without

Sacrifice Outlets
```

Produces:

## Strategic Recommendation

```text
Resolve sacrifice infrastructure tension.
```

## Structural Recommendation

```text
Increase repeatable sacrifice outlets.
```

## Card Recommendations

```text
Goblin Bombardment
Ashnod's Altar
Viscera Seer
```

---

# Community Solution Integration

Community data should be used carefully.

Community observations may identify:

```text
Observed Solutions
```

Example:

```text
Feature:
Land Recursion
```

Observed solutions:

```text
Life from the Loam Package
Crucible Package
World Shaper Package
```

Recommendations may use these observations as supporting evidence.

Community popularity alone must never justify a recommendation.

---

# Swap Recommendation Rules

The system should attempt to identify replacement candidates.

Priority:

```text
Cards supporting surplus features
↓
Cards supporting unrelated features
↓
Cards with weak contribution
```

The system should avoid removing cards that support:

```text
Primary Desired Features
```

unless a stronger replacement fulfills the same role.

---

# Example Swap

Diagnosis:

```text
Land Recursion Gap
```

Current Card:

```text
Hedron Archive
```

Contribution:

```text
Mana Acceleration
```

Replacement:

```text
Life from the Loam
```

Result:

```text
Gain:
Land Recursion

Lose:
Mana Acceleration
```

Rationale:

```text
The deck already exceeds community baselines for Mana Acceleration but remains below baseline for Land Recursion.
```

---

# Commander Recommendations

Commander-related recommendations must respect:

```ts
CommanderPreference
```

---

## fixed

The system must not recommend changing commanders.

The recommendation should focus on improving the 99.

---

## prefer_current

The system may recommend exploring alternative strategic expressions.

Example:

```text
Explore commander options that provide direct Land Recursion support.
```

The current commander remains the default assumption.

---

## open

The system may recommend alternative commander directions.

Example:

```text
Consider a Land Recursion-focused commander expression.
```

The recommendation must reference findings from:

```text
07 Discover Similar Commanders
```

The system must not claim that one commander is objectively best.

---

# Priority Rules

## Critical

Generated when:

* Primary feature gap exists.
* Severe commander tension exists.
* Major power-level concern exists.

---

## High

Generated when:

* Primary feature underrepresentation exists.
* Significant feature tension exists.

---

## Medium

Generated when:

* Supporting feature gap exists.
* Moderate consistency issue exists.

---

## Low

Generated when:

* Minor optimization opportunity exists.

---

# Root Cause Rule

Recommendations must address root causes.

Bad:

```text
Add more finishers.
```

when the diagnosis reveals:

```text
The deck cannot reliably trigger Landfall.
```

Good:

```text
Increase repeatable land access.
```

---

# Evidence Rules

Every recommendation must be backed by diagnosis evidence.

Bad:

```text
Play Life from the Loam.
```

Good:

```text
Life from the Loam directly addresses the diagnosed Land Recursion gap and appears in multiple observed community solutions for similar strategies.
```

---

# No Recommendation Scenario

The system may return:

```text
No significant changes recommended.
```

Conditions:

* No major diagnosis items.
* No critical tensions.
* No significant feature gaps.
* No significant power-level concerns.

This is a valid outcome.

---

# Example Output

```ts
{
  recommendations: [
    {
      priority: "high",

      strategicRecommendation: {
        title:
          "Increase Land Recursion support",

        rationale:
          "Land Recursion is a primary feature of the declared game plan."
      },

      structuralRecommendation: {
        title:
          "Increase Land Recursion density",

        targetState:
          "Approximately 5 supporting cards"
      },

      cardRecommendations: [
        {
          cardName:
            "Life from the Loam",

          supportedFeatures: [
            "Land Recursion"
          ],

          rationale:
            "Directly supports recurring lands from the graveyard.",

          source:
            "diagnosis_resolution"
        }
      ],

      swapRecommendations: [
        {
          removeCard:
            "Hedron Archive",

          addCard:
            "Life from the Loam",

          rationale:
            "Improves Land Recursion while reducing excess Mana Acceleration.",

          gainedFeatures: [
            "Land Recursion"
          ],

          lostFeatures: [
            "Mana Acceleration"
          ]
        }
      ]
    }
  ]
}
```

---

# Suggested TypeScript API

```ts
export type RecommendChangesInput = {
  gamePlan: GamePlan;

  diagnosis: StrategicDiagnosis;

  composition: DeckComposition;

  commanderPreference: CommanderPreference;

  communityBaselineReport: CommunityBaselineReport;
};

export type RecommendChangesOutput = {
  recommendations: Recommendation[];

  warnings: Warning[];
};
```

---

# Suggested Folder Structure

```text
/src/features/recommend-changes

  /domain
    recommendation.ts
    strategicRecommendation.ts
    cardRecommendation.ts
    swapRecommendation.ts

  /application
    recommendChanges.usecase.ts

  /presentation
    recommendChanges.schema.ts

  index.ts
```

---

# Acceptance Criteria

The feature must:

* Consume Strategic Diagnosis.
* Generate strategic recommendations.
* Generate structural recommendations.
* Generate card recommendations.
* Generate swap recommendations.
* Respect Commander Preference.
* Prioritize root causes.
* Explain every recommendation.
* Use community observations as evidence.
* Avoid popularity-only reasoning.

The feature must not:

* Build a complete deck.
* Generate commander rankings.
* Ignore diagnosis evidence.
* Recommend cards solely because they are popular.
* Produce scores.

---

# Non-Goals

This feature must not:

* Automatically rewrite the entire deck.
* Claim objective deckbuilding truth.
* Override player preferences.

This feature transforms diagnosis into action.

It is the final decision-support layer of the system.
