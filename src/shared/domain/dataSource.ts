export type DataSourceStatus = "available" | "unavailable";

export type DataSourceMetadata = {
  cardMetadata: {
    source: "Scryfall";
    status: DataSourceStatus;
  };
  gamePlanExtraction: {
    source: string;
    status: DataSourceStatus;
  };
  featureClassification: {
    source: "rule-based" | "LLM-assisted" | "rule-based + LLM-assisted";
    status: DataSourceStatus;
  };
  communityBaselines: {
    source: string;
    status: DataSourceStatus;
    warning?: string;
  };
  commanderOptions: {
    source: "curated dataset" | "real source";
    status: DataSourceStatus;
  };
  responseSynthesis: {
    source: string;
    status: DataSourceStatus;
  };
};
