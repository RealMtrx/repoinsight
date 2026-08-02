import { describe, it, expect } from "vitest";
import {
  generateAnnotations,
  toAnnotationLine,
  type Annotation,
} from "../../src/annotations/index.js";
import type { AnalysisReport } from "../../src/types/index.js";

function createMockReport(overrides?: Partial<AnalysisReport>): AnalysisReport {
  const base: AnalysisReport = {
    projectName: "test-project",
    projectPath: "/workspace",
    scope: { type: "repository", targetPath: "/workspace" },
    analyzedAt: "2025-01-01T00:00:00.000Z",
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
      score: 75,
    },
    folderStructure: "",
    technologies: {
      packageManager: "npm",
      packageManagerVersion: "9.x",
      monorepo: null,
      workspaces: false,
      frameworks: [],
      testFrameworks: [],
      linters: [],
      gitHooks: [],
      changesets: false,
      ciProviders: [],
      docker: false,
      dockerCompose: false,
      git: false,
      nodeVersion: null,
      typescript: false,
      javascript: false,
      hasReadme: true,
      hasLicense: true,
      hasSecurity: false,
      hasContributing: false,
      npmPackageType: null,
      hasChangesetsConfig: false,
    },
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
    licenseSpdx: "MIT",
    licenseName: "MIT License",
    missingGitignore: false,
    missingTests: false,
    missingCi: false,
    projectSize: 10000,
    documentationScore: 100,
    score: 85,
    categoryScores: [],
    recommendations: [],
    warnings: [],
    errors: [],
  };
  return { ...base, ...overrides };
}

describe("annotations", () => {
  it("emits error for hardcoded secrets with file and line", () => {
    const report = createMockReport({
      hardcodedSecrets: [{ file: "/workspace/config.ts", line: 5, type: "aws-key", context: "AKIA..." }],
    });
    const result = generateAnnotations(report, "/workspace");
    expect(result).toContainEqual(
      expect.objectContaining({ level: "error", file: "config.ts", line: 5 }),
    );
  });

  it("emits error for critical vulnerabilities pointing at package.json", () => {
    const report = createMockReport({
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
    const result = generateAnnotations(report, "/workspace");
    expect(result.some((a) => a.level === "error" && a.title === "CVE-2021-23337")).toBe(true);
  });

  it("emits warning for non-critical vulnerabilities", () => {
    const report = createMockReport({
      vulnerabilities: [
        {
          package: "minimist",
          installedVersion: "1.2.5",
          affectedVersion: "<1.2.6",
          patchedVersion: "1.2.6",
          severity: "warning",
          id: "CVE-2021-44906",
          summary: "Prototype pollution",
        },
      ],
    });
    const result = generateAnnotations(report, "/workspace");
    expect(result[0]?.level).toBe("warning");
  });

  it("emits notice annotations for TODO comments", () => {
    const report = createMockReport({
      todoComments: [{ file: "/workspace/app.ts", line: 10, type: "TODO", text: "refactor" }],
    });
    const result = generateAnnotations(report, "/workspace");
    expect(result.some((a) => a.level === "notice" && a.line === 10)).toBe(true);
  });

  it("emits warning for circular imports", () => {
    const report = createMockReport({
      circularImports: [{ file: "/workspace/a.ts", chain: ["a.ts", "b.ts", "a.ts"] }],
    });
    const result = generateAnnotations(report, "/workspace");
    expect(result.some((a) => a.level === "warning" && a.title === "Circular import")).toBe(true);
  });

  it("formats workflow command lines", () => {
    const ann: Annotation = { level: "error", file: "src/a.ts", line: 2, message: "boom" };
    expect(toAnnotationLine(ann)).toBe("::error file=src/a.ts,line=2::boom");
  });

  it("escapes properties in workflow command lines", () => {
    const ann: Annotation = { level: "error", file: "a:b,c.ts", line: 3, message: "x 100%" };
    const line = toAnnotationLine(ann);
    expect(line).toBe("::error file=a%3Ab%2Cc.ts,line=3::x 100%25");
  });
});