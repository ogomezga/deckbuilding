---
name: mtg-deck-analysis-workflow
description: Use when a user asks Codex to analyze an MTG Commander/Moxfield decklist with this repository's toolbox. Guides Codex through running CLI capability commands, creating game-plan artifacts, inspecting JSON outputs, and producing an evidence-based deckbuilding response.
---

# MTG Deck Analysis Workflow

Codex is the agent. The TypeScript project is a deterministic toolbox.

Do not ask the application to produce final deckbuilding judgment. Run tools, inspect artifacts, then reason from the specs.

## Workflow

Use an artifacts directory such as `artifacts/<deck-name>/`.

1. Parse the Moxfield decklist:

```bash
corepack pnpm cli parse-decklist --deck <deck.txt> --out artifacts/<deck>/parsed-deck.json
```

2. Fetch real card metadata from Scryfall:

```bash
corepack pnpm cli fetch-card-data --deck artifacts/<deck>/parsed-deck.json --out artifacts/<deck>/card-data.json
```

3. Create `artifacts/<deck>/game-plan.json` yourself from the user's stated intent.

Use this shape:

```json
{
  "commander": "Commander Name",
  "primaryObjective": "Concise objective.",
  "winCondition": "How the deck intends to win.",
  "targetWinTurn": 6,
  "bracket": 3,
  "desiredFeatures": [
    { "feature": "Land Recursion", "role": "primary" }
  ],
  "constraints": ["No infinite combos"],
  "rawDescription": "Original user goal."
}
```

4. Classify card features:

```bash
corepack pnpm cli classify-card-features --cards artifacts/<deck>/card-data.json --out artifacts/<deck>/card-features.json
```

5. Analyze composition:

```bash
corepack pnpm cli analyze-deck-composition --deck artifacts/<deck>/parsed-deck.json --cards artifacts/<deck>/card-data.json --features artifacts/<deck>/card-features.json --out artifacts/<deck>/composition.json
```

6. Evaluate commander fit:

```bash
corepack pnpm cli evaluate-commander-fit --cards artifacts/<deck>/card-data.json --features artifacts/<deck>/card-features.json --game-plan artifacts/<deck>/game-plan.json --composition artifacts/<deck>/composition.json --out artifacts/<deck>/commander-fit.json
```

7. Discover strategic commander expressions:

```bash
corepack pnpm cli discover-similar-commanders --game-plan artifacts/<deck>/game-plan.json --commander_preference prefer_current --cards artifacts/<deck>/card-data.json --features artifacts/<deck>/card-features.json --commander-fit artifacts/<deck>/commander-fit.json --out artifacts/<deck>/strategic-expressions.json
```

8. Analyze community baselines:

```bash
corepack pnpm cli analyze-community-baselines --game-plan artifacts/<deck>/game-plan.json --composition artifacts/<deck>/composition.json --strategic-expressions artifacts/<deck>/strategic-expressions.json --out artifacts/<deck>/community-baselines.json
```

If community output says evidence is unavailable, report that plainly. Do not fill the gap with popularity claims.

9. Build diagnosis:

```bash
corepack pnpm cli build-strategic-diagnosis --game-plan artifacts/<deck>/game-plan.json --composition artifacts/<deck>/composition.json --commander-fit artifacts/<deck>/commander-fit.json --strategic-expressions artifacts/<deck>/strategic-expressions.json --community-baselines artifacts/<deck>/community-baselines.json --out artifacts/<deck>/diagnosis.json
```

10. Generate recommendation artifacts:

```bash
corepack pnpm cli recommend-changes --game-plan artifacts/<deck>/game-plan.json --diagnosis artifacts/<deck>/diagnosis.json --composition artifacts/<deck>/composition.json --community-baselines artifacts/<deck>/community-baselines.json --commander_preference prefer_current --out artifacts/<deck>/recommendations.json
```

## Response Rules

- Read the JSON artifacts before answering.
- Lead with strategic diagnosis, not card swaps.
- Mention unavailable evidence explicitly.
- Never use EDHREC-style "popular with this commander" reasoning as a sufficient reason.
- Recommendations must trace back to `diagnosis.json`.
