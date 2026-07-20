import type { z } from "zod";
import type { AnalysisOptionsSchema, ReportFormatSchema } from "./schemas.js";

export type AnalysisOptions = z.infer<typeof AnalysisOptionsSchema>;

export type ReportFormat = z.infer<typeof ReportFormatSchema>;

export interface RepoInsightConfig {
  excludePatterns?: string[];
  maxFileSize?: number;
  scoreWeights?: ScoreWeights;
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

export interface AnalysisReport {
  projectName: string;
  projectPath: string;
  analyzedAt: string;
  duration: number;
  summary: ReportSummary;
  folderStructure: string;
  languages: LanguageBreakdown[];
  biggestFolders: FolderInfo[];
  biggestFiles: FileInfo[];
  fileCount: number;
  emptyFolders: string[];
  duplicateFileNames: DuplicateFileName[];
  circularImports: CircularImport[];
  dependencyIssues: DependencyIssue[];
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
