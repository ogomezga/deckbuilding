---
name: mtg-recommendation-explainer
description: Use when Codex needs to explain MTG deck recommendations from recommendation and diagnosis artifacts, emphasizing diagnosis-driven reasoning and avoiding popularity-only card advice.
---

# MTG Recommendation Explainer

Recommendations must be diagnosis-driven.

Read:

- `diagnosis.json`
- `recommendations.json`
- `composition.json`
- `game-plan.json`
- `community-baselines.json`

## Explanation Shape

For each major recommendation:

1. State the diagnosed problem.
2. Name the relevant desired feature(s).
3. Explain the structural change.
4. Then discuss card additions/swaps.
5. Mention the tradeoff.

## Source Rules

- A card is not recommended because it is popular.
- A card can be recommended because it addresses a diagnosed gap or tension.
- Community observed solutions may support a recommendation, but must not be the only reason.
- If community evidence is unavailable, do not imply it exists.

## Tone

Be useful to a deckbuilder who wants to learn. Explain why the change helps the game plan, not just what to add.
