import { existsSync, statSync } from "node:fs";
import path from "node:path";

interface ScopeResult {
  type: "file" | "directory" | "repository";
  targetPath: string;
}

export function detectTarget(inputPath: string): ScopeResult {
  const resolved = path.resolve(inputPath);

  if (!existsSync(resolved)) {
    return { type: "repository", targetPath: resolved };
  }

  const stat = statSync(resolved);

  if (stat.isFile()) {
    return { type: "file", targetPath: resolved };
  }

  if (stat.isDirectory()) {
    const gitDir = path.join(resolved, ".git");
    if (existsSync(gitDir) && statSync(gitDir).isDirectory()) {
      return { type: "repository", targetPath: resolved };
    }
    return { type: "directory", targetPath: resolved };
  }

  return { type: "repository", targetPath: resolved };
}

export function scopeLabel(type: "file" | "directory" | "repository"): string {
  switch (type) {
    case "file":
      return "File";
    case "directory":
      return "Directory";
    case "repository":
      return "Repository";
  }
}

export function scopeIcon(type: "file" | "directory" | "repository"): string {
  switch (type) {
    case "file":
      return "\uD83D\uDCC4";
    case "directory":
      return "\uD83D\uDCC1";
    case "repository":
      return "\uD83D\uDCE6";
  }
}
