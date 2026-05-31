export const featureNames = [
  "Landfall Trigger",
  "Land Sacrifice",
  "Land Recursion",
  "Extra Land Drop",
  "Sacrifice Outlet",
  "Sacrifice Payoff",
  "Graveyard Enabler",
  "Permanent Recursion",
  "Token Producer",
  "Token Payoff",
  "+1/+1 Counter Payoff",
  "Combat Finisher",
  "Card Advantage Engine",
  "Mana Acceleration",
  "Removal",
  "Board Wipe",
  "Protection",
  "Tutor",
  "Aristocrats Payoff",
  "ETB Trigger",
  "ETB Payoff",
  "Reanimation",
  "Discard Outlet",
  "Treasure Production",
  "Treasure Payoff",
  "Go Wide",
  "Go Tall"
] as const;

export type FeatureName = (typeof featureNames)[number];

export type DesiredFeatureRole = "primary" | "supporting" | "optional";

export type DesiredFeature = {
  feature: FeatureName;
  role: DesiredFeatureRole;
};
