import { readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { createRuntimeOrchestrator, runtimeConfigFromEnv } from "../../appFactory.js";
import type { CommanderPreference } from "../../shared/domain/playerPreferences.js";
import { writeJsonOutputsBesideReport } from "../report/writeJsonOutputs.js";
import { writeMarkdownReport } from "../report/writeMarkdownReport.js";

const analyzeArgsSchema = z.object({
  deck: z.string().min(1),
  goal: z.string().min(1),
  commanderPreference: z.enum(["fixed", "prefer_current", "open"]).default("prefer_current"),
  output: z.string().min(1),
  targetWinTurn: z.number().int().positive().optional(),
  bracket: z.number().int().min(1).max(5).optional()
});

export async function runAnalyzeCommand(argv: string[]): Promise<void> {
  const parsed = analyzeArgsSchema.parse(parseArgs(argv));
  const [rawDecklist, goalDescription] = await Promise.all([
    readFile(parsed.deck, "utf8"),
    readFile(parsed.goal, "utf8")
  ]);
  const orchestrator = createRuntimeOrchestrator(runtimeConfigFromEnv());
  const output = await orchestrator.execute({
    rawDecklist,
    goalDescription,
    commanderPreference: parsed.commanderPreference as CommanderPreference,
    targetWinTurn: parsed.targetWinTurn,
    bracket: parsed.bracket
  });
  await writeJsonOutputsBesideReport(parsed.output, output);
  await writeMarkdownReport(parsed.output, output);
  process.stdout.write(`Analysis written to ${dirname(parsed.output)}\n`);
}

function parseArgs(argv: string[]): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg?.startsWith("--")) continue;
    const key = arg.slice(2).replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = /^\d+$/.test(next) ? Number(next) : next;
    index += 1;
  }
  return args;
}
