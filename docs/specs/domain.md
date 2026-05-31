# Domain Model

## Purpose

This document defines the conceptual model used by MTG Deckbuilding Assistant.

The system is not designed around commanders, decklists, or card popularity.

The system is designed around player intent, strategic features, and game plan alignment.

The primary question is:

> Is the current deck aligned with the game plan the player wants to achieve?

All domain concepts exist to answer that question.

---

# Core Domain Hierarchy

The domain is organized around the following hierarchy:

```text
Player Intent
    ↓
Game Plan
    ↓
Features
    ↓
Strategies
    ↓
Commanders
    ↓
Deck
    ↓
Cards
```

This hierarchy is intentional.

The commander is not the source of truth.

The player's desired outcome is the source of truth.

---

# Player Intent

## Definition

The desired gameplay experience and outcome defined by the player.

Intent represents what the player wants the deck to accomplish.

Examples:

* Win through combat damage.
* Generate explosive turns.
* Play a long value game.
* Create sacrifice loops.
* Win around turn 6.
* Remain within Bracket 3.
* Avoid infinite combos.
* Prioritize resilience over speed.

Intent is subjective.

Intent may be incomplete.

Intent may evolve over time.

The system should help clarify intent when necessary.

---

# Game Plan

## Definition

The operational plan used to transform intent into victory.

A Game Plan describes how the deck expects to win.

Examples:

* Generate repeated landfall triggers.
* Grow creatures through sacrifice effects.
* Accumulate overwhelming board presence.
* Convert graveyard recursion into resource advantage.

A Game Plan is more specific than Intent.

A Game Plan can be decomposed into Features.

---

# Player Preferences

Not all players approach deckbuilding with the same constraints.

Some players want to optimize a specific commander.

Others are willing to explore alternative commanders if they better support the desired strategy.

Player preferences influence how recommendations are generated and how commander discovery behaves.

These preferences do not change the deck's characteristics.

They only affect which solutions the system is allowed to explore.

---

## Commander Preference

Commander preference determines whether the current commander is considered fixed or open to exploration.

```ts
export type CommanderPreference =
  | "fixed"
  | "prefer_current"
  | "open";
```

### fixed

The current commander is treated as a hard constraint.

The system may:

* Analyze commander fit.
* Recommend changes to the 99 cards.
* Evaluate alignment.

The system must not:

* Suggest alternative commanders.
* Generate commander replacement recommendations.

Example:

```text
I want to improve my Korvold deck.
Korvold is non-negotiable.
```

---

### prefer_current

The current commander is preferred.

The system may:

* Analyze alternative commanders.
* Present alternative strategic approaches.
* Compare tradeoffs.

The current commander should remain the default recommendation unless a significantly different strategic approach is discovered.

This is the recommended default mode.

Example:

```text
I like Korvold, but I am interested in seeing other commanders that support this strategy.
```

---

### open

The current commander is treated as one possible solution among many.

The system may:

* Explore commanders outside the current color identity.
* Present alternative strategic approaches.
* Compare commanders freely.

The system should prioritize game-plan fit over commander loyalty.

Example:

```text
I care about the strategy, not the commander.
Show me the best candidates for this game plan.
```

---

## PlayerPreferences

```ts
export type PlayerPreferences = {
  commanderPreference: CommanderPreference;
};
```

---

## Integration with GamePlan

Player preferences should travel with the declared game plan.

```ts
export type DesiredFeature = {
  feature: FeatureName;
  role: "primary" | "supporting" | "optional";
};

export type GamePlan = {
  commander: string;

  primaryObjective: string;

  winCondition: string;

  targetWinTurn?: number;

  bracket?: number;

  desiredFeatures: DesiredFeature[];

  constraints: string[];

  preferences?: PlayerPreferences;
};
```

---

## Domain Rules

Player preferences affect:

* Discover Similar Commanders
* Recommend Changes
* Agent Orchestration

Player preferences do not affect:

* Card Feature Classification
* Deck Composition Analysis
* Strategic Alignment
* Commander Fit Evaluation

These analyses should remain objective and independent of user preference.

---

# Feature

## Definition

The smallest strategic unit recognized by the system.

Features are atomic capabilities, behaviors, or mechanisms.

Features are the foundation of all analysis.

Examples:

* Land Recursion
* Landfall Trigger
* Sacrifice Outlet
* Sacrifice Payoff
* Graveyard Enabler
* Token Production
* Token Payoff
* Combat Amplification
* Card Advantage Engine
* Mana Acceleration
* Permanent Recursion
* ETB Abuse
* Creature Reanimation

Features are preferred over archetypes because they are more flexible and composable.

A deck may contain dozens of features.

A single card may contribute to multiple features.

Example:

A fetchland contributes to:

* Landfall Trigger
* Sacrifice Trigger
* Deck Thinning

---

# Strategy

## Definition

A recurring combination of Features.

Strategies emerge from Feature interactions.

Strategies are not fundamental entities.

Strategies are derived entities.

Examples:

Landfall:

* Landfall Trigger
* Land Recursion
* Extra Land Drops

Aristocrats:

* Sacrifice Outlet
* Sacrifice Payoff
* Token Production

Reanimator:

* Graveyard Enabler
* Reanimation
* Value Creatures

A Strategy exists because a group of Features frequently appears together.

---

# Strategic Angle

## Definition

A strategic angle is a high-level expression of a game plan.

Strategic Angles emerge from combinations of Features.

Examples:

* Land Recursion Focus
* Sacrifice Value
* Combat Scaling
* Graveyard Value
* Token Swarm
* Control Attrition

Strategic Angles are used to:

* Compare commanders.
* Group similar decks.
* Discover alternative approaches.

Strategic Angles are more specific than broad archetypes and more abstract than individual Features.

---

# Commander

## Definition

A strategic enabler.

The commander is not assumed to be optimal.

The commander is evaluated according to how well it supports the desired Game Plan.

Examples:

Korvold may enable:

* Sacrifice Payoff
* Card Advantage Engine

Lord Windgrace may enable:

* Land Recursion
* Land Value Generation

The system must remain commander-agnostic.

The player’s objective is more important than the selected commander.

---

# Deck

## Definition

The concrete implementation of a Game Plan.

A deck is evaluated according to:

* Feature Coverage
* Feature Density
* Feature Efficiency
* Feature Synergy
* Alignment with Game Plan

The deck is not evaluated based solely on popularity.

---

# Card

## Definition

A card is a source of Features.

Cards are not evaluated in isolation.

Cards are evaluated according to:

* Supported Features
* Strategic Contribution
* Efficiency
* Synergy
* Opportunity Cost

The same card may have different value depending on context.

---

# Feature Density

## Definition

The concentration of cards supporting a Feature.

Example:

Feature:
Land Recursion

Supporting Cards:

* Life from the Loam
* Crucible of Worlds
* Splendid Reclamation

A higher density generally increases consistency.

---

# Feature Coverage

## Definition

The percentage of Game Plan requirements currently supported by the deck.

Example:

Desired Features:

* Land Recursion
* Landfall
* Sacrifice Payoffs
* Combat Finishers

Coverage Score:

75%

The deck lacks sufficient combat finishers.

---

# Feature Synergy

## Definition

The degree to which Features reinforce one another.

Example:

Landfall
+
Land Recursion
+
Extra Land Drops

creates strong synergy.

Feature Synergy is more important than individual card strength.

---

# Strategic Alignment

## Definition

The degree to which a deck supports its declared Game Plan.

This is the primary evaluation metric of the system.

Examples:

A deck may contain powerful cards but still have poor alignment.

A deck may contain lower-power cards but excellent alignment.

Alignment is more important than raw card quality.

---

# Commander Fit

## Definition

The degree to which a commander supports the desired Game Plan.

The commander should be evaluated like any other strategic component.

The system may conclude that an alternative commander provides better alignment.

This is not considered an error.

This is a valid recommendation.

---

# Recommendation

## Definition

A proposed change intended to improve Strategic Alignment.

Recommendations are generated after analysis.

Recommendations are evidence-driven and explainable.

Recommendations may operate at multiple levels:

### Strategic

Examples:

* Increase Land Recursion support.
* Improve sacrifice infrastructure.
* Strengthen combat finishing capability.

### Structural

Examples:

* Increase feature density.
* Reduce average mana value.
* Improve consistency.

### Tactical

Reserved for future versions.

Examples:

* Add a specific card.
* Remove a specific card.
* Replace a commander.

The system should prefer strategic and structural recommendations before tactical recommendations.

---

# Community Evidence

## Definition

Empirical observations derived from community decklists.

Community Evidence is used to:

* Validate assumptions.
* Establish feature density baselines.
* Identify common strategic patterns.

Community Evidence is informative but not authoritative.

The system should treat community data as evidence rather than truth.

Examples:

* Median Land Recursion density.
* Commonly observed support packages.
* Typical feature distributions.

Community Evidence should never override Strategic Alignment.

---

# Non-Goals

The system is NOT intended to:

* Replicate EDHREC rankings.
* Recommend the most popular cards.
* Force optimization at all costs.
* Assume the commander is correct.
* Replace player creativity.

The goal is understanding and alignment.

Not imitation.
