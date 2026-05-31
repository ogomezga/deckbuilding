#!/usr/bin/env node
import { runAnalyzeCommand } from "./commands/analyze.js";

const [, , command, ...argv] = process.argv;

try {
  if (command === "analyze") {
    await runAnalyzeCommand(argv);
  } else {
    throw new Error("Usage: mtg-assistant analyze --deck <path> --goal <path> --commander_preference prefer_current --output <path>");
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
