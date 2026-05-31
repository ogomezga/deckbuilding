# Feature: Fetch Card Data

## Purpose

Fetch and normalize Magic: The Gathering card metadata for parsed deck cards.

This feature enriches card names with structured card data required by later analysis features.

The first implementation should use Scryfall as the external card data source, but the rest of the application must not depend on raw Scryfall response shapes.

---

# User Story

As the assistant, I need reliable card metadata so that I can analyze card types, colors, mana values, oracle text, legality, and strategic behavior.

---

# Input

```ts
{
  cardNames: string[]
}
```

Example:

```ts
{
  cardNames: [
    "Korvold, Fae-Cursed King",
    "Fabled Passage",
    "Sol Ring",
    "Mountain"
  ]
}
```

---

# Output

```ts
{
  cards: EnrichedCard[]
  notFound: string[]
  warnings: Array<{
    cardName: string
    reason: string
  }>
}
```

Example:

```ts
{
  cards: [
    {
      name: "Korvold, Fae-Cursed King",
      manaValue: 5,
      colors: ["B", "R", "G"],
      colorIdentity: ["B", "R", "G"],
      typeLine: "Legendary Creature — Dragon Noble",
      oracleText: "Flying\nWhenever Korvold, Fae-Cursed King enters the battlefield or attacks, sacrifice another permanent.\nWhenever you sacrifice a permanent, put a +1/+1 counter on Korvold and draw a card.",
      legalities: {
        commander: "legal"
      },
      keywords: ["Flying"]
    }
  ],
  notFound: [],
  warnings: []
}
```

---

# Domain Model

Use the shared domain model:

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

```ts
export type Color = "W" | "U" | "B" | "R" | "G";
```

For colorless cards:

```ts
colors: []
colorIdentity: []
```

---

## Commander Support

Commanders are fetched using the same infrastructure as regular cards.

No special commander endpoint exists.

Later features may derive commander capabilities and commander features from the fetched card metadata.

This feature is responsible only for retrieving normalized card information.

---

# Port

The application layer must depend on a card repository port.

```ts
export interface CardRepository {
  findByNames(names: string[]): Promise<CardRepositoryResult>;
}
```

```ts
export type CardRepositoryResult = {
  cards: EnrichedCard[];
  notFound: string[];
  warnings: Array<{
    cardName: string;
    reason: string;
  }>;
};
```

---

# Adapter

The initial infrastructure adapter should be:

```ts
ScryfallCardRepository
```

It implements:

```ts
CardRepository
```

The adapter is responsible for:

* Calling Scryfall.
* Handling HTTP errors.
* Mapping Scryfall fields to `EnrichedCard`.
* Handling cards not found.
* Returning normalized results.

---

# Scryfall Mapping

The adapter should map Scryfall data as follows:

```ts
EnrichedCard.name = scryfall.name
EnrichedCard.manaValue = scryfall.cmc
EnrichedCard.colors = scryfall.colors ?? []
EnrichedCard.colorIdentity = scryfall.color_identity ?? []
EnrichedCard.typeLine = scryfall.type_line
EnrichedCard.oracleText = scryfall.oracle_text
EnrichedCard.legalities = scryfall.legalities
EnrichedCard.keywords = scryfall.keywords ?? []
```

---

# Double-Faced / Multi-Faced Cards

Some cards may not have top-level `oracle_text`.

For multi-faced cards, the adapter should combine face text.

Suggested behavior:

```ts
oracleText = card_faces.map(face => face.oracle_text).join("\n---\n")
```

If face names exist, include them in the text:

```text
Face A:
...

---
Face B:
...
```

The normalized card name must always remain the canonical Scryfall card name.

Individual face names must never replace the canonical card name.

---

# Fetching Strategy

For V1, the adapter may fetch cards one by one using Scryfall's named card endpoint.

The use case should deduplicate names before fetching.

Repeated basic lands should only be fetched once.

Normalization should preserve card casing.

Card names should be compared case-insensitively for deduplication purposes.

Example:

```ts
["Mountain", "Mountain", "Sol Ring"]
```

should fetch:

```ts
["Mountain", "Sol Ring"]
```

Batch fetching may be added later.

---

# Input Rules

* Empty `cardNames` should return a validation error.
* Duplicate names should be deduplicated before fetching.
* Card names should be trimmed.
* Empty names should be ignored with a warning.

---

# Error Handling

## Not Found

If a card cannot be found, it should be listed in `notFound`.

The feature should not fail the entire operation because one card is missing.

## HTTP Errors

Transient HTTP errors should return a recoverable infrastructure error.

## Invalid API Response

Unexpected Scryfall responses should return an infrastructure warning or error.

---

# Acceptance Criteria

* Fetches card metadata by name.
* Deduplicates card names before fetching.
* Normalizes Scryfall data into `EnrichedCard`.
* Handles colorless cards.
* Handles basic lands.
* Handles multi-faced cards.
* Returns missing cards in `notFound`.
* Does not expose raw Scryfall responses to the application layer.
* Does not perform strategic analysis.
* Does not classify card features.

---

# Suggested TypeScript API

```ts
export type FetchCardDataInput = {
  cardNames: string[];
};

export type FetchCardDataOutput = {
  cards: EnrichedCard[];
  notFound: string[];
  warnings: Array<{
    cardName: string;
    reason: string;
  }>;
};

export type FetchCardDataError =
  | {
      type: "empty_input";
      message: string;
    }
  | {
      type: "repository_failure";
      message: string;
    };

export type FetchCardDataResult =
  | {
      ok: true;
      value: FetchCardDataOutput;
    }
  | {
      ok: false;
      error: FetchCardDataError;
    };

export class FetchCardDataUseCase {
  constructor(private readonly cardRepository: CardRepository) {}

  async execute(
    input: FetchCardDataInput
  ): Promise<FetchCardDataResult> {
    // validate input
    // normalize names
    // deduplicate names
    // call repository
    // return normalized result
  }
}
```

---

# Suggested Folder Structure

```text
/src/features/fetch-card-data
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
```

---

# Suggested Tests

## Test: deduplicates card names

Input:

```ts
{
  cardNames: ["Mountain", "Mountain", "Sol Ring"]
}
```

Expected repository call:

```ts
["Mountain", "Sol Ring"]
```

---

## Test: returns normalized card data

Mock repository result:

```ts
{
  cards: [
    {
      name: "Sol Ring",
      manaValue: 1,
      colors: [],
      colorIdentity: [],
      typeLine: "Artifact",
      oracleText: "{T}: Add {C}{C}.",
      legalities: { commander: "legal" },
      keywords: []
    }
  ],
  notFound: [],
  warnings: []
}
```

Expected:

```ts
{
  cards: [
    {
      name: "Sol Ring",
      manaValue: 1,
      colors: [],
      colorIdentity: [],
      typeLine: "Artifact",
      oracleText: "{T}: Add {C}{C}.",
      legalities: { commander: "legal" },
      keywords: []
    }
  ],
  notFound: [],
  warnings: []
}
```

---

## Test: handles missing cards

Input:

```ts
{
  cardNames: ["Fake Card", "Sol Ring"]
}
```

Expected:

```ts
{
  cards: [
    {
      name: "Sol Ring",
      manaValue: 1,
      colors: [],
      colorIdentity: [],
      typeLine: "Artifact",
      oracleText: "{T}: Add {C}{C}.",
      legalities: { commander: "legal" },
      keywords: []
    }
  ],
  notFound: ["Fake Card"],
  warnings: []
}
```

---

## Test: ignores empty names with warning

Input:

```ts
{
  cardNames: ["Sol Ring", "", "   "]
}
```

Expected:

```ts
{
  cards: [
    {
      name: "Sol Ring",
      manaValue: 1,
      colors: [],
      colorIdentity: [],
      typeLine: "Artifact",
      oracleText: "{T}: Add {C}{C}.",
      legalities: { commander: "legal" },
      keywords: []
    }
  ],
  notFound: [],
  warnings: [
    {
      cardName: "",
      reason: "Empty card name ignored"
    }
  ]
}
```

---

# Non-Goals

This feature must not:

* Parse decklists.
* Analyze deck composition.
* Classify features.
* Recommend cards.
* Evaluate commander fit.
* Depend on EDHREC.
* Return raw Scryfall API responses.
