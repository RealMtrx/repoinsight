import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadConfig, getConfig, getScoreWeights, getScoreThresholds } from "../../src/config/index.js";
import { SCORE_WEIGHTS_DEFAULT, SCORE_THRESHOLDS_DEFAULT } from "../../src/constants/index.js";

describe("config", () => {
  beforeEach(() => {
    loadConfig();
  });

  it("loadConfig returns a config object", () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });

  it("loadConfig with custom excludePatterns", () => {
    const config = loadConfig({ excludePatterns: ["*.log", "tmp/**"] });
    expect(config.excludePatterns).toEqual(["*.log", "tmp/**"]);
  });

  it("getConfig returns current config", () => {
    loadConfig({ maxFileSize: 5000 });
    const config = getConfig();
    expect(config.maxFileSize).toBe(5000);
  });

  it("getScoreWeights returns defaults when no weights set", () => {
    loadConfig();
    const weights = getScoreWeights();
    expect(weights).toEqual(SCORE_WEIGHTS_DEFAULT);
  });

  it("getScoreWeights returns custom weights", () => {
    const customWeights = { ...SCORE_WEIGHTS_DEFAULT, documentation: 30 };
    loadConfig({ scoreWeights: customWeights });
    const weights = getScoreWeights();
    expect(weights.documentation).toBe(30);
    expect(weights.testing).toBe(SCORE_WEIGHTS_DEFAULT.testing);
  });

  it("getScoreThresholds returns defaults when no thresholds set", () => {
    loadConfig();
    const thresholds = getScoreThresholds();
    expect(thresholds).toEqual(SCORE_THRESHOLDS_DEFAULT);
  });

  it("getScoreThresholds returns custom thresholds", () => {
    loadConfig({ scoreThresholds: { excellent: 95, good: 80, fair: 65, poor: 50 } });
    const thresholds = getScoreThresholds();
    expect(thresholds.excellent).toBe(95);
    expect(thresholds.poor).toBe(50);
  });
});

describe("config file loading", () => {
  const tempDirs: string[] = [];

  function makeConfigDir(configContent: Record<string, unknown>, fileName = "repoinsight.json") {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, fileName), JSON.stringify(configContent));
    return dir;
  }

  afterAll(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("loads excludePatterns from repoinsight.json", () => {
    const dir = makeConfigDir({ excludePatterns: ["vendor/**", "*.log"] });
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toEqual(["vendor/**", "*.log"]);
  });

  it("loads maxFileSize from repoinsight.json", () => {
    const dir = makeConfigDir({ maxFileSize: 5242880 });
    const config = loadConfig(undefined, dir);
    expect(config.maxFileSize).toBe(5242880);
  });

  it("merges custom scoreWeights from repoinsight.json with defaults", () => {
    const dir = makeConfigDir({ scoreWeights: { documentation: 30, testing: 10 } });
    const config = loadConfig(undefined, dir);
    expect(config.scoreWeights?.documentation).toBe(30);
    expect(config.scoreWeights?.testing).toBe(10);
    expect(config.scoreWeights?.security).toBe(SCORE_WEIGHTS_DEFAULT.security);
  });

  it("loads config from .repoinsightrc when repoinsight.json is absent", () => {
    const dir = makeConfigDir({ excludePatterns: ["rc-only/**"] }, ".repoinsightrc");
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toEqual(["rc-only/**"]);
  });

  it("loads config from package.json repoinsight key when no dedicated file exists", () => {
    const dir = makeConfigDir({ repoinsight: { excludePatterns: ["pkg-only/**"] } }, "package.json");
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toEqual(["pkg-only/**"]);
  });

  it("prefers repoinsight.json over .repoinsightrc and package.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, "repoinsight.json"), JSON.stringify({ excludePatterns: ["json/**"] }));
    writeFileSync(join(dir, ".repoinsightrc"), JSON.stringify({ excludePatterns: ["rc/**"] }));
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ repoinsight: { excludePatterns: ["pkg/**"] } }),
    );
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toEqual(["json/**"]);
  });

  it("returns defaults for a directory with no config file", () => {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    tempDirs.push(dir);
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toEqual([]);
    expect(config.maxFileSize).toBeUndefined();
    expect(config.scoreWeights).toEqual(SCORE_WEIGHTS_DEFAULT);
  });

  it("falls back to defaults when the config file is invalid JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, "repoinsight.json"), "not valid json{{");
    const config = loadConfig(undefined, dir);
    expect(config.scoreWeights).toEqual(SCORE_WEIGHTS_DEFAULT);
    expect(config.excludePatterns).toEqual([]);
  });
});

describe(".repoinsightignore", () => {
  const tempDirs: string[] = [];

  function makeIgnoreDir(ignoreContent: string, withConfig?: Record<string, unknown>) {
    const dir = mkdtempSync(join(tmpdir(), "ignore-test-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, ".repoinsightignore"), ignoreContent);
    if (withConfig) {
      writeFileSync(join(dir, "repoinsight.json"), JSON.stringify(withConfig));
    }
    return dir;
  }

  afterAll(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("loads patterns from .repoinsightignore", () => {
    const dir = makeIgnoreDir("vendor/**\n*.log\n");
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toContain("vendor/**");
    expect(config.excludePatterns).toContain("*.log");
  });

  it("ignores comments and blank lines in .repoinsightignore", () => {
    const dir = makeIgnoreDir("# comment\n\n  \nbuild/**\n");
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toContain("build/**");
    expect(config.excludePatterns).not.toContain("# comment");
    expect(config.excludePatterns?.some((p) => p.trim() === "")).toBe(false);
  });

  it("merges .repoinsightignore patterns with repoinsight.json excludePatterns", () => {
    const dir = makeIgnoreDir("vendor/**", { excludePatterns: ["dist/**"] });
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toContain("dist/**");
    expect(config.excludePatterns).toContain("vendor/**");
  });

  it("deduplicates patterns from config and ignore file", () => {
    const dir = makeIgnoreDir("shared/**", { excludePatterns: ["shared/**"] });
    const config = loadConfig(undefined, dir);
    const matches = config.excludePatterns?.filter((p) => p === "shared/**");
    expect(matches?.length).toBe(1);
  });

  it("returns no ignore patterns when the file is absent", () => {
    const dir = mkdtempSync(join(tmpdir(), "ignore-test-"));
    tempDirs.push(dir);
    const config = loadConfig(undefined, dir);
    expect(config.excludePatterns).toEqual([]);
  });
});
