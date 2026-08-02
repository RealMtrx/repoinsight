import { Command } from "commander";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";
import { getProjectLicense, findLicenseFile } from "../utils/license.js";

interface DependencyLicense {
  name: string;
  version: string | null;
  spdx: string | null;
}

interface JsonOutput {
  project: {
    directory: string;
    file: string | null;
    spdx: string | null;
    name: string | null;
  };
  dependencies: DependencyLicense[];
}

function readDependencyLicenses(root: string): DependencyLicense[] {
  const result: DependencyLicense[] = [];
  const nodeModules = path.join(root, "node_modules");
  if (!existsSync(nodeModules)) {
    return result;
  }

  const scanDir = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry);
      const pkgPath = path.join(full, "package.json");
      if (!existsSync(pkgPath) || !statSyncSafeDir(full)) {
        continue;
      }
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
          name?: string;
          version?: string;
          license?: unknown;
        };
        const rawLicense = pkg.license;
        let spdx: string | null = null;
        if (typeof rawLicense === "string") {
          spdx = /^[A-Za-z0-9.\-+]+$/.test(rawLicense) ? rawLicense : null;
        } else if (
          rawLicense !== null &&
          typeof rawLicense === "object" &&
          typeof (rawLicense as { type?: unknown }).type === "string"
        ) {
          spdx = (rawLicense as { type: string }).type;
        }
        result.push({
          name: pkg.name ?? entry,
          version: pkg.version ?? null,
          spdx,
        });
      } catch {
        /* unreadable package.json */
      }
    }
  };

  scanDir(nodeModules);
  const scopedDir = path.join(nodeModules, "@");
  let scoped: string[];
  try {
    scoped = readdirSync(scopedDir);
  } catch {
    scoped = [];
  }
  for (const scope of scoped) {
    scanDir(path.join(scopedDir, scope));
  }

  return result.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 200);
}

function statSyncSafeDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

const def: CommandDefinition = {
  name: "licenses",
  aliases: ["l", "license", "legal"],
  description: "Display license information for the project and dependencies",
  helpText: "Show license details for the current project and its dependencies",
  category: "Analysis",
  examples: [
    { usage: "repoinsight licenses", description: "Show project license information" },
    { usage: "repoinsight licenses --deps", description: "Include dependency licenses" },
    { usage: "repoinsight licenses --json", description: "Export as JSON" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--deps", "include dependency licenses")
      .option("--json", "output as JSON")
      .action(async (directory: string, options: Record<string, unknown>) => {
        const { theme, styles, icons, createBox, terminalWidth } = await import("../tui/index.js");

        const absolute = path.resolve(directory);
        const license = getProjectLicense(absolute);
        const licenseFile = findLicenseFile(absolute);
        const dependencies = options.deps ? readDependencyLicenses(absolute) : [];

        if (options.json) {
          const out: JsonOutput = {
            project: {
              directory: absolute,
              file: license.file ?? (licenseFile ? path.basename(licenseFile) : null),
              spdx: license.spdx,
              name: license.name,
            },
            dependencies,
          };
          console.log(JSON.stringify(out, null, 2));
          return;
        }

        const width = Math.min(terminalWidth(), 72);

        if (license.name || license.spdx || license.file) {
          const lines = [
            `${icons.check} ${theme.success("License detected")}  ${theme.white.bold(license.name ?? "Unknown")}`,
          ];
          if (license.spdx) {
            lines.push(styles.dim(`   SPDX: ${license.spdx}`));
          }
          if (license.file) {
            lines.push(styles.dim(`   File: ${license.file}`));
          }
          console.log(
            createBox(lines, {
              title: " Project License",
              width: Math.max(width, 44),
            }),
          );
        } else {
          console.log(
            createBox([`${icons.warn} ${theme.warning("No license detected")}         `], {
              title: " License",
              width: Math.max(width, 44),
            }),
          );
        }

        if (options.deps && dependencies.length > 0) {
          const rows = dependencies.map((d) => {
            const spdx = d.spdx ? theme.success(d.spdx) : theme.error("Unknown");
            return `  ${d.name}${d.version ? ` ${styles.dim(d.version)}` : ""} ${spdx}`;
          });
          console.log(
            createBox(rows, {
              title: ` Dependencies (${dependencies.length}) `,
              width: Math.max(width, 44),
            }),
          );
        } else if (options.deps) {
          console.log(
            createBox([theme.muted("No dependencies (node_modules) found")], {
              title: " Dependencies ",
              width: Math.max(width, 44),
            }),
          );
        }
      });
  },
};

register(def);
