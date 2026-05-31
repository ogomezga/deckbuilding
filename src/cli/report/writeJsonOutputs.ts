import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { OrchestrateAgentWorkflowOutput } from "../../features/orchestrate-agent-workflow/index.js";

export async function writeJsonOutputs(outputDir: string, output: OrchestrateAgentWorkflowOutput): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await Promise.all([
    writeFile(join(outputDir, "analysis.json"), JSON.stringify(output.session, null, 2)),
    writeFile(join(outputDir, "diagnosis.json"), JSON.stringify(output.session.diagnosis, null, 2)),
    writeFile(join(outputDir, "recommendations.json"), JSON.stringify(output.session.recommendations, null, 2))
  ]);
}

export async function writeJsonOutputsBesideReport(reportPath: string, output: OrchestrateAgentWorkflowOutput): Promise<void> {
  await writeJsonOutputs(dirname(reportPath), output);
}
