import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { OrchestrateAgentWorkflowOutput } from "../../features/orchestrate-agent-workflow/index.js";

export async function writeMarkdownReport(reportPath: string, output: OrchestrateAgentWorkflowOutput): Promise<void> {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, renderMarkdownReport(output));
}

export function renderMarkdownReport(output: OrchestrateAgentWorkflowOutput): string {
  const { session } = output;
  const recs = session.recommendations;
  return `# Deck Analysis Report

## Data Sources

- Card metadata: ${session.dataSources.cardMetadata.source} (${session.dataSources.cardMetadata.status})
- Game plan extraction: ${session.dataSources.gamePlanExtraction.source} (${session.dataSources.gamePlanExtraction.status})
- Feature classification: ${session.dataSources.featureClassification.source} (${session.dataSources.featureClassification.status})
- Community baselines: ${session.dataSources.communityBaselines.source} (${session.dataSources.communityBaselines.status})${session.dataSources.communityBaselines.warning ? ` - ${session.dataSources.communityBaselines.warning}` : ""}
- Commander options: ${session.dataSources.commanderOptions.source} (${session.dataSources.commanderOptions.status})
- Response synthesis: ${session.dataSources.responseSynthesis.source} (${session.dataSources.responseSynthesis.status})

## Synthesized Summary

${session.responseSynthesis}

## Game Plan

${session.gamePlan.primaryObjective}

Win condition: ${session.gamePlan.winCondition}

Desired features: ${session.gamePlan.desiredFeatures.map((feature) => `${feature.feature} (${feature.role})`).join(", ")}

## Deck Composition

- Total cards: ${session.composition.totalCards}
- Lands: ${session.composition.landCount}
- Nonlands: ${session.composition.nonLandCount}
- Average mana value: ${session.composition.averageManaValue}
- Detected features: ${session.composition.detectedFeatures.join(", ")}

## Commander Fit Findings

${session.commanderFit.findings.map((finding) => `- ${finding.type}: ${finding.evidence.join(" ")}`).join("\n") || "- No commander fit findings."}

## Strategic Expressions

${session.strategicExpressions.map((expression) => `- ${expression.name}: ${expression.commanderOptions.map((option) => option.commander).join(", ")}`).join("\n") || "- Alternative commander discovery was skipped or produced no expressions."}

## Community Evidence

${session.communityBaselineReport.findings.map((finding) => `- ${finding.feature}: current ${finding.currentDensity}, observed median ${finding.observedMedian}`).join("\n") || "- No community evidence available."}

### Community Source Status

${session.communityBaselineReport.dataSources.map((source) => `- ${source.source}: ${source.status}${source.warning ? ` - ${source.warning}` : ""}`).join("\n") || "- No community sources configured."}

## Strategic Diagnosis

${session.diagnosis.featureGaps.map((gap) => `- Gap: ${gap.reason}`).join("\n") || "- No feature gaps diagnosed."}
${session.diagnosis.featureTensions.map((tension) => `\n- Tension: ${tension.reason}`).join("")}
${session.diagnosis.commanderTensions.map((tension) => `\n- Commander tension: ${tension.reason}`).join("")}

## Recommended Changes

### Strategic Recommendations

${recs.map((recommendation) => `- ${recommendation.strategicRecommendation.title}: ${recommendation.strategicRecommendation.rationale}`).join("\n") || "- No significant changes recommended."}

### Structural Recommendations

${recs.map((recommendation) => recommendation.structuralRecommendation ? `- ${recommendation.structuralRecommendation.title}: ${recommendation.structuralRecommendation.targetState ?? recommendation.structuralRecommendation.rationale}` : "").filter(Boolean).join("\n") || "- None."}

### Card Recommendations

${recs.flatMap((recommendation) => recommendation.cardRecommendations.map((card) => `- ${card.cardName}: ${card.rationale}`)).join("\n") || "- None."}

### Swap Recommendations

${recs.flatMap((recommendation) => recommendation.swapRecommendations.map((swap) => `- OUT ${swap.removeCard} / IN ${swap.addCard}: ${swap.rationale}`)).join("\n") || "- None."}
`;
}
