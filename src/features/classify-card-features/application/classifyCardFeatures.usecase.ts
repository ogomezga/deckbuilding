import type { FeatureAssignment } from "../../../shared/domain/featureAssignment.js";
import type { ClassifyCardFeaturesInput, ClassifyCardFeaturesOutput, FeatureClassifier } from "../domain/featureClassifier.js";

export class ClassifyCardFeaturesUseCase {
  constructor(private readonly classifier: FeatureClassifier) {}

  async execute(input: ClassifyCardFeaturesInput): Promise<ClassifyCardFeaturesOutput> {
    if (input.cards.length === 0) throw new Error("cards must not be empty.");
    const output = await this.classifier.classify(input.cards);
    return {
      cardFeatures: output.cardFeatures.map((cardFeature) => ({
        cardName: cardFeature.cardName,
        features: dedupeAssignments(cardFeature.features)
      })),
      warnings: output.warnings
    };
  }
}

function dedupeAssignments(assignments: FeatureAssignment[]): FeatureAssignment[] {
  const seen = new Set<string>();
  return assignments.filter((assignment) => {
    const key = assignment.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
