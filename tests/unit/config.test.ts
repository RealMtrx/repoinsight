import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { loadConfig, getConfig, getScoreWeights } from "../../src/config/index.js";
import { SCORE_WEIGHTS_DEFAULT } from "../../src/constants/index.js";

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
    expect(config.excludePatterns).toBeUndefined();
    expect(config.maxFileSize).toBeUndefined();
    expect(config.scoreWeights).toEqual(SCORE_WEIGHTS_DEFAULT);
  });

  it("falls back to defaults when the config file is invalid JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "config-test-"));
    tempDirs.push(dir);
    writeFileSync(join(dir, "repoinsight.json"), "not valid json{{");
    const config = loadConfig(undefined, dir);
    expect(config.scoreWeights).toEqual(SCORE_WEIGHTS_DEFAULT);
    expect(config.excludePatterns).toBeUndefined();
  });
});
