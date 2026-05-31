# codex-implementation-plan.md

# Codex Implementation Plan

## Purpose

Define the implementation plan for MTG Deckbuilding Assistant V1.

This document is intended to guide Codex when generating the initial TypeScript project.

The goal is not to build every future feature.

The goal is to implement a working, testable V1 pipeline based on the specification documents.

---

# V1 Product Decision

The V1 entrypoint is a CLI.

The CLI is an adapter.

The CLI is not the product core.

The architecture must remain UI-agnostic.

Future interfaces may include:

* Web UI
* API
* Chat interface
* Agent tool integration

These must reuse the same application use cases.

---

# V1 CLI Goal

The CLI should allow a user to run:

```bash
mtg-assistant analyze \
  --deck ./decks/korvold.txt \
  --goal ./goals/korvold-landfall.txt \
  --commander-preference prefer_current \
  --output ./reports/korvold-analysis.md
```

The command should:

1. Read a Moxfield decklist export.
2. Read a natural-language game plan.
3. Execute the V1 analysis pipeline.
4. Produce structured JSON outputs.
5. Produce a human-readable Markdown report.

---

# Architecture Rule

The CLI must not contain business logic.

The CLI may:

* read files;
* parse command arguments;
* call application use cases;
* write output files;
* format final reports.

The CLI must not:

* classify card features;
* diagnose deck issues;
* recommend cards directly;
* contain deckbuilding heuristics.

---

# Implementation Phases

## Phase 0: Project Setup

Create the TypeScript project.

Required stack:

* TypeScript
* Node.js
* pnpm
* Vitest
* Zod
* ESLint
* Prettier

Recommended commands:

```bash
pnpm install
pnpm test
pnpm lint
pnpm typecheck
```

---

# Phase 1: Shared Domain Models

Implement shared domain models first.

Folder:

```text
/src/shared/domain
```

Required files:

```text
card.ts
deck.ts
feature.ts
featureAssignment.ts
gamePlan.ts
playerPreferences.ts
strategicExpression.ts
commanderFit.ts
communityBaseline.ts
strategicDiagnosis.ts
recommendation.ts
warning.ts
```

Do not implement business logic here unless it is pure domain logic.

---

# Phase 2: Foundation Capabilities

Implement:

```text
01 parseMoxfieldDecklist
02 fetchCardData
03 extractGamePlan
04 classifyCardFeatures
05 analyzeDeckComposition
```

These capabilities produce the factual foundation.

They must be independently testable.

Priority:

1. Parse decklist.
2. Fetch card data.
3. Extract game plan.
4. Classify card features.
5. Analyze deck composition.

---

# Phase 3: Strategic Evidence Capabilities

Implement:

```text
06 evaluateCommanderFit
07 discoverSimilarCommanders
08 analyzeCommunityBaselines
```

These capabilities produce evidence.

They must not diagnose or recommend.

---

# Phase 4: Diagnosis

Implement:

```text
09 buildStrategicDiagnosis
```

This is the first capability allowed to produce strategic conclusions.

It must consume evidence from previous capabilities.

It must not recommend cards or swaps.

---

# Phase 5: Recommendations

Implement:

```text
10 recommendChanges
```

This capability transforms diagnosis into actions.

It may produce:

* strategic recommendations;
* structural recommendations;
* card recommendations;
* swap recommendations;
* commander exploration directions.

Recommendations must be diagnosis-driven.

Cards must not be recommended only because they are popular.

---

# Phase 6: Agent Orchestration

Implement:

```text
11 orchestrateAgentWorkflow
```

The orchestrator coordinates use cases.

It must not duplicate business logic.

It must not bypass Strategic Diagnosis before recommendations.

---

# Phase 7: CLI Adapter

Implement:

```text
/src/cli
```

Suggested files:

```text
cli.ts
commands/analyze.ts
report/writeMarkdownReport.ts
report/writeJsonOutputs.ts
```

The CLI should call the orchestrator or the use cases directly.

---

# V1 Pipeline

The full V1 pipeline is:

```text
parseMoxfieldDecklist
↓
fetchCardData
↓
extractGamePlan
↓
classifyCardFeatures
↓
analyzeDeckComposition
↓
evaluateCommanderFit
↓
discoverSimilarCommanders
↓
analyzeCommunityBaselines
↓
buildStrategicDiagnosis
↓
recommendChanges
↓
write report
```

---

# Initial Implementation Strategy

Codex should implement thin vertical slices.

Recommended order:

## Slice 1

Parse decklist from file and output `ParsedDeck`.

## Slice 2

Fetch or mock card data and output `EnrichedCard[]`.

## Slice 3

Extract game plan into structured `GamePlan`.

## Slice 4

Classify features for a small known card set.

## Slice 5

Generate deck composition.

## Slice 6

Generate commander fit findings.

## Slice 7

Generate strategic expressions from a curated commander dataset.

## Slice 8

Generate community baselines from fixtures.

## Slice 9

Build strategic diagnosis.

## Slice 10

Generate recommendations and Markdown report.

---

# External Data Policy

## Scryfall

Scryfall may be used for card metadata.

Access must go through:

```ts
CardRepository
```

The rest of the system must not depend on raw Scryfall responses.

---

## Community Data

For V1, community data may start as fixtures.

Adapters may be added later for:

* Moxfield
* Archidekt
* EDHREC
* MTGGoldfish

Community data is evidence.

It is not truth.

---

## Commander Options

For V1, use a curated local commander option dataset.

Do not build a complex commander search engine first.

---

# Testing Requirements

Every use case must have unit tests.

Minimum test coverage should include:

* valid input;
* invalid input;
* empty input;
* warnings;
* expected output shape;
* no business logic leakage into adapters.

---

# Required Integration Test

Create at least one end-to-end fixture:

```text
Korvold landfall-sacrifice deck
```

The test should verify:

* decklist is parsed;
* card data is enriched or mocked;
* features are classified;
* composition is generated;
* commander fit findings are produced;
* strategic expressions are produced;
* community baselines are produced from fixtures;
* diagnosis is built;
* recommendations include at least one card-level recommendation.

---

# CLI Output

The CLI should write:

```text
analysis.json
diagnosis.json
recommendations.json
report.md
```

---

# Markdown Report Structure

Recommended structure:

```text
# Deck Analysis Report

## Game Plan

## Deck Composition

## Commander Fit Findings

## Strategic Expressions

## Community Evidence

## Strategic Diagnosis

## Recommended Changes

### Strategic Recommendations

### Structural Recommendations

### Card Recommendations

### Swap Recommendations
```

---

# Non-Negotiable Rules

Codex must not:

* introduce scores;
* introduce confidence labels;
* introduce commander rankings;
* reintroduce StrategicAlignment;
* recommend cards only by popularity;
* put domain logic in CLI;
* put domain logic in infrastructure adapters;
* skip Strategic Diagnosis before recommendations.

---

# Definition of Done

V1 is considered complete when:

* the CLI can run the full pipeline from local files;
* all use cases have unit tests;
* at least one end-to-end fixture passes;
* outputs are generated as JSON and Markdown;
* recommendations are diagnosis-driven;
* the architecture remains UI-agnostic.
