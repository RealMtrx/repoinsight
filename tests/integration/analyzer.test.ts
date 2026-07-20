import { describe, it, expect } from "vitest";
import path from "node:path";
import { AnalyzerEngine } from "../../src/core/AnalyzerEngine.js";
import { AnalysisOptionsModel } from "../../src/models/AnalysisOptionsModel.js";
import { Scanner } from "../../src/core/Scanner.js";

describe("AnalyzerEngine Integration", () => {
  const projectRoot = path.resolve(".");
  const defaultOptions = AnalysisOptionsModel.create({
    path: projectRoot,
    excludePatterns: [],
  });

  it("analyzes its own repository", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);

    expect(report.projectName).toBe(path.basename(projectRoot));
    expect(report.projectPath).toBe(projectRoot);
    expect(report.duration).toBeGreaterThan(0);
    expect(report.score).toBeDefined();
    expect(typeof report.score).toBe("number");
    expect(report.fileCount).toBeGreaterThan(0);
    expect(report.languages.length).toBeGreaterThan(0);
  });

  it("returns file counts", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.fileCount).toBeGreaterThan(0);
    expect(report.summary.totalFiles).toBe(report.fileCount);
  });

  it("detects TypeScript as primary language", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    const ts = report.languages.find((l) => l.language === "TypeScript");
    expect(ts).toBeDefined();
    expect(ts!.files).toBeGreaterThan(0);
  });

  it("finds Git repository", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.gitStats).not.toBeNull();
    expect(report.gitStats!.commitCount).toBeGreaterThan(0);
  });

  it("detects README exists", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.missingReadme).toBe(false);
  });

  it("detects LICENSE exists", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.missingLicense).toBe(false);
  });

  it("detects .gitignore exists", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.missingGitignore).toBe(false);
  });

  it("detects CI configuration exists", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.missingCi).toBe(false);
  });

  it("detects tests directory", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.missingTests).toBe(false);
  });

  it("returns category scores", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(report.categoryScores.length).toBe(8);
    for (const cat of report.categoryScores) {
      expect(cat.percentage).toBeGreaterThanOrEqual(0);
      expect(cat.percentage).toBeLessThanOrEqual(100);
    }
  });

  it("generates recommendations", async () => {
    const engine = new AnalyzerEngine(defaultOptions.toObject());
    const report = await engine.analyze(projectRoot);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });
});

describe("Scanner Integration", () => {
  it("scans current directory", async () => {
    const scanner = new Scanner({
      path: ".",
      excludePatterns: [],
      verbose: false,
      timeout: 30000,
      maxFileSize: 10_485_760,
    });
    const result = await scanner.scan(process.cwd());
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.folders.length).toBeGreaterThan(0);
  });

  it("excludes node_modules by default", async () => {
    const scanner = new Scanner({
      path: ".",
      excludePatterns: [],
      verbose: false,
      timeout: 30000,
      maxFileSize: 10_485_760,
    });
    const result = await scanner.scan(process.cwd());
    const hasNodeModules = result.files.some((f) => f.path.startsWith("node_modules"));
    expect(hasNodeModules).toBe(false);
  });

  it("finds project root", () => {
    const root = Scanner.findProjectRoot(process.cwd());
    expect(root).toBeTruthy();
  });
});
