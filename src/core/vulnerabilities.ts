import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { VulnerabilityInfo } from "../types/index.js";
import { isVersionInRange, rangesOverlap } from "../utils/versions.js";

export interface VulnerabilityRecord {
  name: string;
  id: string;
  severity: "warning" | "critical";
  summary: string;
  patchedVersion: string;
  affectedRanges: string[];
}

export const KNOWN_VULNERABILITIES: VulnerabilityRecord[] = [
  {
    name: "lodash",
    id: "CVE-2021-23337",
    severity: "critical",
    summary: "Command injection and prototype pollution in lodash (< 4.17.21)",
    patchedVersion: "4.17.21",
    affectedRanges: ["<4.17.21"],
  },
  {
    name: "minimist",
    id: "CVE-2021-44906",
    severity: "warning",
    summary: "Prototype pollution in minimist before 1.2.6",
    patchedVersion: "1.2.6",
    affectedRanges: ["<1.2.6"],
  },
  {
    name: "semver",
    id: "CVE-2022-25883",
    severity: "warning",
    summary: "ReDoS in semver before 7.5.2 allowing moderate CPU usage",
    patchedVersion: "7.5.2",
    affectedRanges: [">=7.0.0 <7.5.2"],
  },
  {
    name: "yargs-parser",
    id: "CVE-2020-7608",
    severity: "warning",
    summary: "Prototype pollution in yargs-parser before 5.0.1",
    patchedVersion: "5.0.1",
    affectedRanges: ["<5.0.1"],
  },
  {
    name: "minimatch",
    id: "CVE-2022-3517",
    severity: "warning",
    summary: "ReDoS in minimatch before 3.1.2",
    patchedVersion: "3.1.2",
    affectedRanges: ["<3.1.2"],
  },
  {
    name: "follow-redirects",
    id: "CVE-2024-28849",
    severity: "warning",
    summary: "Information disclosure via Proxy-Authorization header reuse",
    patchedVersion: "1.15.6",
    affectedRanges: ["<1.15.6"],
  },
  {
    name: "tar",
    id: "CVE-2021-37713",
    severity: "warning",
    summary: "Arbitrary file overwrite in tar before 6.1.9",
    patchedVersion: "6.1.9",
    affectedRanges: ["<6.1.9"],
  },
  {
    name: "axios",
    id: "CVE-2021-3749",
    severity: "warning",
    summary: "Server-side request forgery via backslash handling in axios",
    patchedVersion: "0.21.2",
    affectedRanges: ["<0.21.2"],
  },
  {
    name: "cookie",
    id: "CVE-2024-47764",
    severity: "warning",
    summary: "Cookie name overwrites date-like names in cookie package",
    patchedVersion: "0.0.20",
    affectedRanges: ["<0.0.20"],
  },
  {
    name: "pdf-to-text",
    id: "CVE-2024-34534",
    severity: "warning",
    summary: "PDF parsing does not guard against malicious input",
    patchedVersion: "1.4.0",
    affectedRanges: ["<1.4.0"],
  },
];

async function tryReadJson(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface ResolvedDependency {
  name: string;
  version: string;
  source: "package.json" | "package-lock.json";
}

function collectDeclaredDependencies(pkg: Record<string, unknown>): Record<string, string> {
  return {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
    ...(pkg.peerDependencies as Record<string, string> | undefined),
    ...(pkg.optionalDependencies as Record<string, string> | undefined),
  };
}

function lockFileVersions(lockJson: Record<string, unknown>): Map<string, string> {
  const versions = new Map<string, string>();

  const packages = lockJson.packages;
  if (packages && typeof packages === "object") {
    for (const [key, entry] of Object.entries(packages as Record<string, unknown>)) {
      if (!key.startsWith("node_modules/")) {
        continue;
      }
      const name = key.slice("node_modules/".length);
      const version =
        (entry as { version?: string } | null)?.version ?? (entry as string | undefined);
      if (typeof version === "string") {
        versions.set(name, version);
      }
    }
  }

  const deps = lockJson.dependencies;
  if (deps && typeof deps === "object") {
    for (const [name, entry] of Object.entries(deps as Record<string, unknown>)) {
      const version = (entry as { version?: string } | null)?.version;
      if (typeof version === "string") {
        versions.set(name, version);
      }
    }
  }

  return versions;
}

async function resolveDependencies(rootPath: string): Promise<ResolvedDependency[]> {
  const packageJson = await tryReadJson(path.join(rootPath, "package.json"));
  if (!packageJson) {
    return [];
  }

  const declared = collectDeclaredDependencies(packageJson);
  const lockVersions = await tryReadJson(path.join(rootPath, "package-lock.json"));
  const resolved = lockVersions ? lockFileVersions(lockVersions) : new Map<string, string>();

  const result: ResolvedDependency[] = [];
  for (const [name, declaredRange] of Object.entries(declared)) {
    const installed = resolved.get(name);
    result.push({
      name,
      version: installed ?? declaredRange,
      source: installed ? "package-lock.json" : "package.json",
    });
  }
  return result;
}

export async function scanForVulnerabilities(rootPath: string): Promise<VulnerabilityInfo[]> {
  const deps = await resolveDependencies(rootPath);

  const findings: VulnerabilityInfo[] = [];
  const seen = new Set<string>();

  for (const dep of deps) {
    for (const advisory of KNOWN_VULNERABILITIES) {
      if (advisory.name !== dep.name) {
        continue;
      }
      const key = `${dep.name}:${advisory.id}`;
      if (seen.has(key)) {
        continue;
      }

      const isAffected =
        dep.source === "package-lock.json"
          ? isVersionInRange(dep.version, advisory.affectedRanges.join(" || "))
          : rangesOverlap(dep.version, advisory.affectedRanges.join(" || "));

      if (isAffected) {
        seen.add(key);
        findings.push({
          package: dep.name,
          installedVersion: dep.version,
          affectedVersion: advisory.affectedRanges.join(" || "),
          patchedVersion: advisory.patchedVersion,
          severity: advisory.severity,
          id: advisory.id,
          summary: advisory.summary,
        });
      }
    }
  }

  return findings.sort((a, b) => a.package.localeCompare(b.package));
}
