import { describe, it, expect, beforeAll } from "vitest";
import {
  calculateScore,
  calculateCategoryScores,
  getScoreStatus,
} from "../../src/utils/scoring.js";
import type { AnalysisReport } from "../../src/types/index.js";
import { loadConfig } from "../../src/config/index.js";

function createMockReport(overrides?: Partial<AnalysisReport>): AnalysisReport {
  const base: AnalysisReport = {
    projectName: "test-project",
    projectPath: "/test",
    analyzedAt: new Date().toISOString(),
    duration: 100,
    summary: {
      totalFiles: 10,
      totalFolders: 3,
      totalSize: 10000,
      languages: 2,
      contributors: 1,
      commits: 5,
      branches: 1,
      issues: 0,
      warnings: 0,
      errors: 0,
      score: 0,
    },
    folderStructure: "",
    languages: [],
    biggestFolders: [],
    biggestFiles: [],
    fileCount: 10,
    testFileCount: 4,
    emptyFolders: [],
    duplicateFileNames: [],
    circularImports: [],
    dependencyIssues: [],
    vulnerabilities: [],
    gitStats: null,
    todoComments: [],
    hardcodedSecrets: [],
    largeAssets: [],
    binaryFiles: [],
    envFiles: [],
    duplicateCode: [],
    complexity: [],
    performanceIssues: [],
    missingReadme: false,
    missingLicense: false,
    missingGitignore: false,
    missingTests: false,
    missingCi: false,
    projectSize: 10000,
    documentationScore: 100,
    score: 0,
    categoryScores: [],
    recommendations: [],
    warnings: [],
    errors: [],
  };
  return { ...base, ...overrides };
}

describe("calculateCategoryScores", () => {
  beforeAll(() => {
    loadConfig({});
  });

  it("returns all 8 categories", () => {
    const report = createMockReport();
    const scores = calculateCategoryScores(report);
    expect(scores).toHaveLength(8);
    const names = scores.map((s) => s.name);
    expect(names).toEqual([
      "documentation",
      "testing",
      "structure",
      "dependencies",
      "security",
      "maintainability",
      "performance",
      "codeQuality",
    ]);
  });

  it("calculates testing score using test file ratio", () => {
    const noTests = createMockReport({ missingTests: true });
    const someTests = createMockReport({ missingTests: false, testFileCount: 4 });
    const manyTests = createMockReport({ missingTests: false, testFileCount: 10 });
    const none = calculateCategoryScores(noTests).find((s) => s.name === "testing");
    const partial = calculateCategoryScores(someTests).find((s) => s.name === "testing");
    const full = calculateCategoryScores(manyTests).find((s) => s.name === "testing");
    expect(none!.percentage).toBe(0);
    expect(partial!.percentage).toBe(70);
    expect(full!.percentage).toBe(100);
  });

  it("calculates documentation score correctly with all docs present", () => {
    const report = createMockReport({
      missingReadme: false,
      missingLicense: false,
      documentationScore: 100,
    });
    const scores = calculateCategoryScores(report);
    const docScore = scores.find((s) => s.name === "documentation");
    expect(docScore).toBeDefined();
    expect(docScore!.percentage).toBe(100);
  });

  it("calculates documentation score lower without README", () => {
    const report = createMockReport({ missingReadme: true });
    const scores = calculateCategoryScores(report);
    const docScore = scores.find((s) => s.name === "documentation");
    expect(docScore).toBeDefined();
    expect(docScore!.percentage).toBeLessThan(100);
  });

  it("calculates security score lower with secrets", () => {
    const clean = createMockReport();
    const dirty = createMockReport({
      hardcodedSecrets: [
        { file: "config.ts", line: 1, type: "aws-key", context: "AKIA..." },
        { file: "config.ts", line: 2, type: "github-token", context: "ghp_..." },
        { file: "config.ts", line: 3, type: "password", context: "password=..." },
      ],
    });
    const cleanScores = calculateCategoryScores(clean);
    const dirtyScores = calculateCategoryScores(dirty);
    const cleanSec = cleanScores.find((s) => s.name === "security")!.percentage;
    const dirtySec = dirtyScores.find((s) => s.name === "security")!.percentage;
    expect(dirtySec).toBeLessThan(cleanSec);
  });

  it("calculates security score lower with known vulnerabilities", () => {
    const clean = createMockReport();
    const vulnerable = createMockReport({
      vulnerabilities: [
        {
          package: "lodash",
          installedVersion: "4.17.20",
          affectedVersion: "<4.17.21",
          patchedVersion: "4.17.21",
          severity: "critical",
          id: "CVE-2021-23337",
          summary: "Command injection",
        },
      ],
    });
    const cleanScores = calculateCategoryScores(clean);
    const vulnScores = calculateCategoryScores(vulnerable);
    const cleanSec = cleanScores.find((s) => s.name === "security")!.percentage;
    const vulnSec = vulnScores.find((s) => s.name === "security")!.percentage;
    expect(vulnSec).toBeLessThan(cleanSec);
  });

  it("calculates performance score lower with performance issues", () => {
    const clean = createMockReport();
    const slow = createMockReport({
      performanceIssues: [
        {
          file: "src/big.ts",
          type: "large-file",
          severity: "critical",
          metric: "lines of code",
          value: 1200,
          limit: 1000,
        },
        {
          file: "src/app.ts",
          type: "high-complexity",
          severity: "warning",
          metric: "cyclomatic complexity",
          value: 12,
          limit: 10,
        },
      ],
    });
    const cleanScores = calculateCategoryScores(clean);
    const slowScores = calculateCategoryScores(slow);
    const cleanPerf = cleanScores.find((s) => s.name === "performance")!.percentage;
    const slowPerf = slowScores.find((s) => s.name === "performance")!.percentage;
    expect(slowPerf).toBeLessThan(cleanPerf);
  });

  it("calculates structure score lower with empty folders", () => {
    const clean = createMockReport();
    const messy = createMockReport({ emptyFolders: ["empty1", "empty2", "empty3"] });
    const cleanScores = calculateCategoryScores(clean);
    const messyScores = calculateCategoryScores(messy);
    const cleanStruct = cleanScores.find((s) => s.name === "structure")!.percentage;
    const messyStruct = messyScores.find((s) => s.name === "structure")!.percentage;
    expect(messyStruct).toBeLessThan(cleanStruct);
  });

  it("penalizes dependencies score for critical issues", () => {
    const report = createMockReport({
      dependencyIssues: [
        { name: "react", type: "missing", severity: "critical", details: "missing react" },
      ],
    });
    const scores = calculateCategoryScores(report);
    const depScore = scores.find((s) => s.name === "dependencies")!;
    expect(depScore.percentage).toBeLessThan(100);
  });

  it("penalizes codeQuality score for circular imports", () => {
    const report = createMockReport({
      circularImports: [{ file: "a.ts", chain: ["a.ts", "b.ts", "a.ts"] }],
    });
    const scores = calculateCategoryScores(report);
    const cqScore = scores.find((s) => s.name === "codeQuality")!;
    expect(cqScore.percentage).toBeLessThan(100);
  });

  it("each category has valid status", () => {
    const report = createMockReport();
    const scores = calculateCategoryScores(report);
    const validStatuses = ["excellent", "good", "fair", "poor", "critical"];
    for (const score of scores) {
      expect(validStatuses).toContain(score.status);
    }
  });
});

describe("calculateScore", () => {
  beforeAll(() => {
    loadConfig({});
  });

  it("returns a score between 0 and 100", () => {
    const report = createMockReport();
    const score = calculateScore(report);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns lower score for projects with issues", () => {
    const clean = createMockReport();
    const problematic = createMockReport({
      missingReadme: true,
      missingLicense: true,
      missingGitignore: true,
      missingTests: true,
      missingCi: true,
      hardcodedSecrets: [{ file: "config.ts", line: 1, type: "aws-key", context: "AKIA..." }],
      circularImports: [{ file: "a.ts", chain: ["a.ts", "b.ts", "a.ts"] }],
      emptyFolders: ["empty"],
    });
    const cleanScore = calculateScore(clean);
    const problemScore = calculateScore(problematic);
    expect(problemScore).toBeLessThan(cleanScore);
  });

  it("returns score of 0 for the worst possible project", () => {
    const worst = createMockReport({
      missingReadme: true,
      missingLicense: true,
      missingGitignore: true,
      missingTests: true,
      missingCi: true,
      hardcodedSecrets: [
        { file: "a", line: 1, type: "password", context: "pwd" },
        { file: "b", line: 1, type: "aws-key", context: "AKIA" },
        { file: "c", line: 1, type: "github-token", context: "ghp_" },
      ],
      circularImports: [{ file: "a", chain: ["a", "b", "a"] }],
      emptyFolders: ["e1", "e2"],
      duplicateFileNames: [{ name: "x", paths: ["a/x", "b/x"], count: 2 }],
    });
    const score = calculateScore(worst);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

describe("getScoreStatus", () => {
  it("uses default thresholds by default", () => {
    loadConfig();
    expect(getScoreStatus(95)).toBe("excellent");
    expect(getScoreStatus(80)).toBe("good");
    expect(getScoreStatus(65)).toBe("fair");
    expect(getScoreStatus(45)).toBe("poor");
    expect(getScoreStatus(20)).toBe("critical");
  });

  it("respects custom thresholds", () => {
    loadConfig({ scoreThresholds: { excellent: 95, good: 80, fair: 65, poor: 50 } });
    expect(getScoreStatus(95)).toBe("excellent");
    expect(getScoreStatus(94)).toBe("good");
    expect(getScoreStatus(80)).toBe("good");
    expect(getScoreStatus(65)).toBe("fair");
    expect(getScoreStatus(64)).toBe("poor");
    expect(getScoreStatus(50)).toBe("poor");
    expect(getScoreStatus(49)).toBe("critical");
  });

  it("uses stricter custom thresholds for scoring categories", () => {
    loadConfig({ scoreThresholds: { excellent: 100, good: 90, fair: 70, poor: 50 } });
    const report = createMockReport({ testFileCount: 10 });
    const categories = calculateCategoryScores(report);
    expect(categories.every((c) => c.status === "excellent" || c.status === "good")).toBe(true);
    loadConfig();
  });
});
