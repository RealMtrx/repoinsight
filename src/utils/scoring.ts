import type { AnalysisReport, CategoryScore, ScoreStatus } from "../types/index.js";
import { getConfig, getScoreWeights } from "../config/index.js";
import { SCORE_THRESHOLDS_DEFAULT } from "../constants/index.js";

export function calculateScore(report: AnalysisReport): number {
  const weights = getScoreWeights();
  const categories = calculateCategoryScores(report);
  let totalScore = 0;
  let totalWeight = 0;
  const weightMap = weights as unknown as Record<string, number>;
  for (const category of categories) {
    const weight = weightMap[category.name];
    if (weight) {
      totalScore += category.percentage * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

export function calculateCategoryScores(report: AnalysisReport): CategoryScore[] {
  return [
    calculateDocumentationScore(report),
    calculateTestingScore(report),
    calculateStructureScore(report),
    calculateDependenciesScore(report),
    calculateSecurityScore(report),
    calculateMaintainabilityScore(report),
    calculatePerformanceScore(report),
    calculateCodeQualityScore(report),
  ];
}

export function getScoreStatus(percentage: number): ScoreStatus {
  const config = getConfig();
  const thresholds = config.scoreThresholds ?? SCORE_THRESHOLDS_DEFAULT;
  if (percentage >= thresholds.excellent) {
    return "excellent";
  }
  if (percentage >= thresholds.good) {
    return "good";
  }
  if (percentage >= thresholds.fair) {
    return "fair";
  }
  if (percentage >= thresholds.poor) {
    return "poor";
  }
  return "critical";
}

function capScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function calculateDocumentationScore(report: AnalysisReport): CategoryScore {
  let score = 0;
  if (!report.missingReadme) {
    score += 35;
  }
  if (!report.missingLicense) {
    score += 25;
  }
  if (report.documentationScore > 0) {
    score += Math.min(40, Math.round(report.documentationScore / 2.5));
  }
  score = capScore(score);
  return {
    name: "documentation",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateTestingScore(report: AnalysisReport): CategoryScore {
  let score = 0;
  if (!report.missingTests) {
    score += 50;
    const ratio =
      report.summary.totalFiles > 0
        ? Math.min(1, report.testFileCount / report.summary.totalFiles)
        : 0;
    score += Math.min(50, Math.round(ratio * 50));
  }
  score = capScore(score);
  return {
    name: "testing",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateStructureScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  if (report.emptyFolders.length > 0) {
    score -= Math.min(30, report.emptyFolders.length * 5);
  }
  if (report.duplicateFileNames.length > 0) {
    score -= Math.min(20, report.duplicateFileNames.length * 3);
  }
  score = capScore(score);
  return {
    name: "structure",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateDependenciesScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  for (const issue of report.dependencyIssues) {
    score -= issue.severity === "critical" ? 15 : 5;
  }
  score = capScore(score);
  return {
    name: "dependencies",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateSecurityScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  for (const _ of report.hardcodedSecrets) {
    score -= 20;
  }
  for (const vuln of report.vulnerabilities ?? []) {
    score -= vuln.severity === "critical" ? 20 : 10;
  }
  if (report.envFiles.length > 0) {
    score -= 10;
  }
  score = capScore(score);
  return {
    name: "security",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateMaintainabilityScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  if (report.todoComments.length > 5) {
    score -= 10;
  }
  if (report.duplicateCode.length > 0) {
    score -= Math.min(30, report.duplicateCode.length * 5);
  }
  if (report.circularImports.length > 0) {
    score -= Math.min(20, report.circularImports.length * 3);
  }
  score = capScore(score);
  return {
    name: "maintainability",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculatePerformanceScore(report: AnalysisReport): CategoryScore {
  let score = 100;
  if (report.largeAssets.length > 0) {
    score -= Math.min(30, report.largeAssets.length * 5);
  }
  if (report.binaryFiles.length > 10) {
    score -= 10;
  }
  for (const issue of report.performanceIssues ?? []) {
    score -= issue.severity === "critical" ? 8 : 4;
  }
  score = capScore(score);
  return {
    name: "performance",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}

function calculateCodeQualityScore(report: AnalysisReport): CategoryScore {
  let score = 90;
  if (!report.missingGitignore) {
    score += 5;
  }
  if (!report.missingCi) {
    score += 5;
  }
  if (report.circularImports.length > 0) {
    score -= Math.min(30, report.circularImports.length * 10);
  }
  const complexFiles = report.complexity.filter((c) => c.cyclomaticComplexity > 10);
  if (complexFiles.length > 0) {
    score -= Math.min(20, complexFiles.length * 5);
  }
  score = capScore(score);
  return {
    name: "codeQuality",
    score,
    maxScore: 100,
    percentage: score,
    status: getScoreStatus(score),
  };
}
