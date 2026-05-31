import type { ParsedDeckCard } from "../../../shared/domain/card.js";
import type { ParsedDeck } from "../../../shared/domain/deck.js";

export type ParseMoxfieldDecklistInput = {
  rawDecklist: string;
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
  | { type: "empty_input"; message: string }
  | { type: "missing_mainboard"; message: string }
  | { type: "missing_commander_block"; message: string }
  | { type: "missing_commander"; message: string };

export type ParseMoxfieldDecklistResult =
  | { ok: true; value: ParseMoxfieldDecklistOutput }
  | { ok: false; error: ParseMoxfieldDecklistError; warnings: ParseDecklistWarning[] };

export function parseMoxfieldDecklist(
  input: ParseMoxfieldDecklistInput
): ParseMoxfieldDecklistResult {
  if (!input.rawDecklist.trim()) {
    return {
      ok: false,
      error: { type: "empty_input", message: "Decklist input is empty." },
      warnings: []
    };
  }

  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const rawLine of input.rawDecklist.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
      continue;
    }
    if (line.startsWith("//") || line.startsWith("#")) continue;
    currentBlock.push(line);
  }

  if (currentBlock.length > 0) blocks.push(currentBlock);

  if (blocks.length < 2) {
    return {
      ok: false,
      error: { type: "missing_commander_block", message: "No commander block detected." },
      warnings: []
    };
  }

  const warnings: ParseDecklistWarning[] = [];
  const parseLine = (line: string): ParsedDeckCard | null => {
    const match = line.match(/^(\d+)\s+(.+)$/);
    if (!match) {
      warnings.push({ line, reason: "Unrecognized decklist line" });
      return null;
    }
    const quantity = Number.parseInt(match[1] ?? "", 10);
    const name = (match[2] ?? "").trim();
    if (quantity <= 0) {
      warnings.push({ line, reason: "Quantity must be positive" });
      return null;
    }
    return { name, quantity };
  };

  const commanderLines = blocks[blocks.length - 1] ?? [];
  const mainboardLines = blocks.slice(0, -1).flat();
  const mainboard = mainboardLines.map(parseLine).filter((card): card is ParsedDeckCard => card !== null);
  const commanders = commanderLines.map(parseLine).filter((card): card is ParsedDeckCard => card !== null);

  if (mainboard.length === 0) {
    return {
      ok: false,
      error: { type: "missing_mainboard", message: "No valid mainboard cards detected." },
      warnings
    };
  }

  if (commanders.length === 0) {
    return {
      ok: false,
      error: { type: "missing_commander", message: "No valid commander card detected." },
      warnings
    };
  }

  if (commanders.length > 2) {
    warnings.push({
      line: commanderLines.join(" | "),
      reason: "Commander block contains more than two cards"
    });
  }

  return { ok: true, value: { deck: { mainboard, commanders }, warnings } };
}
