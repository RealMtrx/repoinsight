import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";
import { theme, styles, icons } from "../tui/index.js";

const def: CommandDefinition = {
  name: "init",
  aliases: ["i", "setup"],
  description: "Initialize repoinsight in a project",
  helpText: "Create a repoinsight configuration file with recommended defaults",
  category: "Configuration",
  examples: [
    { usage: "repoinsight init", description: "Create default config in current directory" },
    { usage: "repoinsight init --force", description: "Overwrite existing config" },
  ],
  setup(cmd: Command) {
    cmd
      .option("-f, --force", "overwrite existing configuration")
      .action(async (options: Record<string, unknown>) => {
        const fs = await import("fs");
        const path = await import("path");
        const configPath = path.join(process.cwd(), "repoinsight.json");

        if (fs.existsSync(configPath) && !options.force) {
          console.log(
            theme.warning(
              `${icons.warn} repoinsight.json already exists. Use --force to overwrite.`,
            ),
          );
          return;
        }

        const defaultConfig = {
          version: "1",
          excludePatterns: ["node_modules", ".git", "dist", "build", "coverage"],
          maxFileSize: 10485760,
          scoreWeights: {
            documentation: 15,
            testing: 15,
            structure: 12,
            dependencies: 12,
            security: 15,
            maintainability: 12,
            performance: 9,
            codeQuality: 10,
          },
          scoreThresholds: {
            excellent: 90,
            good: 75,
            fair: 60,
            poor: 40,
          },
        };

        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + "\n", "utf-8");
        console.log(
          theme.success(`${icons.checkCircle} Created ${styles.path("repoinsight.json")}`),
        );
      });
  },
};

register(def);
