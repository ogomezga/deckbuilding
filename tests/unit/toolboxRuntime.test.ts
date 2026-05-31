import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("toolbox runtime wiring", () => {
  it("wires Scryfall and real community source probes in the CLI toolbox", async () => {
    const toolboxFactory = await readFile("src/cli/toolboxFactory.ts", "utf8");
    expect(toolboxFactory).toContain("ScryfallCardRepository");
    expect(toolboxFactory).toContain("EdhrecCommunityDeckSource");
    expect(toolboxFactory).toContain("MtgGoldfishCommunityDeckSource");
    expect(toolboxFactory).toContain("ArchidektCommunityDeckSource");
    expect(toolboxFactory).not.toContain("LocalCardRepository");
    expect(toolboxFactory).not.toContain("FixtureCommunityDeckRepository");
    expect(toolboxFactory).not.toContain("OpenAi");
  });

  it("exposes toolbox commands instead of an autonomous analyze runtime", async () => {
    const cli = await readFile("src/cli/cli.ts", "utf8");
    const toolbox = await readFile("src/cli/commands/toolbox.ts", "utf8");
    expect(cli).toContain("runToolboxCommand");
    expect(toolbox).toContain("parse-decklist");
    expect(toolbox).toContain("recommend-changes");
  });
});
