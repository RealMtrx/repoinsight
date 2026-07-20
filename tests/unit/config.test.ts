import { describe, it, expect, beforeEach } from "vitest";
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
