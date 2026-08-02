import { Command } from "commander";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";
import { theme, styles, icons, createBox } from "../tui/index.js";

const def: CommandDefinition = {
  name: "config",
  aliases: ["c", "cfg", "settings"],
  description: "Manage repoinsight configuration",
  helpText: "View, edit, or reset configuration settings for repoinsight",
  category: "Configuration",
  examples: [
    { usage: "repoinsight config", description: "Show current configuration" },
    { usage: "repoinsight config --show", description: "Display effective configuration" },
    { usage: "repoinsight config --reset", description: "Reset to defaults" },
  ],
  setup(cmd: Command) {
    cmd
      .option("--show", "display current configuration")
      .option("--reset", "reset configuration to defaults")
      .action(async (options: Record<string, unknown>) => {
        if (options.reset) {
          const fs = await import("fs");
          const path = await import("path");
          const configPath = path.join(process.cwd(), "repoinsight.json");
          try {
            fs.unlinkSync(configPath);
            console.log(theme.success(`${icons.checkCircle} Configuration reset to defaults`));
          } catch {
            console.log(theme.info(`${icons.info} No configuration file found`));
          }
          return;
        }

        const { loadConfig } = await import("../config/index.js");
        const cfg = loadConfig();
        const weights = cfg.scoreWeights;

        const lines = [
          styles.subheading("Effective Configuration"),
          "",
          `${styles.label("Config file:")}    ${styles.value(detectConfigSource(process.cwd()))}`,
          `${styles.label("Exclude patterns:")} ${
            cfg.excludePatterns && cfg.excludePatterns.length > 0
              ? styles.value(cfg.excludePatterns.join(", "))
              : styles.dim("none (using defaults)")
          }`,
          `${styles.label("Max file size:")}   ${
            cfg.maxFileSize
              ? styles.value(formatBytes(cfg.maxFileSize))
              : styles.dim(`${formatBytes(10_485_760)} (default)`)
          }`,
          "",
          styles.subheading("Score Weights"),
          ...Object.entries(weights ?? {}).map(
            ([key, value]) =>
              `${styles.label(`${key}:`)}${" ".repeat(Math.max(1, 16 - key.length))} ${styles.value(
                `${value}%`,
              )}`,
          ),
          "",
          styles.subheading("Score Thresholds"),
          ...Object.entries(cfg.scoreThresholds ?? {}).map(
            ([key, value]) =>
              `${styles.label(`${key}:`)}${" ".repeat(Math.max(1, 16 - key.length))} ${styles.value(
                `>= ${value}`,
              )}`,
          ),
          "",
          styles.dim("Run repoinsight init to create or edit a config file"),
        ];

        console.log(createBox(lines, { title: " Configuration", width: 56 }));
      });
  },
};

register(def);

export function configCommand(cmd: Command): void {
  def.setup(cmd);
}

function detectConfigSource(dir: string): string {
  const candidates: [string, string][] = [
    [join(dir, "repoinsight.json"), "repoinsight.json"],
    [join(dir, ".repoinsightrc"), ".repoinsightrc"],
    [join(dir, "package.json"), "package.json (repoinsight key)"],
  ];
  for (const [filePath, label] of candidates) {
    if (existsSync(filePath)) {
      return label;
    }
  }
  if (existsSync(join(dir, ".repoinsightignore"))) {
    return ".repoinsightignore (ignore patterns only)";
  }
  return "none (defaults)";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
