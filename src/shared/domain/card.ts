export type Color = "W" | "U" | "B" | "R" | "G";

export type EnrichedCard = {
  name: string;
  manaValue: number;
  colors: Color[];
  colorIdentity: Color[];
  typeLine: string;
  oracleText: string;
  legalities: Record<string, string>;
  keywords: string[];
};

export type ParsedDeckCard = {
  name: string;
  quantity: number;
};
