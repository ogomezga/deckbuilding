# architecture.md

# Architecture

## Purpose

This document defines the initial technical architecture for MTG Deckbuilding Assistant.

The architecture supports the product vision defined in `vision.md` and the domain model defined in `domain.md`.

The system should help answer one primary question:

> What changes should move the deck closer to the player's declared game plan?

The architecture must prioritize:

* Clear domain boundaries.
* Simple Clean Architecture.
* Feature-based organization.
* Testable TypeScript use cases.
* Explainable analysis.
* Diagnosis-driven recommendations.
* Extensible AI Skills.
* Minimal complexity in V1.

---

# Architectural Style

The project follows a simple Clean Architecture approach combined with feature folders.

The goal is not to create an overly abstract enterprise architecture.

The goal is to keep the code organized, testable, and easy for an AI coding agent to extend safely.

Each feature may contain its own:

* domain
* application
* infrastructure
* presentation

Shared Magic: The Gathering concepts should live in `shared/domain`.

Feature-specific logic should live inside the corresponding feature folder.

---

# Dependency Rules

Dependencies must point inward.

```text
presentation → application → domain
infrastructure → application/domain
agent → application use cases
```

Rules:

* Domain must not depend on application.
* Domain must not depend on infrastructure.
* Domain must not depend on presentation.
* Domain must not depend on the LLM.
* Application may depend on domain.
* Application should depend on abstractions, not concrete infrastructure.
* Infrastructure implements application/domain ports.
* Presentation validates and maps external input into application input.
* The agent coordinates capabilities but must not contain domain logic.

The LLM layer, API layer, CLI, and Web UI must not contain deckbuilding business logic.

---

# Architectural Principles

## 1. Capabilities First, Agent as Coordinator

The system should be built as a set of deterministic, testable TypeScript capabilities.

Each capability should be an application use case with:

* Explicit input.
* Explicit output.
* Validation.
* Unit tests.
* Clear error handling.

The agent coordinates these capabilities.

The agent must not replace them.

---

## 2. Domain Logic Must Be Separate From the LLM

The LLM should not be responsible for all reasoning.

The system should separate:

* Data parsing.
* Data fetching.
* Intent extraction.
* Feature classification.
* Deck composition analysis.
* Commander fit analysis.
* Commander exploration.
* Community baseline analysis.
* Strategic diagnosis.
* Recommendation generation.
* Natural language explanation.

The LLM may help interpret user intent, orchestrate skills, ask clarifying questions, and explain results.

The core analysis should remain inspectable and testable.

---

## 3. Player Intent Is a First-Class Input

The decklist alone is not enough.

The system must consider:

* Decklist.
* Commander.
* Declared game plan.
* Desired win condition.
* Target speed.
* Power or bracket constraints.
* Player preferences.

The system compares the current deck against the declared intent through diagnosis-driven reasoning.

---

## 4. Commander Is Not Fixed by Default

The selected commander should be evaluated as part of the deck.

The system must be able to identify commander tensions.

However, the system must respect the player's `CommanderPreference`.

If the player marks the commander as fixed, the system may analyze commander fit but must not recommend commander replacement.

---

## 5. Features Are the Core Analytical Unit

The system should reason primarily through atomic features.

Examples:

* Land Recursion
* Sacrifice Outlet
* Sacrifice Payoff
* Landfall Trigger
* Graveyard Enabler
* Token Producer
* Combat Finisher
* Card Advantage Engine
* Mana Acceleration

Strategies and archetypes should emerge from feature combinations.

---

## 6. Community Data Is Evidence, Not Truth

Community deck data may be used to build empirical baselines.

Examples:

* Median density of Land Recursion in similar decks.
* Commonly observed solutions for a strategic feature.
* Typical feature distributions across similar strategies.

Community data must not override the player's game plan.

It should contextualize and support diagnosis.

---

## 7. Diagnosis Before Recommendation

Recommendations must be diagnosis-driven.

Bad:

```text
Deck data
↓
Recommendation
```

Good:

```text
Deck data
↓
Evidence
↓
Strategic Diagnosis
↓
Recommendation
```

The system must not recommend cards only because they are popular.

The system should recommend cards because they solve diagnosed strategic problems.

---

# High-Level System Overview

```text
User
  ↓
Web UI / API / CLI
  ↓
Agent / Orchestration Layer
  ↓
Application Use Cases
  ↓
Domain Layer
  ↓
Infrastructure Adapters
  ↓
External Data Sources
```

---

# Main Layers

## Domain Layer

The Domain Layer contains the core concepts and rules of the system.

It should include:

* Card models.
* Deck models.
* Game Plan models.
* Player Preferences.
* Feature models.
* Feature Assignment models.
* Strategy and Strategic Expression models.
* Commander Fit models.
* Community Baseline models.
* Strategic Diagnosis models.
* Recommendation models.
* Domain policies.
* Domain errors.

The Domain Layer must be framework-agnostic.

It must not import:

* HTTP clients.
* API SDKs.
* Database clients.
* LLM SDKs.
* UI code.
* Environment variables.

---

## Application Layer

The Application Layer contains use cases.

A use case coordinates domain logic and required ports.

Examples:

* Parse a Moxfield decklist.
* Fetch card data.
* Extract a game plan.
* Classify card features.
* Analyze deck composition.
* Evaluate commander fit.
* Discover similar commanders.
* Analyze community baselines.
* Build strategic diagnosis.
* Recommend changes.
* Orchestrate agent workflow.

Use cases should be easy to call from:

* Tests.
* CLI scripts.
* API endpoints.
* Agent tools.
* Future LLM tool-calling interfaces.

---

## Infrastructure Layer

The Infrastructure Layer contains concrete implementations of external dependencies.

Examples:

* Scryfall API adapter.
* Moxfield adapter.
* Archidekt adapter.
* EDHREC adapter.
* MTGGoldfish adapter.
* HTTP client.
* Cache implementation.
* LLM adapter.
* Future persistence adapter.

Infrastructure must not contain domain decisions.

---

## Presentation Layer

The Presentation Layer validates and maps external input.

Examples:

* Zod schemas.
* API request DTOs.
* CLI input parsing.
* LLM tool input schemas.

Presentation should not contain business logic.

---

## Agent / Orchestration Layer

The Agent Layer is part of V1.

Its responsibilities are:

* Understand player intent from natural language.
* Select the appropriate workflow.
* Decide which capabilities to call.
* Pass structured inputs to use cases.
* Ask clarifying questions when required.
* Reuse existing analysis session state.
* Synthesize structured outputs in natural language.

The agent must not:

* Perform deck analysis directly.
* Build strategic diagnosis directly.
* Replace domain logic.
* Fabricate card data.
* Override evidence produced by capabilities.
* Treat community data as truth.
* Generate recommendations without diagnosis.

---

# V1 Capabilities / Use Cases

The V1 system should expose the following capabilities as application use cases:

```text
01 parseMoxfieldDecklist()
02 fetchCardData()
03 extractGamePlan()
04 classifyCardFeatures()
05 analyzeDeckComposition()
06 evaluateCommanderFit()
07 discoverSimilarCommanders()
08 analyzeCommunityBaselines()
09 buildStrategicDiagnosis()
10 recommendChanges()
11 orchestrateAgentWorkflow()
```

Each capability should be independently testable.

---

# Capability Definitions

## 01 parseMoxfieldDecklist()

### Purpose

Convert a raw Moxfield Commander decklist export into structured deck data.

### Input

```ts
{
  rawDecklist: string;
}
```

### Output

```ts
{
  deck: ParsedDeck;
  warnings: ParseDecklistWarning[];
}
```

### Notes

This capability assumes Moxfield export format for V1.

The final blank-line-separated block is interpreted as the commander block.

It does not fetch external card data.

---

## 02 fetchCardData()

### Purpose

Enrich parsed card names with external card metadata.

### Input

```ts
{
  cardNames: string[];
}
```

### Output

```ts
{
  cards: EnrichedCard[];
  notFound: string[];
  warnings: Array<{
    cardName: string;
    reason: string;
  }>;
}
```

### Notes

This capability should be implemented behind a repository or adapter interface.

The first adapter should use Scryfall.

The rest of the system should not depend directly on Scryfall response shapes.

---

## 03 extractGamePlan()

### Purpose

Transform the player's natural language goal into a structured `GamePlan`.

### Input

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

### Output

```ts
{
  gamePlan: GamePlan | null;
  clarificationQuestions: string[];
  warnings: Array<{
    reason: string;
  }>;
}
```

### Notes

This capability may use an LLM in V1.

LLM output must be structured and validated.

---

## 04 classifyCardFeatures()

### Purpose

Assign atomic strategic features to enriched cards.

### Input

```ts
{
  cards: EnrichedCard[];
}
```

### Output

```ts
{
  cardFeatures: CardFeature[];
  warnings: Array<{
    cardName: string;
    reason: string;
  }>;
}
```

### Notes

A deterministic rule-based classifier is required for V1.

An LLM classifier may be added for ambiguous cards, but structured validation is required.

---

## 05 analyzeDeckComposition()

### Purpose

Generate a factual structural representation of the deck.

### Input

```ts
{
  deck: ParsedDeck;
  cards: EnrichedCard[];
  cardFeatures: CardFeature[];
}
```

### Output

```ts
{
  composition: DeckComposition;
  warnings: Warning[];
}
```

### Notes

This capability produces factual composition data.

It must not diagnose problems or recommend changes.

---

## 06 evaluateCommanderFit()

### Purpose

Analyze how the selected commander supports, enables, or conflicts with the player's declared game plan.

### Input

```ts
{
  commander: EnrichedCard;
  commanderFeatures: FeatureAssignment[];
  gamePlan: GamePlan;
  composition: DeckComposition;
}
```

### Output

```ts
{
  commanderFit: CommanderFit;
  warnings: Warning[];
}
```

### Notes

Commander Fit produces structured findings.

It must not produce scores, rankings, assessments, or replacement recommendations.

Player preference affects later exploration and recommendations, not the fit analysis itself.

---

## 07 discoverSimilarCommanders()

### Purpose

Discover alternative strategic expressions of the player's declared game plan and identify commanders that may represent those expressions.

### Input

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

### Output

```ts
{
  strategicExpressions: StrategicExpression[];
  skipped: boolean;
  reason?: string;
  warnings: Warning[];
}
```

### Notes

Discovery starts from the game plan, not from the current commander.

The feature supports exploration.

It must not claim that one commander is objectively better.

It must not produce rankings, scores, confidence labels, or replacement instructions.

---

## 08 analyzeCommunityBaselines()

### Purpose

Analyze community decklists to establish empirical baselines for strategic features, feature packages, and commonly observed solutions.

### Input

```ts
{
  gamePlan: GamePlan;
  deckComposition: DeckComposition;
  strategicExpressions?: StrategicExpression[];
}
```

### Output

```ts
{
  baselineReport: CommunityBaselineReport;
  warnings: Warning[];
}
```

### Notes

Community data is evidence, not truth.

This capability helps estimate feature density baselines and observed solutions.

It must not generate recommendations or diagnoses.

---

## 09 buildStrategicDiagnosis()

### Purpose

Build a strategic diagnosis from all available analysis evidence.

### Input

```ts
{
  gamePlan: GamePlan;
  composition: DeckComposition;
  commanderFit: CommanderFit;
  strategicExpressions: StrategicExpression[];
  communityBaselineReport: CommunityBaselineReport;
}
```

### Output

```ts
{
  diagnosis: StrategicDiagnosis;
  warnings: Warning[];
}
```

### Notes

This is the first capability allowed to emit strategic conclusions.

It identifies feature gaps, surpluses, tensions, commander tensions, community divergences, and power-level concerns.

It must not recommend cards or commander changes.

---

## 10 recommendChanges()

### Purpose

Generate actionable deck improvements from a completed Strategic Diagnosis.

### Input

```ts
{
  gamePlan: GamePlan;
  diagnosis: StrategicDiagnosis;
  composition: DeckComposition;
  commanderPreference: CommanderPreference;
  communityBaselineReport: CommunityBaselineReport;
}
```

### Output

```ts
{
  recommendations: Recommendation[];
  warnings: Warning[];
}
```

### Notes

Recommendations must be diagnosis-driven.

This capability may generate:

* Strategic recommendations.
* Structural recommendations.
* Card recommendations.
* Swap recommendations.
* Commander exploration directions.

It must not recommend cards solely because they are popular.

---

## 11 orchestrateAgentWorkflow()

### Purpose

Coordinate capabilities according to the user's request and current analysis session state.

### Input

```ts
{
  userMessage: string;
  session: AnalysisSession;
}
```

### Output

```ts
{
  session: AnalysisSession;
  response: string;
  executedCapabilities: string[];
  warnings: Warning[];
}
```

### Notes

The agent coordinates capabilities.

It does not perform deck analysis, diagnosis, or recommendation logic directly.

---

# Recommended Project Structure

```text
/src
  /shared
    /domain
      card.ts
      deck.ts
      feature.ts
      featureAssignment.ts
      gamePlan.ts
      playerPreferences.ts
      strategy.ts
      strategicExpression.ts
      commander.ts
      commanderFit.ts
      communityBaseline.ts
      strategicDiagnosis.ts
      recommendation.ts
      warning.ts

    /application
      result.ts
      errors.ts

    /infrastructure
      httpClient.ts

  /agent
    agentOrchestrator.ts
    analysisSession.ts
    workflowSelector.ts
    responseSynthesizer.ts

  /features
    /parse-decklist
      /domain
      /application
        parseMoxfieldDecklist.usecase.ts
      /presentation
        parseMoxfieldDecklist.schema.ts
      index.ts

    /fetch-card-data
      /domain
        cardRepository.ts
      /application
        fetchCardData.usecase.ts
      /infrastructure
        scryfallCardRepository.ts
        scryfallCardMapper.ts
      /presentation
        fetchCardData.schema.ts
      index.ts

    /extract-game-plan
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

    /classify-card-features
      /domain
        featureClassifier.ts
        featureVocabulary.ts
      /application
        classifyCardFeatures.usecase.ts
      /infrastructure
        ruleBasedFeatureClassifier.ts
        llmFeatureClassifier.ts
      /presentation
        classifyCardFeatures.schema.ts
      index.ts

    /analyze-deck-composition
      /domain
        deckComposition.ts
        manaCurve.ts
        featureDensity.ts
        featureContributionSummary.ts
        deckFact.ts
      /application
        analyzeDeckComposition.usecase.ts
      /presentation
        analyzeDeckComposition.schema.ts
      index.ts

    /evaluate-commander-fit
      /domain
        commanderFit.ts
        commanderFitFinding.ts
      /application
        evaluateCommanderFit.usecase.ts
      /presentation
        evaluateCommanderFit.schema.ts
      index.ts

    /discover-similar-commanders
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

    /analyze-community-baselines
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

    /build-strategic-diagnosis
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

    /recommend-changes
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

# Shared Domain Models

Shared domain models should be used across features.

Example:

```ts
export type EnrichedCard = {
  name: string;
  manaValue: number;
  colors: Color[];
  colorIdentity: Color[];
  typeLine: string;
  oracleText: string;
  legalities: Record<string, string>;
  keywords: string[];
};
```

Example:

```ts
export type DesiredFeature = {
  feature: FeatureName;
  role: "primary" | "supporting" | "optional";
};
```

Example:

```ts
export type GamePlan = {
  commander: string;
  primaryObjective: string;
  winCondition: string;
  targetWinTurn?: number;
  bracket?: number;
  desiredFeatures: DesiredFeature[];
  constraints: string[];
  preferences?: PlayerPreferences;
  rawDescription: string;
};
```

Example:

```ts
export type PlayerPreferences = {
  commanderPreference: CommanderPreference;
};
```

Example:

```ts
export type CardFeature = {
  cardName: string;
  features: FeatureAssignment[];
};
```

Example:

```ts
export type FeatureAssignment = {
  name: FeatureName;
  role: FeatureContributionRole;
  magnitude?: FeatureMagnitude;
  evidence: string;
};
```

---

# Ports and Adapters

External systems must be accessed through ports.

Example:

```ts
export interface CardRepository {
  findByNames(names: string[]): Promise<CardRepositoryResult>;
}
```

Scryfall should implement this interface:

```ts
export class ScryfallCardRepository implements CardRepository {
  async findByNames(names: string[]): Promise<CardRepositoryResult> {
    // Fetch and normalize Scryfall data here.
  }
}
```

Community deck sources should also be accessed through ports.

Example:

```ts
export interface CommunityDeckRepository {
  findSimilarDecks(
    criteria: SimilarDeckCriteria
  ): Promise<CommunityDeck[]>;
}
```

Commander option discovery should be accessed through ports.

Example:

```ts
export interface CommanderOptionRepository {
  findOptions(
    input: FindCommanderOptionsInput
  ): Promise<CommanderOptionSource[]>;
}
```

The use cases depend on interfaces, not concrete adapters.

---

# Data Sources

## Card Metadata

Initial source:

* Scryfall

The adapter should normalize external card data into internal domain models.

The rest of the application should not depend on raw external API responses.

---

## Community Deck Evidence

V1 may use community data through adapters.

Potential sources:

* EDHREC
* Moxfield
* Archidekt
* MTGGoldfish

Community data should be treated as supporting evidence, not as the source of truth.

Community data is used to build baselines and observed solutions, not to blindly copy popular decklists.

---

## Commander Option Dataset

V1 should support a curated local commander option dataset.

This dataset can be expanded later using:

* Scryfall searches.
* Manual curation.
* Community deck data.
* LLM-assisted classification.

---

# Recommended Technology Stack

## Language

TypeScript

## Runtime

Node.js

## Package Manager

pnpm

## Validation

Zod

## Testing

Vitest

## HTTP Client

Native fetch or a lightweight HTTP client.

## LLM Integration

LLM integration is required in V1 as an orchestration and explanation layer.

LLM integration may also be used for:

* Game Plan extraction.
* Ambiguous feature classification.
* Response synthesis.

The LLM must not own core domain logic.

---

# V1 Execution Flow

```text
1. User submits commander, decklist, and game plan.
2. parseMoxfieldDecklist() converts the decklist into structured deck data.
3. fetchCardData() enriches cards with metadata.
4. extractGamePlan() creates a structured game plan.
5. classifyCardFeatures() assigns features to cards.
6. analyzeDeckComposition() summarizes the deck.
7. evaluateCommanderFit() analyzes commander contribution.
8. discoverSimilarCommanders() explores strategic expressions when allowed.
9. analyzeCommunityBaselines() gathers empirical community evidence.
10. buildStrategicDiagnosis() diagnoses strategic issues.
11. recommendChanges() generates actionable improvements.
12. orchestrateAgentWorkflow() coordinates the workflow and synthesizes the response.
```

---

# V1 Output Shape

The system should return structured analysis, diagnosis, and recommendations.

Example:

```ts
{
  summary: {
    commander: "Korvold, Fae-Cursed King",
    gamePlan: "Land sacrifice and landfall combat pressure"
  },

  composition: {
    featureDensity: {
      "Land Recursion": 2,
      "Land Sacrifice": 8,
      "Landfall Trigger": 12
    }
  },

  commanderFit: {
    commander: "Korvold, Fae-Cursed King",
    supportingFeatures: [
      {
        feature: "Sacrifice Payoff",
        evidence: [
          "Commander rewards sacrificing permanents."
        ]
      }
    ],
    unsupportedFeatures: [
      {
        feature: "Land Recursion",
        reason: "Commander does not directly recur lands."
      }
    ]
  },

  strategicExpressions: [
    {
      name: "Land Recursion Focus",
      emphasizedFeatures: [
        "Land Recursion",
        "Land Sacrifice"
      ]
    }
  ],

  communityBaselineReport: {
    featureBaselines: [
      {
        feature: "Land Recursion",
        medianDensity: 5,
        lowerQuartile: 4,
        upperQuartile: 7
      }
    ],
    observedSolutions: [
      {
        feature: "Land Recursion",
        cards: [
          "Life from the Loam",
          "Ramunap Excavator",
          "Crucible of Worlds"
        ]
      }
    ]
  },

  diagnosis: {
    featureGaps: [
      {
        feature: "Land Recursion",
        role: "primary",
        currentDensity: 2,
        communityMedian: 5
      }
    ]
  },

  recommendations: [
    {
      priority: "high",
      strategicRecommendation: {
        title: "Increase Land Recursion support"
      },
      structuralRecommendation: {
        title: "Increase Land Recursion density",
        targetState: "Approximately 5 supporting cards"
      },
      cardRecommendations: [
        {
          cardName: "Life from the Loam",
          supportedFeatures: [
            "Land Recursion"
          ],
          source: "diagnosis_resolution"
        }
      ]
    }
  ]
}
```

---

# Testing Strategy

Each use case should have unit tests.

Initial test focus:

* Moxfield decklist parsing.
* Card data normalization.
* Rule-based feature classification.
* Deck composition metrics.
* Commander fit findings.
* Strategic expression discovery.
* Community baseline calculations.
* Strategic diagnosis generation.
* Recommendation generation.
* Agent workflow selection.

Infrastructure adapters should be tested separately from domain and application logic.

External API calls should be mocked in unit tests.

---

# What V1 Should Not Do

V1 should not:

* Build complete optimized decks from scratch.
* Depend entirely on an LLM.
* Use complex embeddings or clustering.
* Claim objective deckbuilding truth.
* Optimize purely for popularity.
* Hide reasoning from the user.
* Mix infrastructure logic into domain or application code.
* Treat community data as authoritative truth.
* Generate full decklists.
* Produce commander rankings.
* Produce scores.

---

# Future Extensions

Possible future capabilities:

* Larger card-level recommendation engine.
* More advanced card substitution evaluation.
* Strategy similarity search using embeddings.
* Larger commander option index.
* User preference memory.
* Web UI with guided game plan builder.
* Side-by-side commander comparison.
* Full deck generation.
* Play pattern simulation.

These should not block V1.
