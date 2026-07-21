import type { AnalysisReport, AnalysisOptions } from "../types/index.js";
import { detectTarget } from "../utils/detectTarget.js";

export async function runAnalysis(
  directory: string,
  opts?: Partial<AnalysisOptions>,
): Promise<AnalysisReport> {
  const { AnalysisOptionsModel } = await import("../models/AnalysisOptionsModel.js");
  const { AnalyzerEngine } = await import("../core/AnalyzerEngine.js");
  const { loadConfig } = await import("../config/index.js");

  loadConfig();
  const options = AnalysisOptionsModel.create({
    path: directory,
    useCache: opts?.useCache,
    incremental: opts?.incremental,
    scopeType: opts?.scopeType,
    targetPath: opts?.targetPath,
  }).toObject();

  const scope = detectTarget(options.targetPath ?? directory);

  const engine = new AnalyzerEngine(options);
  const report = await engine.analyze(directory, scope);

  return report;
}
