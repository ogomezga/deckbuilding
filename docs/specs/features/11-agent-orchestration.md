# Feature: Agent Orchestration

## Purpose

Coordinate domain capabilities to analyze Commander decks and provide explainable deckbuilding guidance.

The agent is responsible for:

* Understanding player intent.
* Selecting the appropriate workflow.
* Managing analysis state.
* Executing capabilities.
* Synthesizing results.

The agent is not responsible for:

* Performing strategic analysis.
* Diagnosing deck problems.
* Generating deckbuilding heuristics.
* Replacing domain capabilities.

Those responsibilities belong to specialized capabilities.

---

# Core Principle

The agent is not the analyst.

The agent is the coordinator.

Bad:

```text
User
↓
LLM
↓
Opinion
```

Good:

```text
User
↓
Agent
↓
Capabilities
↓
Evidence
↓
Diagnosis
↓
Recommendations
↓
Response
```

The agent should never bypass capability outputs.

---

# Responsibilities

The agent has five responsibilities.

---

## 1. Intent Understanding

Determine what the player wants.

Examples:

```text
Analyze my deck.
```

```text
What is my deck trying to do?
```

```text
Does this commander fit the strategy?
```

```text
Show me alternative commanders.
```

```text
How can I improve this deck?
```

The agent may use an LLM to interpret natural language.

The resulting intent must be converted into structured inputs for capabilities.

---

## 2. Workflow Selection

Select the smallest workflow capable of answering the player's question.

The agent should avoid unnecessary capability execution.

Example:

User:

```text
Show me similar commanders.
```

Do not execute:

```text
Full Deck Analysis
```

Execute:

```text
Game Plan Extraction
↓
Discover Similar Commanders
```

when possible.

---

## 3. Capability Orchestration

Execute capabilities in dependency order.

Capabilities may only execute when their required inputs exist.

The agent must respect capability boundaries.

The agent must not:

* recreate capability logic;
* duplicate analysis;
* infer missing outputs.

---

## 4. Session Management

Maintain analysis state across the conversation.

The agent should reuse existing capability outputs whenever possible.

Previously generated evidence should remain available during the session.

---

## 5. Response Synthesis

Transform structured outputs into human-readable explanations.

The agent should explain:

* observations;
* findings;
* diagnosis;
* recommendations;
* tradeoffs.

The agent should not expose raw internal models unless requested.

---

# Capability Pipeline

The complete analysis pipeline is:

```text
Parse Decklist
↓
Fetch Card Data
↓
Extract Game Plan
↓
Classify Card Features
↓
Analyze Deck Composition
↓
Evaluate Commander Fit
↓
Discover Similar Commanders
↓
Analyze Community Baselines
↓
Build Strategic Diagnosis
↓
Recommend Changes
```

---

# Capability Roles

## Analysis Capabilities

Produce evidence.

```text
Parse Decklist

Fetch Card Data

Extract Game Plan

Classify Card Features

Analyze Deck Composition

Evaluate Commander Fit

Discover Similar Commanders

Analyze Community Baselines
```

These capabilities do not recommend changes.

---

## Diagnosis Capability

Produces conclusions.

```text
Build Strategic Diagnosis
```

This capability interprets evidence.

It is the only capability allowed to diagnose problems.

---

## Recommendation Capability

Produces actions.

```text
Recommend Changes
```

This capability transforms diagnosis into deckbuilding actions.

---

# Critical Rule

The agent must never skip Strategic Diagnosis.

Bad:

```text
Evidence
↓
Recommendations
```

Good:

```text
Evidence
↓
Strategic Diagnosis
↓
Recommendations
```

All recommendations must be diagnosis-driven.

---

# Analysis Session

The agent should maintain analysis state.

```ts
export type AnalysisSession = {
  deck?: ParsedDeck;

  cards?: EnrichedCard[];

  gamePlan?: GamePlan;

  cardFeatures?: CardFeature[];

  composition?: DeckComposition;

  commanderFit?: CommanderFit;

  strategicExpressions?: StrategicExpression[];

  communityBaselineReport?: CommunityBaselineReport;

  diagnosis?: StrategicDiagnosis;

  recommendations?: Recommendation[];
};
```

---

# Session Reuse

The agent should avoid recomputation.

Example:

User:

```text
Show me other commanders.
```

If:

```text
gamePlan
```

already exists:

```text
Reuse Game Plan
↓
Run Discover Similar Commanders
```

instead of restarting the analysis.

---

# Workflow Modes

## Full Analysis

Purpose:

```text
Comprehensive deck evaluation.
```

Execution:

```text
Parse Decklist
↓
Fetch Card Data
↓
Extract Game Plan
↓
Classify Card Features
↓
Analyze Deck Composition
↓
Evaluate Commander Fit
↓
Discover Similar Commanders
↓
Analyze Community Baselines
↓
Build Strategic Diagnosis
↓
Recommend Changes
```

---

## Commander Exploration

Purpose:

```text
Explore alternative strategic expressions.
```

Execution:

```text
Extract Game Plan
↓
Discover Similar Commanders
```

---

## Community Analysis

Purpose:

```text
Understand how similar strategies are built.
```

Execution:

```text
Analyze Community Baselines
```

---

## Diagnosis Mode

Purpose:

```text
Understand strategic problems.
```

Execution:

```text
Analyze Deck Composition
↓
Evaluate Commander Fit
↓
Analyze Community Baselines
↓
Build Strategic Diagnosis
```

---

## Recommendation Mode

Purpose:

```text
Generate actionable improvements.
```

Execution:

```text
Build Strategic Diagnosis
↓
Recommend Changes
```

---

# Clarification Strategy

The agent should request clarification when critical information is missing.

Examples:

## Missing Decklist

Ask for:

```text
Decklist
```

---

## Missing Game Plan

Ask:

```text
What is the deck trying to accomplish?
```

or

```text
Attempt Extract Game Plan
```

if sufficient information exists.

---

## Ambiguous Commander Preference

Ask whether:

```text
Commander is fixed
```

or

```text
Commander may be changed
```

if recommendations depend on that distinction.

---

# Commander Preference Handling

The agent must respect:

```ts
CommanderPreference =
  | "fixed"
  | "prefer_current"
  | "open";
```

---

## fixed

The agent must not:

* recommend commander replacements;
* explore commander alternatives;
* suggest changing commander identity.

Recommendations should focus on the 99 cards.

---

## prefer_current

The agent may:

* explore alternatives;
* compare strategic tradeoffs;

while treating the current commander as the default solution.

---

## open

The agent may:

* freely explore strategic expressions;
* compare alternative commanders;
* recommend commander directions.

---

# Uncertainty Handling

The system should communicate uncertainty explicitly.

Examples:

```text
Insufficient community data.
```

```text
Game plan unclear.
```

```text
Observed pattern is weak.
```

The agent must not invent evidence.

---

# Response Structure

Recommended response order:

```text
1. Strategic Summary

2. Key Findings

3. Strategic Diagnosis

4. Recommendations

5. Tradeoffs

6. Next Steps
```

---

# Example Response

```text
Strategic Summary

The deck appears to pursue a Landfall and Land Recursion game plan.

Key Findings

- Strong Landfall density.
- Strong sacrifice infrastructure.
- Low Land Recursion density.

Strategic Diagnosis

Land Recursion is a primary feature gap.

The commander supports sacrifice payoffs but does not directly support recurring lands.

Recommendations

Increase Land Recursion support.

Potential additions:

- Life from the Loam
- Ramunap Excavator
- Crucible of Worlds

Potential swap:

OUT:
Hedron Archive

IN:
Life from the Loam

Tradeoffs

This change improves recursion at the cost of excess mana acceleration.
```

---

# Acceptance Criteria

The agent must:

* understand player intent;
* select workflows;
* orchestrate capabilities;
* manage session state;
* reuse capability outputs;
* respect commander preferences;
* communicate uncertainty;
* synthesize evidence-based responses;
* enforce diagnosis-driven recommendations.

The agent must not:

* duplicate capability logic;
* perform strategic analysis itself;
* bypass Strategic Diagnosis;
* generate unsupported conclusions;
* treat popularity as truth;
* ignore player intent.

---

# Non-Goals

The agent must not:

* become a deckbuilding engine;
* replace capabilities;
* contain hidden strategy heuristics;
* produce recommendations without diagnosis.

The agent coordinates.

Capabilities analyze.

Diagnosis concludes.

Recommendations propose actions.