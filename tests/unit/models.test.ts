import { describe, it, expect } from "vitest";
import { AnalysisOptionsModel } from "../../src/models/AnalysisOptionsModel.js";
import { ReportModel } from "../../src/models/ReportModel.js";
import type { AnalysisReport } from "../../src/types/index.js";

describe("AnalysisOptionsModel", () => {
  it("creates with default values", () => {
    const model = AnalysisOptionsModel.create();
    expect(model.path).toBe(".");
    expect(model.excludePatterns).toEqual([]);
    expect(model.verbose).toBe(false);
    expect(model.timeout).toBe(30000);
    expect(model.maxFileSize).toBe(10_485_760);
  });

  it("creates with custom values", () => {
    const model = AnalysisOptionsModel.create({
      path: "/test",
      excludePatterns: ["*.log"],
      verbose: true,
      timeout: 60000,
      maxFileSize: 1024,
    });
    expect(model.path).toBe("/test");
    expect(model.excludePatterns).toEqual(["*.log"]);
    expect(model.verbose).toBe(true);
    expect(model.timeout).toBe(60000);
    expect(model.maxFileSize).toBe(1024);
  });

  it("converts to object", () => {
    const model = AnalysisOptionsModel.create({ path: "/test" });
    const obj = model.toObject();
    expect(obj.path).toBe("/test");
    expect(obj.excludePatterns).toEqual([]);
  });
});

describe("ReportModel", () => {
  const mockReport: AnalysisReport = {
    projectName: "test",
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
      issues: 1,
      warnings: 2,
      errors: 0,
      score: 75,
    },
    folderStructure: "",
    languages: [],
    biggestFolders: [],
    biggestFiles: [],
    fileCount: 10,
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
    missingReadme: false,
    missingLicense: false,
    missingGitignore: false,
    missingTests: false,
    missingCi: false,
    projectSize: 10000,
    documentationScore: 100,
    score: 75,
    categoryScores: [],
    recommendations: ["Add README"],
    warnings: ["Missing tests"],
    errors: [],
  };

  it("returns score", () => {
    const model = new ReportModel(mockReport);
    expect(model.score).toBe(75);
  });

  it("returns summary", () => {
    const model = new ReportModel(mockReport);
    expect(model.summary.totalFiles).toBe(10);
  });

  it("detects critical issues", () => {
    const model = new ReportModel(mockReport);
    expect(model.hasCriticalIssues()).toBe(false);
  });

  it("detects warnings", () => {
    const model = new ReportModel(mockReport);
    expect(model.hasWarnings()).toBe(true);
  });

  it("converts to JSON string", () => {
    const model = new ReportModel(mockReport);
    const json = model.toJSON();
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(parsed.projectName).toBe("test");
  });

  it("converts to object", () => {
    const model = new ReportModel(mockReport);
    const obj = model.toObject();
    expect(obj.projectName).toBe("test");
    expect(obj.score).toBe(75);
  });
});
