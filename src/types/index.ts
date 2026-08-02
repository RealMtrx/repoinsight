import type { z } from "zod";
import type { AnalysisOptionsSchema, ReportFormatSchema } from "./schemas.js";

export type AnalysisOptions = z.infer<typeof AnalysisOptionsSchema>;

export type ReportFormat = z.infer<typeof ReportFormatSchema>;

export interface RepoInsightConfig {
  excludePatterns?: string[];
  maxFileSize?: number;
  scoreWeights?: ScoreWeights;
  scoreThresholds?: ScoreThresholds;
}

export interface ScoreThresholds {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
}

export interface ScoreWeights {
  documentation: number;
  testing: number;
  structure: number;
  dependencies: number;
  security: number;
  maintainability: number;
  performance: number;
  codeQuality: number;
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: ScoreStatus;
}

export type ScoreStatus = "excellent" | "good" | "fair" | "poor" | "critical";

export interface FileInfo {
  path: string;
  size: number;
  lines: number;
  extension: string;
  isBinary: boolean;
}

export interface FolderInfo {
  path: string;
  fileCount: number;
  totalSize: number;
}

export interface LanguageBreakdown {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface DuplicateFileName {
  name: string;
  paths: string[];
  count: number;
}

export interface CircularImport {
  file: string;
  chain: string[];
}

export interface DependencyIssue {
  name: string;
  type: "unused" | "missing" | "outdated";
  severity: "warning" | "critical";
  details: string;
}

export interface VulnerabilityInfo {
  package: string;
  installedVersion: string;
  affectedVersion: string;
  patchedVersion: string;
  severity: "warning" | "critical";
  id: string;
  summary: string;
}

export interface GitStats {
  commitCount: number;
  branchCount: number;
  contributorCount: number;
  contributors: ContributorInfo[];
  largestCommits: LargeCommit[];
  firstCommitDate: string | null;
  lastCommitDate: string | null;
}

export interface ContributorInfo {
  name: string;
  email: string;
  commitCount: number;
}

export interface LargeCommit {
  hash: string;
  author: string;
  message: string;
  filesChanged: number;
  date: string;
}

export interface TodoComment {
  file: string;
  line: number;
  type: "TODO" | "FIXME" | "HACK" | "XXX";
  text: string;
}

export interface HardcodedSecret {
  file: string;
  line: number;
  type: SecretType;
  context: string;
}

export type SecretType =
  | "private-key"
  | "aws-key"
  | "github-token"
  | "discord-token"
  | "google-api-key"
  | "jwt-secret"
  | "password"
  | "generic-secret";

export interface LargeAsset {
  path: string;
  size: number;
  type: string;
}

export interface DuplicateCodeBlock {
  files: string[];
  lines: number;
  similarity: number;
  content: string;
}

export interface ComplexityMetrics {
  file: string;
  linesOfCode: number;
  cyclomaticComplexity: number;
  functionCount: number;
  maxNestingDepth: number;
}

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type MonorepoTool = "turborepo" | "nx" | "lerna" | "workspaces";
export type CiProvider =
  "github-actions" | "gitlab-ci" | "azure-pipelines" | "circleci" | "travis-ci" | "jenkins";
export type Framework =
  | "next"
  | "react"
  | "vue"
  | "svelte"
  | "angular"
  | "astro"
  | "nuxt"
  | "express"
  | "nestjs"
  | "fastify";
export type TestFramework = "vitest" | "jest" | "mocha" | "playwright" | "cypress";
export type Linter = "eslint" | "prettier" | "biome";
export type GitHook = "husky" | "commitlint";
export type ChangesetTool = "changesets";

export interface DetectedTechnologies {
  packageManager: PackageManager | null;
  packageManagerVersion: string | null;
  monorepo: MonorepoTool | null;
  workspaces: boolean;
  frameworks: Framework[];
  testFrameworks: TestFramework[];
  linters: Linter[];
  gitHooks: GitHook[];
  changesets: boolean;
  ciProviders: CiProvider[];
  docker: boolean;
  dockerCompose: boolean;
  git: boolean;
  nodeVersion: string | null;
  typescript: boolean;
  javascript: boolean;
  hasReadme: boolean;
  hasLicense: boolean;
  hasSecurity: boolean;
  hasContributing: boolean;
  npmPackageType: "application" | "library" | null;
  hasChangesetsConfig: boolean;
}

export type ScopeType = "file" | "directory" | "repository";

export interface AnalyzeTarget {
  path: string;
  type: ScopeType;
  enabled: boolean;
}

export interface MultiAnalysisResult {
  path: string;
  type: ScopeType;
  name: string;
  report: AnalysisReport;
  error?: string;
}

export interface MultiAnalysisSummary {
  results: MultiAnalysisResult[];
  totalTargets: number;
  totalFiles: number;
  repositories: number;
  directories: number;
  files: number;
  averageScore: number;
  bestProject: { name: string; score: number } | null;
  worstProject: { name: string; score: number } | null;
}

export interface AnalysisScope {
  type: ScopeType;
  targetPath: string;
}

export interface AnalysisReport {
  projectName: string;
  projectPath: string;
  scope: AnalysisScope;
  analyzedAt: string;
  duration: number;
  summary: ReportSummary;
  folderStructure: string;
  technologies: DetectedTechnologies;
  languages: LanguageBreakdown[];
  biggestFolders: FolderInfo[];
  biggestFiles: FileInfo[];
  fileCount: number;
  emptyFolders: string[];
  duplicateFileNames: DuplicateFileName[];
  circularImports: CircularImport[];
  dependencyIssues: DependencyIssue[];
  vulnerabilities: VulnerabilityInfo[];
  gitStats: GitStats | null;
  todoComments: TodoComment[];
  hardcodedSecrets: HardcodedSecret[];
  largeAssets: LargeAsset[];
  binaryFiles: string[];
  envFiles: string[];
  duplicateCode: DuplicateCodeBlock[];
  complexity: ComplexityMetrics[];
  missingReadme: boolean;
  missingLicense: boolean;
  missingGitignore: boolean;
  missingTests: boolean;
  missingCi: boolean;
  projectSize: number;
  documentationScore: number;
  score: number;
  categoryScores: CategoryScore[];
  recommendations: string[];
  warnings: string[];
  errors: string[];
}

export interface ReportSummary {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  languages: number;
  contributors: number;
  commits: number;
  branches: number;
  issues: number;
  warnings: number;
  errors: number;
  score: number;
}
