import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SCORE_WEIGHTS_DEFAULT } from "../constants/index.js";
import type { RepoInsightConfig, ScoreWeights } from "../types/index.js";

let config: RepoInsightConfig = {};

function readJsonFile(filePath: string): Record<string, unknown> | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    return JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readConfigFile(dir: string): Partial<RepoInsightConfig> | null {
  const jsonConfig = readJsonFile(join(dir, "repoinsight.json"));
  if (jsonConfig) {
    return jsonConfig;
  }

  const rcConfig = readJsonFile(join(dir, ".repoinsightrc"));
  if (rcConfig) {
    return rcConfig;
  }

  const pkg = readJsonFile(join(dir, "package.json"));
  if (pkg?.repoinsight && typeof pkg.repoinsight === "object") {
    return pkg.repoinsight;
  }

  return null;
}

export function loadConfig(
  userConfig?: Partial<RepoInsightConfig>,
  dir?: string,
): RepoInsightConfig {
  const baseDir = dir ?? process.cwd();
  const fileConfig = readConfigFile(baseDir) ?? {};
  const excludePatterns = userConfig?.excludePatterns ?? fileConfig.excludePatterns;

  config = {
    excludePatterns,
    maxFileSize: userConfig?.maxFileSize ?? fileConfig.maxFileSize,
    scoreWeights: {
      ...SCORE_WEIGHTS_DEFAULT,
      ...fileConfig.scoreWeights,
      ...userConfig?.scoreWeights,
    },
  };
  return config;
}

export function getConfig(): RepoInsightConfig {
  return config;
}

export function getScoreWeights(): ScoreWeights {
  return config.scoreWeights ?? SCORE_WEIGHTS_DEFAULT;
}
