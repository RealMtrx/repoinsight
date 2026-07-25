import type { AnalysisReport, MultiAnalysisSummary } from "../types/index.js";

export class JsonReporter {
  render(report: AnalysisReport): string {
    return JSON.stringify(report, null, 2);
  }

  renderMulti(summary: MultiAnalysisSummary): string {
    const output = {
      type: "multi-analysis",
      totalTargets: summary.totalTargets,
      repositories: summary.repositories,
      directories: summary.directories,
      files: summary.files,
      totalFiles: summary.totalFiles,
      averageScore: summary.averageScore,
      bestProject: summary.bestProject,
      worstProject: summary.worstProject,
      results: summary.results.map((r) => ({
        path: r.path,
        type: r.type,
        name: r.name,
        error: r.error ?? null,
        report: r.report ?? null,
      })),
    };
    return JSON.stringify(output, null, 2);
  }
}
