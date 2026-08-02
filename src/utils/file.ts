import { promises as fs } from "node:fs";
import path from "node:path";
import { BINARY_EXTENSIONS } from "../constants/index.js";

export function isBinaryFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatFileSize(bytes: number): string {
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${FILE_SIZE_UNITS[unitIndex]}`;
}

export function countLines(content: string): number {
  if (content.length === 0) {
    return 0;
  }
  let count = 0;
  let index = 0;
  while (index < content.length) {
    if (content[index] === "\n") {
      count++;
    }
    index++;
  }
  if (!content.endsWith("\n")) {
    count++;
  }
  return count;
}

export async function getDirectoryTree(
  dirPath: string,
  prefix = "",
  excludePatterns: string[] = [],
): Promise<string> {
  let entries: string[];
  try {
    entries = await fs.readdir(dirPath);
  } catch {
    return "";
  }

  const filtered: { name: string; isDir: boolean }[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry);
    const relativePath = path.relative(dirPath, fullPath);
    if (shouldExclude(relativePath, excludePatterns)) {
      continue;
    }
    let stat;
    try {
      stat = await fs.stat(fullPath);
    } catch {
      continue;
    }
    filtered.push({ name: entry, isDir: stat.isDirectory() });
  }

  filtered.sort((a, b) => {
    if (a.isDir && !b.isDir) {
      return -1;
    }
    if (!a.isDir && b.isDir) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });

  let result = "";
  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    if (!entry) {
      continue;
    }
    const isLast = i === filtered.length - 1;
    const connector = isLast ? "\u2514\u2500\u2500 " : "\u251C\u2500\u2500 ";
    result += `${prefix}${connector}${entry.name}\n`;
    if (entry.isDir) {
      const newPrefix = prefix + (isLast ? "    " : "\u2502   ");
      result += await getDirectoryTree(path.join(dirPath, entry.name), newPrefix, excludePatterns);
    }
  }
  return result;
}

function shouldExclude(relativePath: string, excludePatterns: string[]): boolean {
  const normalized = relativePath.replace(/\\/g, "/");
  for (const pattern of excludePatterns) {
    const regex = new RegExp(
      "^" +
        pattern
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*\*/g, "@@DS@@")
          .replace(/\*/g, "[^/]*")
          .replace(/@@DS@@/g, ".*") +
        "$",
    );
    if (regex.test(normalized)) {
      return true;
    }
  }
  return false;
}
