import { describe, it, expect, beforeEach, vi } from "vitest";
import { TerminalReporter } from "../../src/reporters/TerminalReporter.js";
import { MarkdownReporter } from "../../src/reporters/MarkdownReporter.js";
import type { AnalysisReport } from "../../src/types/index.js";

function createMockReport(overrides?: Partial<AnalysisReport>): AnalysisReport {
  const base: AnalysisReport = {
    projectName: "test-project",
    projectPath: "/test/path",
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
      frameworks: ["react"],
      testFrameworks: ["vitest"],
      linters: ["eslint", "prettier"],
      gitHooks: [],
      changesets: false,
      ciProviders: ["github-actions"],
      docker: true,
      dockerCompose: false,
      git: true,
      nodeVersion: ">=18.0.0",
      typescript: true,
      javascript: true,
      hasReadme: true,
      hasLicense: true,
      hasSecurity: false,
      hasContributing: false,
      npmPackageType: "application",
      hasChangesetsConfig: false,
    },
    languages: [
      { language: "TypeScript", files: 8, lines: 500, percentage: 80 },
      { language: "JavaScript", files: 2, lines: 100, percentage: 20 },
    ],
    biggestFolders: [],
    biggestFiles: [],
    fileCount: 10,
    emptyFolders: [],
    duplicateFileNames: [],
    circularImports: [],
    dependencyIssues: [],
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
    categoryScores: [
      { name: "documentation", score: 50, maxScore: 50, percentage: 100, status: "excellent" },
      { name: "testing", score: 40, maxScore: 50, percentage: 80, status: "good" },
      { name: "structure", score: 30, maxScore: 50, percentage: 60, status: "fair" },
      { name: "dependencies", score: 20, maxScore: 50, percentage: 40, status: "poor" },
      { name: "security", score: 10, maxScore: 50, percentage: 20, status: "critical" },
      { name: "maintainability", score: 45, maxScore: 50, percentage: 90, status: "excellent" },
      { name: "performance", score: 35, maxScore: 50, percentage: 70, status: "good" },
      { name: "codeQuality", score: 25, maxScore: 50, percentage: 50, status: "fair" },
    ],
    recommendations: ["Add a README file", "Add tests"],
    warnings: [],
    errors: [],
  };
  return { ...base, ...overrides };
}

describe("TerminalReporter", () => {
  let reporter: TerminalReporter;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reporter = new TerminalReporter();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("renders without throwing", () => {
    const report = createMockReport();
    expect(() => reporter.render(report)).not.toThrow();
  });

  it("renders header with project name", () => {
    const report = createMockReport();
    reporter.render(report);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("renders technologies section", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Technologies");
  });

  it("renders npm package manager in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("npm");
    expect(calls).toContain("9.x");
  });

  it("renders frameworks in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("react");
  });

  it("renders testing frameworks in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("vitest");
  });

  it("renders linters in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("eslint");
  });

  it("renders CI providers in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("github-actions");
  });

  it("renders Docker in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Docker");
  });

  it("renders Node version in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain(">=18.0.0");
  });

  it("renders Lang TypeScript in technologies", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("TypeScript");
  });

  it("renders category scores", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Category");
    expect(calls).toContain("documentation");
  });

  it("renders languages table", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Language");
    expect(calls).toContain("TypeScript");
  });

  it("renders recommendations", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Recommendations");
    expect(calls).toContain("README");
  });

  it("renders summary section", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Files");
    expect(calls).toContain("Score");
  });

  it("renders footer with duration", () => {
    const report = createMockReport();
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Analyzed");
  });

  it("renders hardcoded secrets section when present", () => {
    const report = createMockReport({
      hardcodedSecrets: [{ file: "config.ts", line: 5, type: "aws-key", context: "AKIA12345" }],
    });
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Hardcoded");
  });

  it("renders TODO comments section when present", () => {
    const report = createMockReport({
      todoComments: [{ file: "index.ts", line: 42, type: "TODO", text: "fix this later" }],
    });
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("TODO");
  });

  it("does not throw with minimal report data", () => {
    const minimal = createMockReport({
      technologies: {
        packageManager: null,
        packageManagerVersion: null,
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
        hasReadme: false,
        hasLicense: false,
        hasSecurity: false,
        hasContributing: false,
        npmPackageType: null,
        hasChangesetsConfig: false,
      },
      categoryScores: [],
      languages: [],
      recommendations: [],
    });
    expect(() => reporter.render(minimal)).not.toThrow();
  });

  it("renders git statistics when gitStats present", () => {
    const report = createMockReport({
      gitStats: {
        commitCount: 10,
        branchCount: 3,
        contributorCount: 2,
        contributors: [],
        largestCommits: [
          {
            hash: "abc",
            author: "dev",
            message: "big commit",
            filesChanged: 5,
            date: "2025-01-01",
          },
        ],
        firstCommitDate: "2024-01-01",
        lastCommitDate: "2025-01-01",
      },
    });
    reporter.render(report);
    const calls = consoleLogSpy.mock.calls.map((c) => c[0]).join("");
    expect(calls).toContain("Commits");
    expect(calls).toContain("10");
  });
});

describe("MarkdownReporter", () => {
  let reporter: MarkdownReporter;

  beforeEach(() => {
    reporter = new MarkdownReporter();
  });

  it("renders without throwing", () => {
    const report = createMockReport();
    expect(() => reporter.render(report)).not.toThrow();
  });

  it("returns a string", () => {
    const report = createMockReport();
    const result = reporter.render(report);
    expect(typeof result).toBe("string");
  });

  it("contains technologies section", () => {
    const report = createMockReport();
    const result = reporter.render(report);
    expect(result).toContain("Technologies");
  });

  it("contains the project name in heading", () => {
    const report = createMockReport({ projectName: "my-awesome-project" });
    const result = reporter.render(report);
    expect(result).toContain("my-awesome-project");
  });

  it("contains summary table", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("Summary");
    expect(result).toContain("| Files");
  });

  it("contains overall score", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("Overall Score");
  });

  it("contains package manager info in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("npm");
    expect(result).toContain("9.x");
  });

  it("contains frameworks in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("react");
  });

  it("contains testing frameworks in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("vitest");
  });

  it("contains linters in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("eslint");
  });

  it("contains CI providers in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("github-actions");
  });

  it("contains Docker in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("Docker");
  });

  it("contains Node version in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain(">=18.0.0");
  });

  it("contains TypeScript in technologies", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("TypeScript");
  });

  it("contains category scores", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("Category Scores");
    expect(result).toContain("documentation");
  });

  it("contains languages", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("Languages");
    expect(result).toContain("TypeScript");
  });

  it("contains recommendations", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("Recommendations");
    expect(result).toContain("README");
  });

  it("contains issues section", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("Issues");
  });

  it("contains no issues detected when empty", () => {
    const result = reporter.render(createMockReport());
    expect(result).toContain("No issues detected");
  });

  it("contains hardcoded secrets when present", () => {
    const report = createMockReport({
      hardcodedSecrets: [{ file: "config.ts", line: 5, type: "aws-key", context: "AKIA12345" }],
    });
    const result = reporter.render(report);
    expect(result).toContain("Hardcoded Secrets");
  });

  it("contains TODO comments when present", () => {
    const report = createMockReport({
      todoComments: [{ file: "app.ts", line: 10, type: "TODO", text: "refactor" }],
    });
    const result = reporter.render(report);
    expect(result).toContain("TODO/FIXME");
  });

  it("contains git statistics when gitStats present", () => {
    const report = createMockReport({
      gitStats: {
        commitCount: 50,
        branchCount: 5,
        contributorCount: 3,
        contributors: [],
        largestCommits: [],
        firstCommitDate: "2024-06-01",
        lastCommitDate: "2025-01-01",
      },
    });
    const result = reporter.render(report);
    expect(result).toContain("Git Statistics");
    expect(result).toContain("50");
  });

  it("does not include empty sections when data missing", () => {
    const minimal = createMockReport({
      technologies: {
        packageManager: null,
        packageManagerVersion: null,
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
        hasReadme: false,
        hasLicense: false,
        hasSecurity: false,
        hasContributing: false,
        npmPackageType: null,
        hasChangesetsConfig: false,
      },
      categoryScores: [],
      languages: [],
      recommendations: [],
    });
    const result = reporter.render(minimal);
    expect(result).not.toContain("| Package");
    expect(result).toContain("Issues");
    expect(result).toContain("No issues detected");
  });
});
