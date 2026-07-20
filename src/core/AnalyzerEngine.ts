import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadConfig } from "../config/index.js";
import { Scanner } from "./Scanner.js";
import type {
  AnalysisOptions,
  AnalysisReport,
  ReportSummary,
  LanguageBreakdown,
  DuplicateFileName,
  CircularImport,
  DependencyIssue,
  GitStats,
  TodoComment,
  HardcodedSecret,
  LargeAsset,
  DuplicateCodeBlock,
  ComplexityMetrics,
  FileInfo,
  FolderInfo,
} from "../types/index.js";
import { countLines, getDirectoryTree } from "../utils/file.js";
import {
  isGitRepository,
  getCommitCount,
  getBranchCount,
  getContributors,
  getLargestCommits,
  getFirstCommitDate,
  getLastCommitDate,
} from "../utils/git.js";
import { calculateScore, calculateCategoryScores } from "../utils/scoring.js";
import { LANGUAGE_EXTENSIONS, ENV_FILE_NAMES, LARGE_ASSET_EXTENSIONS } from "../constants/index.js";

interface AnalysisContext {
  rootPath: string;
  files: FileInfo[];
  fileContents: Map<string, string>;
}

export class AnalyzerEngine {
  private readonly options: AnalysisOptions;
  private readonly scanner: Scanner;

  constructor(options: AnalysisOptions) {
    loadConfig({ excludePatterns: options.excludePatterns });
    this.options = options;
    this.scanner = new Scanner(options);
  }

  async analyze(projectPath: string): Promise<AnalysisReport> {
    const startTime = Date.now();
    const rootPath = path.resolve(projectPath);

    const { files, folders, emptyFolders } = await this.scanner.scan(rootPath);

    const fileContents = await this.loadFileContents(rootPath, files);

    const ctx: AnalysisContext = { rootPath, files, fileContents };

    const languages = this.analyzeLanguages(files);
    const biggestFolders = this.getBiggestFolders(folders);
    const biggestFiles = this.getBiggestFiles(files);
    const duplicateFileNames = this.findDuplicateFileNames(files);
    const circularImports = this.findCircularImports(ctx);
    const dependencyIssues = await this.analyzeDependencies(ctx);
    const gitStats = this.analyzeGit(rootPath);
    const todoComments = this.findTodoComments(fileContents);
    const hardcodedSecrets = this.findHardcodedSecrets(fileContents);
    const largeAssets = this.findLargeAssets(files);
    const binaryFiles = files.filter((f) => f.isBinary).map((f) => f.path);
    const envFiles = this.findEnvFiles(files);
    const duplicateCode = this.findDuplicateCode(fileContents);
    const complexity = this.analyzeComplexity(files, fileContents);
    const projectSize = files.reduce((sum, f) => sum + f.size, 0);

    const missingReadme = !files.some((f) => /^readme\./i.test(path.basename(f.path)));
    const missingLicense = !files.some((f) => /^license/i.test(path.basename(f.path)));
    const missingGitignore = !files.some((f) => path.basename(f.path) === ".gitignore");
    const missingTests = !files.some(
      (f) => /\.(test|spec)\./i.test(f.path) || /\b(tests|__tests__|spec)\b/.test(f.path),
    );
    const missingCi = !files.some((f) => {
      const normalizedPath = f.path.replace(/\\/g, "/");
      return (
        normalizedPath.includes(".github/workflows/") ||
        normalizedPath === ".travis.yml" ||
        normalizedPath === "Jenkinsfile" ||
        normalizedPath === "azure-pipelines.yml" ||
        normalizedPath === "circle.yml" ||
        normalizedPath.endsWith(".gitlab-ci.yml")
      );
    });
    const documentationScore = this.calculateDocumentationScore(files, fileContents);

    const totalFolders = folders.length;

    const summary: ReportSummary = {
      totalFiles: files.length,
      totalFolders,
      totalSize: projectSize,
      languages: languages.length,
      contributors: gitStats?.contributorCount ?? 0,
      commits: gitStats?.commitCount ?? 0,
      branches: gitStats?.branchCount ?? 0,
      issues:
        circularImports.length +
        dependencyIssues.filter((d) => d.severity === "critical").length +
        hardcodedSecrets.length,
      warnings:
        dependencyIssues.filter((d) => d.severity === "warning").length +
        todoComments.length +
        duplicateFileNames.length +
        emptyFolders.length +
        largeAssets.length,
      errors: 0,
      score: 0,
    };

    const folderStructure = await getDirectoryTree(rootPath, "", this.options.excludePatterns);

    const intermediate: AnalysisReport = {
      projectName: path.basename(rootPath),
      projectPath: rootPath,
      analyzedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      summary,
      folderStructure,
      languages,
      biggestFolders,
      biggestFiles,
      fileCount: files.length,
      emptyFolders,
      duplicateFileNames,
      circularImports,
      dependencyIssues,
      gitStats,
      todoComments,
      hardcodedSecrets,
      largeAssets,
      binaryFiles,
      envFiles,
      duplicateCode,
      complexity,
      missingReadme,
      missingLicense,
      missingGitignore,
      missingTests,
      missingCi,
      projectSize,
      documentationScore,
      score: 0,
      categoryScores: [],
      recommendations: [],
      warnings: [],
      errors: [],
    };

    const report: AnalysisReport = {
      ...intermediate,
      categoryScores: calculateCategoryScores(intermediate),
      recommendations: this.generateRecommendations({
        missingReadme,
        missingLicense,
        missingGitignore,
        missingTests,
        missingCi,
        emptyFolders,
        duplicateFileNames,
        circularImports,
        dependencyIssues,
        todoComments,
        hardcodedSecrets,
        largeAssets,
        duplicateCode,
        complexity,
      }),
    };

    report.score = calculateScore(report);
    summary.score = report.score;
    report.summary = summary;

    return report;
  }

  private async loadFileContents(
    rootPath: string,
    files: FileInfo[],
  ): Promise<Map<string, string>> {
    const contents = new Map<string, string>();

    const loadTasks = files
      .filter((f) => !f.isBinary)
      .map(async (file) => {
        try {
          const fullPath = path.join(rootPath, file.path);
          const content = await readFile(fullPath, "utf-8");
          file.lines = countLines(content);
          return { path: file.path, content } as const;
        } catch {
          return null;
        }
      });

    const results = await Promise.all(loadTasks);
    for (const result of results) {
      if (result) {
        contents.set(result.path, result.content);
      }
    }

    return contents;
  }

  private analyzeLanguages(files: FileInfo[]): LanguageBreakdown[] {
    const langMap = new Map<string, { files: number; lines: number }>();
    for (const file of files) {
      const language =
        LANGUAGE_EXTENSIONS[file.extension] ?? (file.extension.slice(1).toUpperCase() || "Unknown");
      const existing = langMap.get(language);
      if (existing) {
        existing.files++;
        existing.lines += file.lines;
      } else {
        langMap.set(language, { files: 1, lines: file.lines });
      }
    }
    const totalFiles = files.length;
    return Array.from(langMap.entries())
      .map(([language, info]) => ({
        language,
        files: info.files,
        lines: info.lines,
        percentage: totalFiles > 0 ? Math.round((info.files / totalFiles) * 100) : 0,
      }))
      .sort((a, b) => b.files - a.files);
  }

  private getBiggestFolders(folders: FolderInfo[]): FolderInfo[] {
    return [...folders].sort((a, b) => b.totalSize - a.totalSize).slice(0, 10);
  }

  private getBiggestFiles(files: FileInfo[]): FileInfo[] {
    return [...files].sort((a, b) => b.size - a.size).slice(0, 10);
  }

  private findDuplicateFileNames(files: FileInfo[]): DuplicateFileName[] {
    const nameMap = new Map<string, string[]>();
    for (const file of files) {
      const name = path.basename(file.path);
      const existing = nameMap.get(name);
      if (existing) {
        existing.push(file.path);
      } else {
        nameMap.set(name, [file.path]);
      }
    }
    const duplicates: DuplicateFileName[] = [];
    for (const [name, paths] of nameMap) {
      if (paths.length > 1) {
        duplicates.push({ name, paths, count: paths.length });
      }
    }
    return duplicates.sort((a, b) => b.count - a.count);
  }

  private findCircularImports(ctx: AnalysisContext): CircularImport[] {
    const importMap = new Map<string, string[]>();
    const { rootPath, files, fileContents } = ctx;

    for (const file of files) {
      const content = fileContents.get(file.path);
      if (!content) {
        continue;
      }
      const ext = path.extname(file.path);
      if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) {
        continue;
      }
      const imports = this.extractImports(content);
      importMap.set(file.path, imports);
    }

    const resolvedMap = new Map<string, string[]>();
    for (const [filePath, imports] of importMap) {
      const resolved: string[] = [];
      for (const imp of imports) {
        const r = this.resolveImportPath(rootPath, filePath, imp);
        if (r) {
          resolved.push(r);
        }
      }
      resolvedMap.set(filePath, resolved);
    }

    const cycles: CircularImport[] = [];
    for (const [filePath, resolvedImports] of resolvedMap) {
      for (const target of resolvedImports) {
        const visited = new Set<string>([filePath]);
        const chain: string[] = [filePath];
        if (this.detectCycle(target, filePath, resolvedMap, visited, chain)) {
          cycles.push({ file: filePath, chain: [...chain, target] });
        }
      }
    }

    return this.deduplicateCycles(cycles);
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex =
      /(?:import\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|require\s*\(\s*["']([^"']+)["']\s*\))/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(content)) !== null) {
      const specifier = match[1] ?? match[2];
      if (specifier && (specifier.startsWith(".") || specifier.startsWith("/"))) {
        imports.push(specifier);
      }
    }
    return imports;
  }

  private resolveImportPath(
    rootPath: string,
    filePath: string,
    importSpecifier: string,
  ): string | null {
    const dir = path.dirname(path.join(rootPath, filePath));
    const resolved = path.resolve(dir, importSpecifier);
    const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ""];
    for (const ext of extensions) {
      const fullPath = resolved + ext;
      const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, "/");
      if (existsSync(fullPath)) {
        return relativePath;
      }
      const indexFile = path.join(resolved, `index${ext}`);
      if (existsSync(indexFile)) {
        return path.relative(rootPath, indexFile).replace(/\\/g, "/");
      }
    }
    return null;
  }

  private detectCycle(
    current: string,
    target: string,
    resolvedMap: Map<string, string[]>,
    visited: Set<string>,
    chain: string[],
  ): boolean {
    const resolved = resolvedMap.get(current);
    if (!resolved) {
      return false;
    }
    for (const imp of resolved) {
      if (imp === target) {
        return true;
      }
      if (imp === current) {
        continue;
      }
      if (!visited.has(imp)) {
        visited.add(imp);
        chain.push(imp);
        if (this.detectCycle(imp, target, resolvedMap, visited, chain)) {
          return true;
        }
        chain.pop();
        visited.delete(imp);
      }
    }
    return false;
  }

  private deduplicateCycles(cycles: CircularImport[]): CircularImport[] {
    const seen = new Set<string>();
    return cycles.filter((c) => {
      const key = c.file;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async analyzeDependencies(ctx: AnalysisContext): Promise<DependencyIssue[]> {
    const issues: DependencyIssue[] = [];
    const { rootPath, files, fileContents } = ctx;
    const packageJsonPath = path.join(rootPath, "package.json");

    if (!existsSync(packageJsonPath)) {
      return issues;
    }

    try {
      const content = await readFile(packageJsonPath, "utf-8");
      const pkg = JSON.parse(content) as Record<string, unknown>;
      const dependencies: Record<string, string> = {
        ...(pkg.dependencies as Record<string, string> | undefined),
        ...(pkg.devDependencies as Record<string, string> | undefined),
      };

      const allSource = Array.from(fileContents.values()).join("\n");

      for (const [dep] of Object.entries(dependencies)) {
        const usagePattern = new RegExp(
          `(?:from\\s+["']${this.escapeRegex(dep)}["']|require\\s*\\(\\s*["']${this.escapeRegex(dep)}["']\\s*\\))`,
          "g",
        );

        if (!usagePattern.test(allSource)) {
          const isReferenced = files.some((f) => {
            const fc = fileContents.get(f.path);
            return fc ? fc.includes(dep) : false;
          });

          if (!isReferenced) {
            const isDev = pkg.devDependencies
              ? (pkg.devDependencies as Record<string, string>)[dep] !== undefined
              : false;
            issues.push({
              name: dep,
              type: "unused",
              severity: "warning",
              details: `Dependency "${dep}" is listed in ${
                isDev ? "devDependencies" : "dependencies"
              } but never imported`,
            });
          }
        }
      }

      const knownPackages = new Set(Object.keys(dependencies));
      for (const [, content] of fileContents) {
        const importRegex = /(?:from\s+["']([^"']+)["']|require\s*\(\s*["']([^"']+)["']\s*\))/g;
        let m: RegExpExecArray | null;
        while ((m = importRegex.exec(content)) !== null) {
          const specifier = m[1] ?? m[2];
          if (!specifier) {
            continue;
          }
          if (specifier.startsWith(".") || specifier.startsWith("/")) {
            continue;
          }
          const pkgName = specifier.startsWith("@")
            ? specifier.split("/").slice(0, 2).join("/")
            : (specifier.split("/")[0] ?? specifier);
          if (!knownPackages.has(pkgName)) {
            issues.push({
              name: pkgName,
              type: "missing",
              severity: "critical",
              details: `"${pkgName}" is imported but not listed in package.json`,
            });
          }
        }
      }
    } catch {
      return issues;
    }

    const unique = new Map<string, DependencyIssue>();
    for (const issue of issues) {
      const key = `${issue.name}:${issue.type}`;
      if (!unique.has(key)) {
        unique.set(key, issue);
      }
    }

    return Array.from(unique.values()).slice(0, 50);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private analyzeGit(rootPath: string): GitStats | null {
    if (!isGitRepository(rootPath)) {
      return null;
    }

    return {
      commitCount: getCommitCount(rootPath),
      branchCount: getBranchCount(rootPath),
      contributorCount: getContributors(rootPath).length,
      contributors: getContributors(rootPath),
      largestCommits: getLargestCommits(rootPath),
      firstCommitDate: getFirstCommitDate(rootPath),
      lastCommitDate: getLastCommitDate(rootPath),
    };
  }

  private findTodoComments(fileContents: Map<string, string>): TodoComment[] {
    const comments: TodoComment[] = [];
    const regex = /\b(TODO|FIXME|HACK|XXX)\b[:\s]*(.*)$/gm;

    for (const [filePath, content] of fileContents) {
      if (filePath.includes("node_modules")) {
        continue;
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          continue;
        }
        regex.lastIndex = 0;
        const match = regex.exec(line);
        if (match) {
          comments.push({
            file: filePath,
            line: i + 1,
            type: match[1] as TodoComment["type"],
            text: (match[2] ?? "").trim(),
          });
        }
      }
    }

    return comments.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  }

  private findHardcodedSecrets(fileContents: Map<string, string>): HardcodedSecret[] {
    const secrets: HardcodedSecret[] = [];
    const patterns: { type: HardcodedSecret["type"]; regex: RegExp }[] = [
      {
        type: "private-key",
        regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i,
      },
      {
        type: "aws-key",
        regex:
          /(?:AKIA[0-9A-Z]{16}|(?:aws_access_key_id|aws_secret_access_key)\s*[:=]\s*["']?[A-Za-z0-9/+=]{16,})/,
      },
      {
        type: "github-token",
        regex: /(?:ghp_[0-9a-zA-Z]{36}|gho_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z]{22,})/,
      },
      {
        type: "discord-token",
        regex: /(?:[MN][A-Za-z\d]{23}\.[Xx][A-Za-z\d]{5,7}\.[A-Za-z\d]{26,})/,
      },
      {
        type: "google-api-key",
        regex: /AIza[0-9A-Za-z\-_]{35}/,
      },
      {
        type: "jwt-secret",
        regex: /(?:JWT_SECRET|jwt_secret)\s*[:=]\s*["']?.+["']?$/im,
      },
      {
        type: "password",
        regex: /(?:password|passwd|pwd)\s*[:=]\s*["']?.+["']?$/im,
      },
      {
        type: "generic-secret",
        regex: /(?:secret|token|api[_-]?key|apikey)\s*[:=]\s*["']?.{8,}["']?$/im,
      },
    ];

    for (const [filePath, content] of fileContents) {
      if (filePath.includes("node_modules") || filePath.includes(".git")) {
        continue;
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) {
          continue;
        }
        for (const { type, regex } of patterns) {
          regex.lastIndex = 0;
          if (regex.test(line)) {
            secrets.push({
              file: filePath,
              line: i + 1,
              type,
              context: line.trim().substring(0, 80),
            });
          }
        }
      }
    }

    return secrets;
  }

  private findLargeAssets(files: FileInfo[]): LargeAsset[] {
    const largeAssets: LargeAsset[] = [];
    for (const file of files) {
      const ext = path.extname(file.path).toLowerCase();
      if (LARGE_ASSET_EXTENSIONS.has(ext) && file.size > 100_000) {
        largeAssets.push({
          path: file.path,
          size: file.size,
          type: ext.slice(1).toUpperCase(),
        });
      }
    }
    return largeAssets.sort((a, b) => b.size - a.size);
  }

  private findEnvFiles(files: FileInfo[]): string[] {
    return files.filter((f) => ENV_FILE_NAMES.has(path.basename(f.path))).map((f) => f.path);
  }

  private findDuplicateCode(fileContents: Map<string, string>): DuplicateCodeBlock[] {
    const duplicates: DuplicateCodeBlock[] = [];
    const seen = new Map<string, { path: string }[]>();
    const sourceExts = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".cs", ".go", ".rs"]);

    for (const [filePath, content] of fileContents) {
      const ext = path.extname(filePath);
      if (!sourceExts.has(ext)) {
        continue;
      }
      const lines = content.split("\n");
      for (let i = 0; i < lines.length - 5; i++) {
        const block = lines.slice(i, i + 6).join("\n");
        const key = this.hashBlock(block);
        if (!key) {
          continue;
        }
        const existing = seen.get(key);
        if (existing) {
          const isDifferentFile = existing.every((e) => e.path !== filePath);
          if (isDifferentFile && duplicates.length < 10) {
            duplicates.push({
              files: [existing[0]?.path ?? "", filePath],
              lines: 6,
              similarity: 100,
              content: block.substring(0, 100),
            });
          }
        } else {
          seen.set(key, [{ path: filePath }]);
        }
      }
    }

    return duplicates;
  }

  private hashBlock(block: string): string | null {
    const normalized = block.replace(/^\s+/gm, "").replace(/\s+$/gm, "");
    if (normalized.length < 30) {
      return null;
    }
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = (hash << 5) - hash + normalized.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(36);
  }

  private analyzeComplexity(
    files: FileInfo[],
    fileContents: Map<string, string>,
  ): ComplexityMetrics[] {
    const metrics: ComplexityMetrics[] = [];
    const sourceExts = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".cs", ".go", ".rs"]);

    for (const file of files) {
      const ext = path.extname(file.path);
      if (!sourceExts.has(ext)) {
        continue;
      }
      const content = fileContents.get(file.path);
      if (!content) {
        continue;
      }
      const lines = content.split("\n");
      const codeLines = lines.filter(
        (l) => l.trim().length > 0 && !l.trim().startsWith("//") && !l.trim().startsWith("#"),
      ).length;
      const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);
      const functionCount = this.countFunctions(content);
      const maxNestingDepth = this.calculateMaxNestingDepth(lines);

      metrics.push({
        file: file.path,
        linesOfCode: codeLines,
        cyclomaticComplexity,
        functionCount,
        maxNestingDepth,
      });
    }
    return metrics.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);
  }

  private calculateCyclomaticComplexity(content: string): number {
    const decisionPoints = [
      /\bif\s*\(/g,
      /\belse\s+if\b/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\b\?\s*/g,
      /\|\|/g,
      /&&/g,
    ];
    let complexity = 1;
    for (const regex of decisionPoints) {
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }
    return complexity;
  }

  private countFunctions(content: string): number {
    const functionRegex =
      /(?:function\s+\w+|\w+\s*=\s*(?:async\s+)?function|\w+\s*\([^)]*\)\s*{|\b(async\s+)?\w+\s*\([^)]*\)\s*:\s*\w+)/g;
    const matches = content.match(functionRegex);
    return matches?.length ?? 0;
  }

  private calculateMaxNestingDepth(lines: string[]): number {
    let maxDepth = 0;
    let currentDepth = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.endsWith("{") || trimmed.endsWith("(")) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      const closeCount = (trimmed.match(/\}/g) ?? []).length;
      const openCount = (trimmed.match(/\{/g) ?? []).length;
      if (closeCount > openCount) {
        currentDepth -= closeCount - openCount;
      }
    }
    return maxDepth;
  }

  private calculateDocumentationScore(
    files: FileInfo[],
    fileContents: Map<string, string>,
  ): number {
    let score = 0;
    let totalChecks = 0;

    const readmeFiles = files.filter((f) => /^readme\./i.test(path.basename(f.path)));
    if (readmeFiles.length > 0) {
      const content = fileContents.get(readmeFiles[0]?.path ?? "");
      if (content) {
        score += Math.min(40, content.length / 50);
      }
    }
    totalChecks += 40;

    const docComments = files.filter((f) => /\.(md|mdx|txt)$/i.test(f.path)).length;
    score += Math.min(20, docComments * 5);
    totalChecks += 20;

    const tsDocs = files.filter((f) => /\.(ts|tsx)$/i.test(f.path)).length;
    score += Math.min(40, tsDocs * 2);
    totalChecks += 40;

    return totalChecks > 0 ? Math.round((score / totalChecks) * 100) : 0;
  }

  private generateRecommendations(config: {
    missingReadme: boolean;
    missingLicense: boolean;
    missingGitignore: boolean;
    missingTests: boolean;
    missingCi: boolean;
    emptyFolders: string[];
    duplicateFileNames: DuplicateFileName[];
    circularImports: CircularImport[];
    dependencyIssues: DependencyIssue[];
    todoComments: TodoComment[];
    hardcodedSecrets: HardcodedSecret[];
    largeAssets: LargeAsset[];
    duplicateCode: DuplicateCodeBlock[];
    complexity: ComplexityMetrics[];
  }): string[] {
    const recommendations: string[] = [];

    if (config.missingReadme) {
      recommendations.push("Add a README.md file to help users understand your project");
    }
    if (config.missingLicense) {
      recommendations.push("Add a LICENSE file to specify usage terms for your project");
    }
    if (config.missingGitignore) {
      recommendations.push("Add a .gitignore file to exclude build artifacts from version control");
    }
    if (config.missingTests) {
      recommendations.push("Add test files to improve code reliability and catch regressions");
    }
    if (config.missingCi) {
      recommendations.push("Set up a CI/CD pipeline for automated testing and deployment");
    }
    if (config.emptyFolders.length > 0) {
      recommendations.push(
        `Remove ${config.emptyFolders.length} empty folder(s) to keep the project structure clean`,
      );
    }
    if (config.duplicateFileNames.length > 0) {
      recommendations.push(
        `Resolve ${config.duplicateFileNames.length} duplicate file name(s) to avoid confusion in imports`,
      );
    }
    if (config.circularImports.length > 0) {
      recommendations.push(
        `Fix ${config.circularImports.length} circular import(s) to improve modularity and prevent runtime issues`,
      );
    }
    const criticalDeps = config.dependencyIssues.filter((d) => d.severity === "critical");
    if (criticalDeps.length > 0) {
      recommendations.push(
        `Address ${criticalDeps.length} critical dependency issue(s) by installing missing packages or removing unused ones`,
      );
    }
    if (config.hardcodedSecrets.length > 0) {
      recommendations.push(
        `Remove ${config.hardcodedSecrets.length} hardcoded secret(s); use environment variables or a secrets manager instead`,
      );
    }
    if (config.largeAssets.length > 0) {
      recommendations.push(
        `Optimize or move ${config.largeAssets.length} large asset(s) to external storage or a CDN`,
      );
    }
    if (config.todoComments.length > 5) {
      recommendations.push(
        `Address ${config.todoComments.length} TODO/FIXME comment(s) to improve code quality and completeness`,
      );
    }
    if (config.duplicateCode.length > 0) {
      recommendations.push(
        `Refactor ${config.duplicateCode.length} duplicate code block(s) into shared utilities or modules`,
      );
    }
    const highComplexity = config.complexity.filter((c) => c.cyclomaticComplexity > 15);
    if (highComplexity.length > 0) {
      recommendations.push(
        `Simplify ${highComplexity.length} overly complex function(s) with cyclomatic complexity above 15`,
      );
    }

    return recommendations;
  }
}
