import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const IGNORE_FILE = ".repoinsightignore";

export function readIgnorePatterns(dir: string): string[] {
  const filePath = join(dir, IGNORE_FILE);
  let raw: string;
  try {
    if (!existsSync(filePath)) {
      return [];
    }
    raw = readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const patterns: string[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    if (line.startsWith("!")) {
      continue;
    }
    const cleaned = line.replace(/\/+$/, "");
    if (cleaned) {
      patterns.push(cleaned);
    }
  }
  return patterns;
}
