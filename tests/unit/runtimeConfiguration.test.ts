import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createRuntimeOrchestrator, runtimeConfigFromEnv } from "../../src/appFactory.js";

describe("runtime configuration", () => {
  it("fails clearly when OPENAI_API_KEY is missing", () => {
    expect(() => runtimeConfigFromEnv({})).toThrow(/OPENAI_API_KEY/);
  });

  it("runtime factory wires Scryfall and OpenAI-backed runtime adapters", async () => {
    const appFactory = await readFile("src/appFactory.ts", "utf8");
    expect(appFactory).toContain("ScryfallCardRepository");
    expect(appFactory).toContain("LlmGamePlanExtractor");
    expect(appFactory).toContain("OpenAiLlmProvider");
    expect(appFactory).toContain("EdhrecCommunityDeckSource");
    expect(appFactory).toContain("MtgGoldfishCommunityDeckSource");
    expect(appFactory).toContain("ArchidektCommunityDeckSource");
    expect(appFactory).not.toContain("LocalCardRepository");
    expect(appFactory).not.toContain("FixtureCommunityDeckRepository");
  });

  it("can create the runtime orchestrator when required config exists", () => {
    expect(() =>
      createRuntimeOrchestrator({
        openAiApiKey: "test-key",
        openAiModel: "gpt-5-mini"
      })
    ).not.toThrow();
  });
});
