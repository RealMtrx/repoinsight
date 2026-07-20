import { SCORE_WEIGHTS_DEFAULT } from "../constants/index.js";
import type { RepoInsightConfig, ScoreWeights } from "../types/index.js";

let config: RepoInsightConfig = {};

export function loadConfig(userConfig?: Partial<RepoInsightConfig>): RepoInsightConfig {
  config = {
    excludePatterns: userConfig?.excludePatterns,
    maxFileSize: userConfig?.maxFileSize,
    scoreWeights: userConfig?.scoreWeights ?? SCORE_WEIGHTS_DEFAULT,
  };
  return config;
}

export function getConfig(): RepoInsightConfig {
  return config;
}

export function getScoreWeights(): ScoreWeights {
  return config.scoreWeights ?? SCORE_WEIGHTS_DEFAULT;
}
