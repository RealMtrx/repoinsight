import { promises as fs, existsSync, type Dirent } from "node:fs";
import path from "node:path";
import { DEFAULT_EXCLUDE_PATTERNS, MAX_FILE_SIZE_DEFAULT } from "../constants/index.js";
import type { AnalysisOptions, FileInfo, FolderInfo } from "../types/index.js";
import { isBinaryFile } from "../utils/file.js";

export interface ScanResult {
  files: FileInfo[];
  folders: FolderInfo[];
  emptyFolders: string[];
}

const EXCLUDE_CACHE_SIZE = 50;
const STAT_CONCURRENCY = 200;

function entryName(entry: Dirent): string {
  return typeof entry.name === "string" ? entry.name : String(entry.name);
}

export class Scanner {
  private readonly excludeRegexes: RegExp[];

  constructor(options: AnalysisOptions) {
    this.excludeRegexes = [...DEFAULT_EXCLUDE_PATTERNS, ...options.excludePatterns].map((p) =>
      Scanner.patternToRegex(p),
    );
  }

  async scan(rootPath: string): Promise<ScanResult> {
    const resolvedRoot = path.resolve(rootPath);
    const files: FileInfo[] = [];
    const emptyFolders: string[] = [];
    const folderMap = new Map<string, { fileCount: number; totalSize: number }>();
    const linkSet = new Set<string>();

    await this.walkDirectory(resolvedRoot, resolvedRoot, files, folderMap, emptyFolders, linkSet);

    const folders: FolderInfo[] = [];
    for (const [folderPath, info] of folderMap) {
      folders.push({ path: folderPath, fileCount: info.fileCount, totalSize: info.totalSize });
    }

    return { files, folders, emptyFolders };
  }

  private async walkDirectory(
    dirPath: string,
    rootPath: string,
    files: FileInfo[],
    folderMap: Map<string, { fileCount: number; totalSize: number }>,
    emptyFolders: string[],
    linkSet: Set<string>,
  ): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    const dirRelative = path.relative(rootPath, dirPath);
    const isSubDir = dirRelative.length > 0;
    let hasEntries = false;

    const subDirs: string[] = [];
    const fileEntries: string[] = [];

    for (const entry of entries) {
      const name = entryName(entry);
      const fullPath = path.join(dirPath, name);
      const relativePath = path.relative(rootPath, fullPath);

      if (this.shouldExclude(relativePath)) {
        continue;
      }

      if (entry.isSymbolicLink()) {
        try {
          const realPath = await fs.realpath(fullPath);
          if (linkSet.has(realPath)) {
            continue;
          }
          linkSet.add(realPath);
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            subDirs.push(name);
          } else {
            fileEntries.push(name);
          }
        } catch {
          continue;
        }
      } else if (entry.isDirectory()) {
        subDirs.push(name);
      } else if (entry.isFile()) {
        fileEntries.push(name);
      }
      hasEntries = true;
    }

    const parentDir = path.relative(rootPath, dirPath);
    const batchSize = STAT_CONCURRENCY;
    for (let i = 0; i < fileEntries.length; i += batchSize) {
      const batch = fileEntries.slice(i, i + batchSize);
      const stats = await Promise.all(
        batch.map(async (name) => {
          const fullPath = path.join(dirPath, name);
          try {
            const stat = await fs.stat(fullPath);
            return { name, stat };
          } catch {
            return null;
          }
        }),
      );

      for (const result of stats) {
        if (!result) {
          continue;
        }
        const { name, stat } = result;
        const relativePath = path.relative(rootPath, path.join(dirPath, name));

        const existing = folderMap.get(parentDir);
        if (existing) {
          existing.fileCount++;
          existing.totalSize += stat.size;
        } else {
          folderMap.set(parentDir, { fileCount: 1, totalSize: stat.size });
        }

        if (stat.size <= MAX_FILE_SIZE_DEFAULT) {
          files.push({
            path: relativePath,
            size: stat.size,
            lines: 0,
            extension: path.extname(name).toLowerCase(),
            isBinary: isBinaryFile(name),
          });
        }
      }
    }

    await Promise.all(
      subDirs.map((dir) =>
        this.walkDirectory(
          path.join(dirPath, dir),
          rootPath,
          files,
          folderMap,
          emptyFolders,
          linkSet,
        ),
      ),
    );

    if (!hasEntries && isSubDir) {
      emptyFolders.push(dirRelative);
    }
  }

  private readonly excludeCache = new Map<string, boolean>();

  private shouldExclude(relativePath: string): boolean {
    const cached = this.excludeCache.get(relativePath);
    if (cached !== undefined) {
      return cached;
    }

    const normalized = relativePath.replace(/\\/g, "/");
    for (const regex of this.excludeRegexes) {
      if (regex.test(normalized)) {
        if (this.excludeCache.size < EXCLUDE_CACHE_SIZE) {
          this.excludeCache.set(relativePath, true);
        }
        return true;
      }
    }
    if (this.excludeCache.size < EXCLUDE_CACHE_SIZE) {
      this.excludeCache.set(relativePath, false);
    }
    return false;
  }

  static patternToRegex(pattern: string): RegExp {
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "@@DOUBLESTAR@@")
      .replace(/\*/g, "[^/]*")
      .replace(/@@DOUBLESTAR@@/g, ".*");
    return new RegExp(`^${regexStr}$`);
  }

  static findProjectRoot(startPath: string): string {
    let current = path.resolve(startPath);
    const root = path.parse(current).root;
    while (true) {
      if (current === root) {
        return startPath;
      }
      try {
        if (existsSync(path.join(current, ".git"))) {
          return current;
        }
      } catch {
        return startPath;
      }
      const parent = path.dirname(current);
      if (parent === current) {
        return startPath;
      }
      current = parent;
    }
  }
}
