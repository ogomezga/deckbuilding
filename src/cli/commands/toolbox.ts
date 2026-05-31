import { readFile } from "node:fs/promises";
import { z } from "zod";
import type { AnalyzeCommunityBaselinesOutput } from "../../features/analyze-community-baselines/index.js";
import type { AnalyzeDeckCompositionOutput } from "../../features/analyze-deck-composition/index.js";
import type { BuildStrategicDiagnosisOutput } from "../../features/build-strategic-diagnosis/index.js";
import type { ClassifyCardFeaturesOutput } from "../../features/classify-card-features/index.js";
import type { DiscoverSimilarCommandersOutput } from "../../features/discover-similar-commanders/index.js";
import type { EvaluateCommanderFitOutput } from "../../features/evaluate-commander-fit/index.js";
import type { FetchCardDataOutput } from "../../features/fetch-card-data/index.js";
import { parseMoxfieldDecklist, type ParseMoxfieldDecklistOutput } from "../../features/parse-moxfield-decklist/index.js";
import type { RecommendChangesOutput } from "../../features/recommend-changes/index.js";
import type { EnrichedCard } from "../../shared/domain/card.js";
import type { CardFeature } from "../../shared/domain/featureAssignment.js";
import type { GamePlan } from "../../shared/domain/gamePlan.js";
import type { CommanderPreference } from "../../shared/domain/playerPreferences.js";
import { artifactWrittenMessage, readJsonArtifact, writeJsonArtifact } from "../artifacts.js";
import { parseArgs } from "../args.js";
import { createToolbox } from "../toolboxFactory.js";

const outSchema = z.object({ out: z.string().min(1) });
const commanderPreferenceSchema = z.enum(["fixed", "prefer_current", "open"]).default("prefer_current");

export async function runToolboxCommand(command: string, argv: string[]): Promise<void> {
  switch (command) {
    case "parse-decklist":
      return parseDecklist(argv);
    case "fetch-card-data":
      return fetchCardData(argv);
    case "classify-card-features":
      return classifyCardFeatures(argv);
    case "analyze-deck-composition":
      return analyzeDeckComposition(argv);
    case "evaluate-commander-fit":
      return evaluateCommanderFit(argv);
    case "discover-similar-commanders":
      return discoverSimilarCommanders(argv);
    case "analyze-community-baselines":
      return analyzeCommunityBaselines(argv);
    case "build-strategic-diagnosis":
      return buildStrategicDiagnosis(argv);
    case "recommend-changes":
      return recommendChanges(argv);
    default:
      throw new Error(usage());
  }
}

async function parseDecklist(argv: string[]): Promise<void> {
  const args = outSchema.extend({ deck: z.string().min(1) }).parse(parseArgs(argv));
  const result = parseMoxfieldDecklist({ rawDecklist: await readFile(args.deck, "utf8") });
  if (!result.ok) throw new Error(result.error.message);
  await write(args.out, result.value);
}

async function fetchCardData(argv: string[]): Promise<void> {
  const args = outSchema.extend({ deck: z.string().min(1) }).parse(parseArgs(argv));
  const parsed = await readJsonArtifact<ParseMoxfieldDecklistOutput>(args.deck);
  const result = await createToolbox().fetchCardData.execute({
    cardNames: [...parsed.deck.mainboard, ...parsed.deck.commanders].map((card) => card.name)
  });
  if (!result.ok) throw new Error(result.error.message);
  await write(args.out, result.value);
}

async function classifyCardFeatures(argv: string[]): Promise<void> {
  const args = outSchema.extend({ cards: z.string().min(1) }).parse(parseArgs(argv));
  const input = await readJsonArtifact<FetchCardDataOutput>(args.cards);
  await write(args.out, await createToolbox().classifyCardFeatures.execute({ cards: input.cards }));
}

async function analyzeDeckComposition(argv: string[]): Promise<void> {
  const args = outSchema
    .extend({ deck: z.string().min(1), cards: z.string().min(1), features: z.string().min(1) })
    .parse(parseArgs(argv));
  const [deck, cards, features] = await Promise.all([
    readJsonArtifact<ParseMoxfieldDecklistOutput>(args.deck),
    readJsonArtifact<FetchCardDataOutput>(args.cards),
    readJsonArtifact<ClassifyCardFeaturesOutput>(args.features)
  ]);
  await write(
    args.out,
    await createToolbox().analyzeDeckComposition.execute({
      deck: deck.deck,
      cards: cards.cards,
      cardFeatures: features.cardFeatures
    })
  );
}

async function evaluateCommanderFit(argv: string[]): Promise<void> {
  const args = outSchema
    .extend({
      cards: z.string().min(1),
      features: z.string().min(1),
      gamePlan: z.string().min(1),
      composition: z.string().min(1)
    })
    .parse(parseArgs(argv));
  const [cards, features, gamePlan, composition] = await Promise.all([
    readJsonArtifact<FetchCardDataOutput>(args.cards),
    readJsonArtifact<ClassifyCardFeaturesOutput>(args.features),
    readJsonArtifact<GamePlan>(args.gamePlan),
    readJsonArtifact<AnalyzeDeckCompositionOutput>(args.composition)
  ]);
  const commander = findCommander(cards.cards, gamePlan.commander);
  const commanderFeatures = findCommanderFeatures(features.cardFeatures, commander.name);
  await write(
    args.out,
    await createToolbox().evaluateCommanderFit.execute({
      commander,
      commanderFeatures,
      gamePlan,
      composition: composition.composition
    })
  );
}

async function discoverSimilarCommanders(argv: string[]): Promise<void> {
  const args = outSchema
    .extend({
      gamePlan: z.string().min(1),
      cards: z.string().min(1).optional(),
      features: z.string().min(1).optional(),
      commanderFit: z.string().min(1).optional(),
      commanderPreference: commanderPreferenceSchema
    })
    .parse(parseArgs(argv));
  const gamePlan = await readJsonArtifact<GamePlan>(args.gamePlan);
  const cards = args.cards ? await readJsonArtifact<FetchCardDataOutput>(args.cards) : undefined;
  const features = args.features ? await readJsonArtifact<ClassifyCardFeaturesOutput>(args.features) : undefined;
  const commander = cards ? findCommander(cards.cards, gamePlan.commander) : undefined;
  await write(
    args.out,
    await createToolbox().discoverSimilarCommanders.execute({
      gamePlan,
      commanderPreference: args.commanderPreference as CommanderPreference,
      currentCommander: commander,
      currentCommanderFeatures: commander && features ? findCommanderFeatures(features.cardFeatures, commander.name) : undefined,
      commanderFit: args.commanderFit
        ? (await readJsonArtifact<EvaluateCommanderFitOutput>(args.commanderFit)).commanderFit
        : undefined
    })
  );
}

async function analyzeCommunityBaselines(argv: string[]): Promise<void> {
  const args = outSchema
    .extend({
      gamePlan: z.string().min(1),
      composition: z.string().min(1),
      strategicExpressions: z.string().min(1).optional()
    })
    .parse(parseArgs(argv));
  const strategicExpressions = args.strategicExpressions
    ? (await readJsonArtifact<DiscoverSimilarCommandersOutput>(args.strategicExpressions)).strategicExpressions
    : undefined;
  await write(
    args.out,
    await createToolbox().analyzeCommunityBaselines.execute({
      gamePlan: await readJsonArtifact<GamePlan>(args.gamePlan),
      deckComposition: (await readJsonArtifact<AnalyzeDeckCompositionOutput>(args.composition)).composition,
      strategicExpressions
    })
  );
}

async function buildStrategicDiagnosis(argv: string[]): Promise<void> {
  const args = outSchema
    .extend({
      gamePlan: z.string().min(1),
      composition: z.string().min(1),
      commanderFit: z.string().min(1),
      strategicExpressions: z.string().min(1),
      communityBaselines: z.string().min(1)
    })
    .parse(parseArgs(argv));
  await write(
    args.out,
    await createToolbox().buildStrategicDiagnosis.execute({
      gamePlan: await readJsonArtifact<GamePlan>(args.gamePlan),
      composition: (await readJsonArtifact<AnalyzeDeckCompositionOutput>(args.composition)).composition,
      commanderFit: (await readJsonArtifact<EvaluateCommanderFitOutput>(args.commanderFit)).commanderFit,
      strategicExpressions: (await readJsonArtifact<DiscoverSimilarCommandersOutput>(args.strategicExpressions))
        .strategicExpressions,
      communityBaselineReport: (await readJsonArtifact<AnalyzeCommunityBaselinesOutput>(args.communityBaselines))
        .baselineReport
    })
  );
}

async function recommendChanges(argv: string[]): Promise<void> {
  const args = outSchema
    .extend({
      gamePlan: z.string().min(1),
      diagnosis: z.string().min(1),
      composition: z.string().min(1),
      communityBaselines: z.string().min(1),
      commanderPreference: commanderPreferenceSchema
    })
    .parse(parseArgs(argv));
  await write(
    args.out,
    await createToolbox().recommendChanges.execute({
      gamePlan: await readJsonArtifact<GamePlan>(args.gamePlan),
      diagnosis: (await readJsonArtifact<BuildStrategicDiagnosisOutput>(args.diagnosis)).diagnosis,
      composition: (await readJsonArtifact<AnalyzeDeckCompositionOutput>(args.composition)).composition,
      communityBaselineReport: (await readJsonArtifact<AnalyzeCommunityBaselinesOutput>(args.communityBaselines))
        .baselineReport,
      commanderPreference: args.commanderPreference as CommanderPreference
    })
  );
}

async function write(path: string, value: unknown): Promise<void> {
  await writeJsonArtifact(path, value);
  process.stdout.write(artifactWrittenMessage(path));
}

function findCommander(cards: EnrichedCard[], commanderName: string): EnrichedCard {
  const commander = cards.find((card) => card.name.toLocaleLowerCase() === commanderName.toLocaleLowerCase());
  if (!commander) throw new Error(`Commander metadata not found: ${commanderName}`);
  return commander;
}

function findCommanderFeatures(cardFeatures: CardFeature[], commanderName: string) {
  return cardFeatures.find((entry) => entry.cardName.toLocaleLowerCase() === commanderName.toLocaleLowerCase())?.features ?? [];
}

function usage(): string {
  return `Usage: mtg-assistant <command> --out <artifact.json>

Commands:
  parse-decklist --deck <moxfield.txt> --out artifacts/parsed-deck.json
  fetch-card-data --deck artifacts/parsed-deck.json --out artifacts/card-data.json
  classify-card-features --cards artifacts/card-data.json --out artifacts/card-features.json
  analyze-deck-composition --deck artifacts/parsed-deck.json --cards artifacts/card-data.json --features artifacts/card-features.json --out artifacts/composition.json
  evaluate-commander-fit --cards artifacts/card-data.json --features artifacts/card-features.json --game-plan artifacts/game-plan.json --composition artifacts/composition.json --out artifacts/commander-fit.json
  discover-similar-commanders --game-plan artifacts/game-plan.json --commander_preference prefer_current --cards artifacts/card-data.json --features artifacts/card-features.json --commander-fit artifacts/commander-fit.json --out artifacts/strategic-expressions.json
  analyze-community-baselines --game-plan artifacts/game-plan.json --composition artifacts/composition.json --strategic-expressions artifacts/strategic-expressions.json --out artifacts/community-baselines.json
  build-strategic-diagnosis --game-plan artifacts/game-plan.json --composition artifacts/composition.json --commander-fit artifacts/commander-fit.json --strategic-expressions artifacts/strategic-expressions.json --community-baselines artifacts/community-baselines.json --out artifacts/diagnosis.json
  recommend-changes --game-plan artifacts/game-plan.json --diagnosis artifacts/diagnosis.json --composition artifacts/composition.json --community-baselines artifacts/community-baselines.json --commander_preference prefer_current --out artifacts/recommendations.json`;
}

export type ToolboxCommandOutput =
  | ParseMoxfieldDecklistOutput
  | FetchCardDataOutput
  | ClassifyCardFeaturesOutput
  | AnalyzeDeckCompositionOutput
  | EvaluateCommanderFitOutput
  | DiscoverSimilarCommandersOutput
  | AnalyzeCommunityBaselinesOutput
  | BuildStrategicDiagnosisOutput
  | RecommendChangesOutput;
