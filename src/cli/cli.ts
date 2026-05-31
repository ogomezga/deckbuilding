#!/usr/bin/env node
import { runToolboxCommand } from "./commands/toolbox.js";

const [, , command, ...argv] = process.argv;

try {
  await runToolboxCommand(command ?? "", argv);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
