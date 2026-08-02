import { execFileSync } from "node:child_process";
import type { ContributorInfo, LargeCommit } from "../types/index.js";

const GIT_TIMEOUT_MS = 15_000;

function runGit(repoPath: string, args: string[]): string {
  const result = execFileSync("git", args, {
    cwd: repoPath,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    timeout: GIT_TIMEOUT_MS,
    maxBuffer: 10 * 1024 * 1024,
  });
  return result;
}

export function isGitRepository(repoPath: string): boolean {
  try {
    runGit(repoPath, ["rev-parse", "--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

export function getCommitCount(repoPath: string): number {
  try {
    const result = runGit(repoPath, ["rev-list", "--count", "HEAD"]);
    const trimmed = result.trim();
    return trimmed ? Number.parseInt(trimmed, 10) : 0;
  } catch {
    return 0;
  }
}

export function getBranchCount(repoPath: string): number {
  try {
    const result = runGit(repoPath, ["branch", "--list"]);
    return result
      .trim()
      .split("\n")
      .map((l) => l.replace(/^\*\s*/, "").trim())
      .filter(Boolean).length;
  } catch {
    return 0;
  }
}

export function getContributors(repoPath: string): ContributorInfo[] {
  try {
    const result = runGit(repoPath, ["log", "--format=%an|%ae"]);
    const counts = new Map<string, { name: string; email: string; count: number }>();
    for (const line of result.trim().split("\n")) {
      if (!line) {
        continue;
      }
      const parts = line.split("|");
      const name = parts[0] ?? "";
      const email = parts[1] ?? "";
      const key = `${name}:${email}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count++;
      } else {
        counts.set(key, { name, email, count: 1 });
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .map((c) => ({ name: c.name, email: c.email, commitCount: c.count }));
  } catch {
    return [];
  }
}

export function getLargestCommits(repoPath: string, limit = 10): LargeCommit[] {
  try {
    const rawLog = runGit(repoPath, ["log", "--all", "--format=---%n%H|%an|%s|%ai", "--shortstat"]);
    const commits: LargeCommit[] = [];
    const blocks = rawLog.split("---\n").filter((b) => b.trim().length > 0);
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const header = lines[0];
      if (!header) {
        continue;
      }
      const parts = header.split("|");
      const hash = parts[0] ?? "";
      const author = parts[1] ?? "";
      const message = parts.slice(2, -1).join("|");
      const date = parts[parts.length - 1] ?? "";
      const statLine = lines[1] ?? "";
      const filesMatch = /(\d+)\s+file/.exec(statLine);
      const filesChanged = filesMatch ? Number.parseInt(filesMatch[1] ?? "0", 10) : 0;
      commits.push({ hash, author, message, filesChanged, date });
    }
    return commits.sort((a, b) => b.filesChanged - a.filesChanged).slice(0, limit);
  } catch {
    return [];
  }
}

export function getFirstCommitDate(repoPath: string): string | null {
  try {
    const result = runGit(repoPath, ["log", "--reverse", "--format=%ai"]);
    const first = result.trim().split("\n")[0];
    return first ?? null;
  } catch {
    return null;
  }
}

export function getLastCommitDate(repoPath: string): string | null {
  try {
    const result = runGit(repoPath, ["log", "-1", "--format=%ai"]);
    const trimmed = result.trim();
    return trimmed || null;
  } catch {
    return null;
  }
}
