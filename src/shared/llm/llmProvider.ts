export type LlmJsonRequest = {
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
};

export type LlmTextRequest = {
  systemPrompt: string;
  userPrompt: string;
};

export interface LlmProvider {
  readonly providerName: string;
  readonly model: string;
  generateJson<T>(request: LlmJsonRequest): Promise<T>;
  generateText(request: LlmTextRequest): Promise<string>;
}
