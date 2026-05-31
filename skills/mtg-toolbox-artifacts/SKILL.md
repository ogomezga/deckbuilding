---
name: mtg-toolbox-artifacts
description: Use when Codex needs to inspect, validate, compare, or troubleshoot JSON artifacts produced by this repository's MTG deckbuilding CLI toolbox.
---

# MTG Toolbox Artifacts

The CLI writes JSON after every command. Treat artifacts as evidence.

## Important Artifacts

- `parsed-deck.json`: parsed mainboard and commander block.
- `card-data.json`: Scryfall-normalized card metadata.
- `game-plan.json`: created by Codex from user intent.
- `card-features.json`: per-card strategic feature assignments.
- `composition.json`: factual deck structure and feature density.
- `commander-fit.json`: commander evidence, not recommendations.
- `strategic-expressions.json`: exploration options, not rankings.
- `community-baselines.json`: community evidence or unavailable source statuses.
- `diagnosis.json`: strategic conclusions.
- `recommendations.json`: actions derived from diagnosis.

## Checks

- If many cards are missing from `card-data.json`, Scryfall lookup likely failed or deck names are malformed.
- If `card-features.json` seems shallow, improve classification or compensate manually in Codex's explanation.
- If `community-baselines.json.analyzedDecks` is `0`, say community evidence is unavailable. This is not a workflow failure.
- If recommendation evidence does not trace to diagnosis, do not present it as final advice.
