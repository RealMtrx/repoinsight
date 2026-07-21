import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { detectTarget } from "./detectTarget.js";
import type { AnalyzeTarget } from "../types/index.js";

const WIN_DRIVE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getWindowsDrives(): string[] {
  try {
    const output = execSync(`wmic logicaldisk get name 2>nul`, {
      encoding: "utf-8",
      stdio: "pipe",
      windowsHide: true,
      timeout: 5000,
    });
    return output
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^[A-Z]:$/.test(l))
      .map((l) => l + "\\");
  } catch {
    return WIN_DRIVE_LETTERS.map((l) => `${l}:\\`).filter((d) => existsSync(d));
  }
}

function getUnixMountPoints(): string[] {
  const roots: string[] = ["/"];
  try {
    const output = execSync("mount -l 2>/dev/null || true", {
      encoding: "utf-8",
      stdio: "pipe",
      windowsHide: true,
      timeout: 5000,
    });
    const lines = output.split("\n");
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const mountPoint = parts[2];
        if (
          mountPoint &&
          mountPoint !== "/" &&
          mountPoint.startsWith("/") &&
          !mountPoint.startsWith("/dev") &&
          !mountPoint.startsWith("/sys") &&
          !mountPoint.startsWith("/proc") &&
          !mountPoint.startsWith("/run") &&
          !mountPoint.startsWith("/snap")
        ) {
          roots.push(mountPoint);
        }
      }
    }
  } catch {
    // fallback
  }
  return [...new Set(roots)];
}

export function getSystemDrives(): string[] {
  if (process.platform === "win32") {
    return getWindowsDrives();
  }
  return getUnixMountPoints();
}

export function getSystemTargets(): AnalyzeTarget[] {
  const drives = getSystemDrives();
  const targets: AnalyzeTarget[] = [];
  for (const drive of drives) {
    try {
      const scope = detectTarget(drive);
      targets.push({
        path: scope.targetPath,
        type: scope.type,
        enabled: true,
      });
    } catch {
      // skip inaccessible drives
    }
  }
  return targets;
}
