---
name: mtg-strategic-diagnosis
description: Use when Codex needs to interpret MTG deck analysis artifacts and build or explain a strategic diagnosis from game plan, composition, commander fit, community evidence, and strategic-expression JSON outputs.
---

# MTG Strategic Diagnosis

Diagnosis is the first place for conclusions.

Use these artifacts:

- `game-plan.json`
- `composition.json`
- `commander-fit.json`
- `strategic-expressions.json`
- `community-baselines.json`
- `diagnosis.json` if already generated

## Reasoning Order

1. Start from player intent in `game-plan.json`.
2. Compare desired features to `composition.featureDensity`.
3. Use `commander-fit.json` to identify direct support, missing support, and tensions.
4. Use `community-baselines.json` only as evidence. If unavailable, say so.
5. Treat strategic expressions as exploration evidence, not orders to replace the commander.

## Avoid

- Global scores, grades, rankings, or confidence labels.
- Saying a deck is "wrong" because community lists differ.
- Recommending cards before stating the diagnosed issue.
- Commander replacement language when `commanderPreference` is `fixed`.

## Good Diagnosis Pattern

```text
Land Recursion is a primary desired feature.
The deck contains N cards classified as Land Recursion.
The commander does/does not directly support Land Recursion.
Community baseline evidence is unavailable / shows ...
Therefore the strategic issue is ...
```
