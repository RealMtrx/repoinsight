import { describe, it, expect } from "vitest";
import { Scanner } from "../../src/core/Scanner.js";
import type { AnalysisOptions } from "../../src/types/index.js";

const defaultOptions: AnalysisOptions = {
  path: ".",
  excludePatterns: [],
  verbose: false,
  timeout: 30000,
  maxFileSize: 10_485_760,
};

describe("Scanner edge cases", () => {
  it("scans current directory without error", async () => {
    const scanner = new Scanner(defaultOptions);
    const result = await scanner.scan(".");
    expect(result).toHaveProperty("files");
    expect(result).toHaveProperty("folders");
    expect(result).toHaveProperty("emptyFolders");
    expect(Array.isArray(result.files)).toBe(true);
    expect(Array.isArray(result.folders)).toBe(true);
    expect(Array.isArray(result.emptyFolders)).toBe(true);
  });

  it("handles non-existent directory gracefully", async () => {
    const scanner = new Scanner(defaultOptions);
    const result = await scanner.scan("/nonexistent-path-xyz-123");
    expect(result.files.length).toBe(0);
    expect(result.folders.length).toBe(0);
  });

  it("patternToRegex creates correct regex", () => {
    const regex = Scanner.patternToRegex("node_modules/**");
    expect(regex.test("node_modules/something/file.js")).toBe(true);
    expect(regex.test("src/index.ts")).toBe(false);
  });

  it("patternToRegex handles simple wildcard", () => {
    const regex = Scanner.patternToRegex("*.log");
    expect(regex.test("debug.log")).toBe(true);
    expect(regex.test("debug.log.gz")).toBe(false);
  });

  it("findProjectRoot returns current directory", () => {
    const root = Scanner.findProjectRoot(".");
    expect(typeof root).toBe("string");
    expect(root.length).toBeGreaterThan(0);
  });

  it("handles exclude patterns", async () => {
    const opts: AnalysisOptions = { ...defaultOptions, excludePatterns: ["src/**"] };
    const scanner = new Scanner(opts);
    const result = await scanner.scan(".");
    const srcFiles = result.files.filter((f) => f.path.startsWith("src"));
    expect(srcFiles.length).toBe(0);
  });
});
