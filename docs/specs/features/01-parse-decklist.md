# Feature: Parse Moxfield Decklist

## Purpose

Convert a raw Moxfield Commander decklist export into structured deck data.

This feature is intentionally narrow for V1.

The system assumes the user exports decklists from Moxfield.

---

# User Story

As a player using Moxfield, I want to paste my exported decklist so that the assistant can identify the main deck cards and commander.

---

# Input

```ts
{
  rawDecklist: string;
}
```

Example:

```text
1 Abrade
1 Arcane Signet
29 Mountain
1 Treasure Nabber

1 Krenko, Mob Boss
```

---

# Output

```ts
{
  deck: {
    mainboard: Array<{
      name: string;
      quantity: number;
    }>;

    commanders: Array<{
      name: string;
      quantity: number;
    }>;
  };

  warnings: Array<{
    line: string;
    reason: string;
  }>;
}
```

Example:

```ts
{
  deck: {
    mainboard: [
      { name: "Abrade", quantity: 1 },
      { name: "Arcane Signet", quantity: 1 },
      { name: "Mountain", quantity: 29 },
      { name: "Treasure Nabber", quantity: 1 }
    ],
    commanders: [
      { name: "Krenko, Mob Boss", quantity: 1 }
    ]
  },
  warnings: []
}
```

---

# Moxfield Format Assumption

For V1, the parser assumes this structure:

```text
<main deck cards>

<commander card>
```

The commander appears after the final blank-line-separated block.

The mainboard appears before that block.

If the input contains only one non-empty block, the parser should return a missing commander error.

---

# Parsing Rules

## Supported Line Format

The parser should support the standard Moxfield export format:

```text
1 Card Name
29 Mountain
```

The first token is the quantity.

The rest of the line is the card name.

---

## Blank Lines

Blank lines separate blocks.

The last non-empty block is interpreted as the commander block.

All previous valid card lines are interpreted as mainboard.

---

## Commander Block

The commander block may contain:

* One commander.
* Two commanders, for Partner-style decks.

Example:

```text
1 Commander A
1 Commander B
```

If the commander block contains more than two valid card lines, the parser should still return them but add a warning.

---

## Comments

Lines starting with `//` or `#` should be ignored.

---

## Invalid Lines

Invalid lines should not crash the parser.

They should be returned as warnings.

---

# Error Handling

The parser should return an explicit result type.

Return a validation error when:

* `rawDecklist` is empty.
* No valid mainboard cards are detected.
* No valid commander block is detected.
* No valid commander card is detected.

Return warnings when:

* A line cannot be parsed.
* The commander block contains more than two cards.
* A quantity is zero or negative.

---

# Acceptance Criteria

* Parses Moxfield exported decklists.
* Separates mainboard from commander block.
* Supports high quantities such as `29 Mountain`.
* Supports one commander.
* Supports two commanders.
* Ignores empty lines.
* Ignores comments.
* Returns warnings for unrecognized lines.
* Returns validation errors for invalid input.
* Does not call external APIs.
* Does not validate whether card names exist.

---

# Suggested TypeScript API

```ts
export type ParseMoxfieldDecklistInput = {
  rawDecklist: string;
};

export type ParsedDeckCard = {
  name: string;
  quantity: number;
};

export type ParsedDeck = {
  mainboard: ParsedDeckCard[];
  commanders: ParsedDeckCard[];
};

export type ParseDecklistWarning = {
  line: string;
  reason: string;
};

export type ParseMoxfieldDecklistOutput = {
  deck: ParsedDeck;
  warnings: ParseDecklistWarning[];
};

export type ParseMoxfieldDecklistError =
  | {
      type: "empty_input";
      message: string;
    }
  | {
      type: "missing_mainboard";
      message: string;
    }
  | {
      type: "missing_commander_block";
      message: string;
    }
  | {
      type: "missing_commander";
      message: string;
    };

export type ParseMoxfieldDecklistResult =
  | {
      ok: true;
      value: ParseMoxfieldDecklistOutput;
    }
  | {
      ok: false;
      error: ParseMoxfieldDecklistError;
      warnings: ParseDecklistWarning[];
    };

export function parseMoxfieldDecklist(
  input: ParseMoxfieldDecklistInput
): ParseMoxfieldDecklistResult;
```

---

# Suggested Tests

## Test: parses mainboard and commander

Input:

```text
1 Abrade
1 Arcane Signet
29 Mountain

1 Krenko, Mob Boss
```

Expected:

```ts
{
  ok: true,
  value: {
    deck: {
      mainboard: [
        { name: "Abrade", quantity: 1 },
        { name: "Arcane Signet", quantity: 1 },
        { name: "Mountain", quantity: 29 }
      ],
      commanders: [
        { name: "Krenko, Mob Boss", quantity: 1 }
      ]
    },
    warnings: []
  }
}
```

---

## Test: supports two commanders

Input:

```text
1 Sol Ring
1 Command Tower

1 Commander A
1 Commander B
```

Expected:

```ts
{
  ok: true,
  value: {
    deck: {
      mainboard: [
        { name: "Sol Ring", quantity: 1 },
        { name: "Command Tower", quantity: 1 }
      ],
      commanders: [
        { name: "Commander A", quantity: 1 },
        { name: "Commander B", quantity: 1 }
      ]
    },
    warnings: []
  }
}
```

---

## Test: invalid line creates warning

Input:

```text
1 Sol Ring
This is invalid

1 Krenko, Mob Boss
```

Expected:

```ts
{
  ok: true,
  value: {
    deck: {
      mainboard: [
        { name: "Sol Ring", quantity: 1 }
      ],
      commanders: [
        { name: "Krenko, Mob Boss", quantity: 1 }
      ]
    },
    warnings: [
      {
        line: "This is invalid",
        reason: "Unrecognized decklist line"
      }
    ]
  }
}
```

---

## Test: missing commander block returns error

Input:

```text
1 Sol Ring
1 Mountain
```

Expected:

```ts
{
  ok: false,
  error: {
    type: "missing_commander_block",
    message: "No commander block detected."
  }
}
```

---

## Test: empty input returns error

Input:

```text
```

Expected:

```ts
{
  ok: false,
  error: {
    type: "empty_input",
    message: "Decklist input is empty."
  }
}
```

---

# Non-Goals

This feature must not:

* Fetch card metadata.
* Validate card existence.
* Detect commander legality.
* Analyze deck strategy.
* Classify card features.
* Recommend changes.
* Support every decklist format in V1.
