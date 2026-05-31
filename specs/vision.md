# MTG Deckbuilding Assistant

## Vision

MTG Deckbuilding Assistant is an AI-powered Commander deckbuilding companion designed to help players understand, analyze, and improve their decks.

The goal is not to replicate existing recommendation websites.

The goal is to provide strategic insights and uncover meaningful connections between cards, commanders, archetypes, and deckbuilding decisions.

The system should help players become better deckbuilders rather than simply copying existing decklists.

---

# Problem Statement

Many Commander players understand individual cards and interactions but struggle to evaluate an entire deck as a cohesive system.

Current tools often focus on commander-centric recommendations:

* "Players of this commander also play these cards."
* "Most common cards for this commander."
* "Top cards for this commander."

While useful, this approach has important limitations.

It assumes that the commander is the primary source of information.

In reality, many successful Commander decks share strategic identities across multiple commanders.

A player piloting Korvold, Fae-Cursed King may benefit from ideas discovered in Lord Windgrace, The Gitrog Monster, Titania, Protector of Argoth, or other land-focused archetypes.

The assistant should help surface those connections.

---

# Core Philosophy

The assistant should reason about strategies rather than commanders.

Commanders are considered manifestations of strategic patterns.

Strategies are considered first-class entities.

Examples:

* Landfall
* Lands Matter
* Aristocrats
* Reanimator
* Tokens
* Stax
* Blink
* Voltron

A commander may belong to multiple strategic patterns simultaneously.

Recommendations should emerge from strategic similarity rather than commander popularity alone.

---

# Design Principles

## Strategy First

The system must avoid commander-only reasoning whenever possible.

Recommendations should be generated from shared strategic characteristics.

---

## Feature-Based Reasoning

Recommendations improve when working with features rather than entities.

Instead of asking:

"What cards are played in Korvold decks?"

The system should ask:

"What cards are commonly found in decks that exhibit similar strategic characteristics?"

Examples of characteristics:

* Sacrifices lands
* Recurs lands from graveyard
* Generates value from landfall
* Uses graveyard as a resource
* Creates sacrifice loops
* Generates incremental card advantage

These characteristics are more informative than the commander identity itself.

---

### Atomic Features

The fundamental unit of reasoning in the system is the strategic feature.

Examples:

- Land Recursion
- Land Sacrifice
- Landfall Trigger
- Token Producer
- Sacrifice Outlet
- Combat Finisher
- Card Advantage Engine

Strategies emerge from combinations of features.

The system should primarily reason about feature relationships rather than archetype labels alone.

---

## Explainability

Every recommendation should include reasoning.

The assistant should explain:

* Why a card is suggested
* Which strategy it supports
* Which patterns were detected
* Which comparable decks influenced the recommendation

---

## Learning-Oriented

The goal is not merely to optimize a deck.

The goal is to help the player understand deckbuilding concepts.

The assistant should act as a teacher, not only as a recommendation engine.

---

## Commander Agnosticism

The system must not assume that the selected commander is the optimal choice for the declared game plan.

Commanders are evaluated as strategic enablers rather than fixed requirements.

When appropriate, the assistant may recommend alternative commanders that better align with the player's stated objectives, desired play patterns, power constraints, and expected win conditions.

The player's goals take precedence over commander identity.

---

## Strategic Alignment

The central question of the system is:

"Is the current deck aligned with the game plan the player wants to execute?"

The assistant should compare:

- Declared game plan
- Strategic features
- Deck composition
- Commander capabilities

and identify:

- strengths
- weaknesses
- tensions
- opportunities for improvement

before generating recommendations.

Recommendations are a consequence of analysis.

Analysis comes first.

---

# Initial Scope (V1)

The first version should focus on Commander format only.

The system should be capable of:

1. Parsing decklists.
2. Fetching card information.
3. Analyzing deck composition.
4. Detecting strategic characteristics.
5. Identifying similar strategies.
6. Generating explainable recommendations.

The system is not expected to build perfect decks.

The system is expected to produce useful insights and explanations.

---

# Success Criteria

A successful recommendation is not necessarily one that appears in the most decklists.

A successful recommendation is one that helps the player understand:

* Why a card belongs in the deck.
* Which strategic role it fulfills.
* How it connects to the broader game plan.

The assistant succeeds when it helps players:

- Understand their deck.
- Understand their game plan.
- Identify strategic gaps.
- Evaluate commander fit.
- Explore alternative approaches.
- Make informed deckbuilding decisions.
