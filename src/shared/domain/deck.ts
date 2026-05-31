import type { ParsedDeckCard } from "./card.js";

export type ParsedDeck = {
  mainboard: ParsedDeckCard[];
  commanders: ParsedDeckCard[];
};
