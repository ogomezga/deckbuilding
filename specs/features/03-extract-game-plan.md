# Feature: Extract Game Plan

## Purpose

Transform the player's natural language deck goal into a structured `GamePlan`.

This feature captures what the player wants the deck to do.

The decklist alone is not enough to evaluate a deck.

The system must compare the current deck against the player's declared intent.

---

# User Story

As a player, I want to describe the goal of my deck in natural language so that the assistant can analyze whether my current deck is aligned with that goal.

---

# Input

```ts
{
  commander: string;
  description: string;
  targetWinTurn?: number;
  bracket?: number;
  constraints?: string[];
  preferences?: PlayerPreferences;
}
```

Example:

```ts
{
  commander: "Korvold, Fae-Cursed King",
  description: "I want to use fetchlands, land sacrifice and land recursion to trigger landfall repeatedly, grow creatures with +1/+1 counters and win through combat damage as fast as Bracket 3 allows.",
  targetWinTurn: 6,
  bracket: 3,
  constraints: ["No infinite combos"]
}
```

---

# Output

```ts
{
  gamePlan: {
    commander: string;
    primaryObjective: string;
    winCondition: string;
    targetWinTurn?: number;
    bracket?: number;
    desiredFeatures: DesiredFeature[];
    constraints: string[];
    rawDescription: string;
    preferences?: PlayerPreferences;
    strategicAngles?: StrategicAngle[];
  };
  warnings: Array<{
    reason: string;
  }>;
}
```

Example:

```ts
{
  gamePlan: {
    commander: "Korvold, Fae-Cursed King",
    primaryObjective: "Generate repeated landfall and sacrifice triggers to grow creatures quickly.",
    winCondition: "Combat damage through large creatures.",
    targetWinTurn: 6,
    bracket: 3,
    desiredFeatures: [
      "Landfall Trigger",
      "Land Sacrifice",
      "Land Recursion",
      "Sacrifice Payoff",
      "+1/+1 Counter Payoff",
      "Combat Finisher"
    ],
    constraints: ["No infinite combos"],
    rawDescription: "I want to use fetchlands..."
  },
  warnings: []
}
```

---

# Core Concept

This feature extracts intent.

It does not evaluate whether the deck supports the intent.

It does not recommend cards.

It only creates a structured representation of the player's desired game plan.

---

# LLM Usage

This feature may use an LLM in V1.

The LLM is useful because the input is natural language.

However, the LLM must return structured output validated by a schema.

The system should not accept free-form LLM output directly.

---

# LLM Responsibilities

The LLM may:

* Summarize the player's objective.
* Identify the intended win condition.
* Extract desired features.
* Detect constraints.
* Normalize ambiguous wording into known feature names.
* Preserve the original description.

The LLM must not:

* Invent card data.
* Analyze the decklist.
* Recommend cards.
* Evaluate commander fit.
* Decide whether the game plan is good.
* Ignore explicitly provided fields such as `targetWinTurn` or `bracket`.

---

# Known Feature Vocabulary

The feature extractor should prefer known feature names.

Initial vocabulary:

```text
Landfall Trigger
Land Sacrifice
Land Recursion
Extra Land Drop
Sacrifice Outlet
Sacrifice Payoff
Graveyard Enabler
Permanent Recursion
Token Producer
Token Payoff
+1/+1 Counter Payoff
Combat Finisher
Card Advantage Engine
Mana Acceleration
Removal
Board Wipe
Protection
Tutor
Aristocrats Payoff
ETB Trigger
ETB Payoff
Reanimation
Discard Outlet
Treasure Production
Treasure Payoff
Go Wide
Go Tall
```

The vocabulary can expand over time.

Unknown but relevant concepts may be returned as warnings or candidate features.

---

# Input Rules

* `commander` is required.
* `description` is required.
* `description` must not be empty.
* `targetWinTurn`, when provided, must be a positive integer.
* `bracket`, when provided, must be between 1 and 5.
* `constraints` are optional.

---

# Output Rules

## primaryObjective

Must be a concise sentence.

It should describe what the deck is trying to do.

## winCondition

Must describe how the deck expects to win.

Examples:

* Combat damage through large creatures.
* Combat damage through wide token boards.
* Combo finish.
* Aristocrats drain.
* Control into value finish.

## desiredFeatures

Must be an array of normalized feature names.

The extractor should include only features that are relevant to the declared game plan.

## constraints

Must include:

* Explicit user constraints.
* Constraints inferred with high confidence from the description.

Example:

If the user says:

```text
No infinites
```

then include:

```ts
"No infinite combos"
```

---

# Clarification Behavior

If critical information is missing, the system may return clarification questions.

For V1, clarification questions are optional but supported.

Example output:

```ts
{
  gamePlan: null,
  clarificationQuestions: [
    "How does the deck mainly intend to win?",
    "What power bracket should the deck stay within?"
  ],
  warnings: []
}
```

Clarification should be used when the description is too vague to extract a useful game plan.

Example vague description:

```text
I want a fun Korvold deck.
```

If the extracted GamePlan confidence is below a defined threshold,
the extractor should prefer clarification over speculation.

Example:

```text
Stay casual
↓
Avoid cEDH expectations
```

---

# Suggested TypeScript API

```ts
export type ExtractGamePlanInput = {
  commander: string;
  description: string;
  targetWinTurn?: number;
  bracket?: number;
  constraints?: string[];
};

export type GamePlan = {
  commander: string;
  primaryObjective: string;
  winCondition: string;
  targetWinTurn?: number;
  bracket?: number;
  desiredFeatures: DesiredFeature[];
  constraints: string[];
  rawDescription: string;
};

export type ExtractGamePlanOutput = {
  gamePlan: GamePlan | null;
  clarificationQuestions: string[];
  warnings: Array<{
    reason: string;
  }>;
};

export interface GamePlanExtractor {
  extract(input: ExtractGamePlanInput): Promise<ExtractGamePlanOutput>;
}

export class ExtractGamePlanUseCase {
  constructor(private readonly extractor: GamePlanExtractor) {}

  async execute(
    input: ExtractGamePlanInput
  ): Promise<ExtractGamePlanOutput> {
    // validate input
    // call extractor
    // validate structured output
    // return result
  }
}
```

---

# Suggested Implementations

## RuleBasedGamePlanExtractor

A simple implementation based on keywords.

Useful for tests and offline development.

Example:

```text
landfall → Landfall Trigger
fetchland → Land Sacrifice, Landfall Trigger
graveyard lands → Land Recursion
+1/+1 counters → +1/+1 Counter Payoff
combat damage → Combat Finisher
```

## LlmGamePlanExtractor

An implementation that calls an LLM and validates structured output.

This should be the main production implementation once an LLM provider is configured.

---

# Suggested Folder Structure

```text
/src/features/extract-game-plan
  /domain
    gamePlanExtractor.ts

  /application
    extractGamePlan.usecase.ts

  /infrastructure
    ruleBasedGamePlanExtractor.ts
    llmGamePlanExtractor.ts

  /presentation
    extractGamePlan.schema.ts

  index.ts
```

---

# Acceptance Criteria

* Accepts commander and natural language description.
* Produces a structured `GamePlan`.
* Extracts primary objective.
* Extracts win condition.
* Extracts desired features.
* Preserves explicitly provided `targetWinTurn`.
* Preserves explicitly provided `bracket`.
* Preserves explicit constraints.
* Returns clarification questions when the description is too vague.
* Validates LLM output before returning it.
* Does not analyze the decklist.
* Does not recommend cards.

---

# Suggested Tests

## Test: extracts landfall sacrifice game plan

Input:

```ts
{
  commander: "Korvold, Fae-Cursed King",
  description: "Use fetchlands and land recursion to trigger landfall repeatedly, grow creatures with +1/+1 counters and win through combat damage.",
  targetWinTurn: 6,
  bracket: 3
}
```

Expected:

```ts
{
  gamePlan: {
    commander: "Korvold, Fae-Cursed King",
    primaryObjective: expect.any(String),
    winCondition: "Combat damage through large creatures.",
    targetWinTurn: 6,
    bracket: 3,
    desiredFeatures: expect.arrayContaining([
      "Landfall Trigger",
      "Land Sacrifice",
      "Land Recursion",
      "+1/+1 Counter Payoff",
      "Combat Finisher"
    ]),
    constraints: [],
    rawDescription: expect.any(String)
  },
  clarificationQuestions: [],
  warnings: []
}
```

---

## Test: preserves explicit constraints

Input:

```ts
{
  commander: "Korvold, Fae-Cursed King",
  description: "I want a landfall sacrifice deck that wins through combat.",
  constraints: ["No infinite combos", "Bracket 3 only"]
}
```

Expected:

```ts
{
  gamePlan: expect.objectContaining({
    constraints: ["No infinite combos", "Bracket 3 only"]
  })
}
```

---

## Test: vague description asks clarification

Input:

```ts
{
  commander: "Korvold, Fae-Cursed King",
  description: "I want a fun deck."
}
```

Expected:

```ts
{
  gamePlan: null,
  clarificationQuestions: expect.arrayContaining([
    expect.any(String)
  ])
}
```

---

## Test: invalid bracket fails validation

Input:

```ts
{
  commander: "Korvold, Fae-Cursed King",
  description: "I want to win through landfall.",
  bracket: 10
}
```

Expected:

```ts
Validation error
```

---

# Non-Goals

This feature must not:

* Parse decklists.
* Fetch card data.
* Validate commander legality.
* Analyze whether the deck supports the plan.
* Evaluate commander fit.
* Recommend cards.
* Generate a complete deck.
