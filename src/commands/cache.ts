import { Command } from "commander";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const CACHE_FILE = ".repoinsight-cache.json";

interface CachePayload {
  files?: Record<string, unknown>;
}

export function findCacheFile(target: string): string | null {
  const candidate = path.join(path.resolve(target), CACHE_FILE);
  return existsSync(candidate) ? candidate : null;
}

const def: CommandDefinition = {
  name: "cache",
  aliases: ["ca"],
  description: "Manage the analysis cache",
  helpText:
    "View or clear the content cache written to .repoinsight-cache.json in each analyzed project root",
  category: "Utilities",
  examples: [
    { usage: "repoinsight cache", description: "Show cache status" },
    { usage: "repoinsight cache --clear", description: "Clear cached data for this project" },
    {
      usage: "repoinsight cache --clear --path ./src",
      description: "Clear cache in a specific directory",
    },
  ],
  setup(cmd: Command) {
    cmd
      .option("--clear", "clear cached data")
      .option("--status", "show cache information")
      .option("--path <path>", "directory to inspect (default: current directory)")
      .action(async (options: Record<string, unknown>) => {
        const { theme, styles, icons, createBox } = await import("../tui/index.js");
        const target = typeof options.path === "string" ? options.path : ".";
        const cacheFile = findCacheFile(target);

        if (options.clear) {
          if (cacheFile) {
            try {
              unlinkSync(cacheFile);
              console.log(theme.success(`${icons.warn ?? "ًں—‘"} Cache cleared (${cacheFile})`));
            } catch {
              console.log(theme.error(`Failed to clear cache at ${cacheFile}`));
            }
            return;
          }
          console.log(theme.info(`${icons.warn ?? "â„¹"} No cache file found to clear`));
          return;
        }

        let entries = 0;
        let size = 0;
        if (cacheFile) {
          try {
            const raw = readFileSync(cacheFile, "utf-8");
            const parsed = JSON.parse(raw) as CachePayload;
            entries = Object.keys(parsed.files ?? {}).length;
            size = Buffer.byteLength(raw);
          } catch {
            entries = -1;
          }
        }

        console.log(
          createBox(
            [
              `${styles.label("Cache file:")}  ${styles.path(cacheFile ?? "(none)")}`,
              `${styles.label("Entries:")}     ${theme.info(entries < 0 ? "corrupted" : String(entries))}`,
              `${styles.label("Size:")}        ${styles.dim(size > 0 ? `${size} bytes` : "n/a")}`,
              `${styles.label("Directory:")}   ${styles.dim(path.resolve(target))}`,
              "",
              styles.dim("Content results are cached per project in .repoinsight-cache.json."),
            ],
            { title: " Cache", width: 58 },
          ),
        );
      });
  },
};

register(def);
