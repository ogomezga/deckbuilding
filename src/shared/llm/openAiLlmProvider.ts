import type { LlmJsonRequest, LlmProvider, LlmTextRequest } from "./llmProvider.js";

type OpenAiResponsesApiResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export type OpenAiLlmProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
};

export class OpenAiLlmProvider implements LlmProvider {
  readonly providerName = "OpenAI";
  readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: OpenAiLlmProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async generateJson<T>(request: LlmJsonRequest): Promise<T> {
    const text = await this.createResponse({
      model: this.model,
      input: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      text: {
        format: {
          type: "json_schema",
          name: request.schemaName,
          strict: true,
          schema: request.schema
        }
      }
    });
    return JSON.parse(text) as T;
  }

  async generateText(request: LlmTextRequest): Promise<string> {
    return this.createResponse({
      model: this.model,
      input: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt }
      ],
      text: { format: { type: "text" } }
    });
  }

  private async createResponse(body: Record<string, unknown>): Promise<string> {
    const response = await this.fetchImpl(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`OpenAI Responses API request failed: ${response.status}${detail ? ` ${detail}` : ""}`);
    }

    const json = (await response.json()) as OpenAiResponsesApiResponse;
    const text =
      json.output_text ??
      json.output?.flatMap((item) => item.content ?? []).find((content) => content.type === "output_text" || content.text)
        ?.text;

    if (!text) throw new Error("OpenAI response did not contain output text.");
    return text;
  }
}
