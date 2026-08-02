import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "deps",
  aliases: ["dep", "dependencies", "packages"],
  description: "Analyze project dependencies",
  helpText: "Scan and analyze all dependencies including unused, missing, or outdated packages",
  category: "Analysis",
  examples: [
    { usage: "repoinsight deps", description: "Analyze dependencies" },
    { usage: "repoinsight deps --outdated", description: "Check for outdated packages" },
    { usage: "repoinsight deps --json", description: "Output as JSON" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--outdated", "check for outdated packages")
      .option("--json", "output as JSON")
      .action(async (directory: string, _options: Record<string, unknown>) => {
        const { runAnalysis } = await import("../core/analyzer.js");
        const { theme, styles, icons, createBox, terminalWidth } = await import("../tui/index.js");
        const ora = await import("ora").then((m) => m.default);

        const spinner = ora({ text: " Analyzing dependencies...", color: "yellow" }).start();
        const report = await runAnalysis(directory);
        spinner.succeed(" Analysis complete");

        const issues = report.dependencyIssues ?? [];
        if (issues.length === 0) {
          console.log(theme.success(`${icons.checkCircle} No dependency issues found`));
          return;
        }

        console.log(
          createBox(
            issues.map(
              (d) =>
                `${d.severity === "critical" ? theme.error(icons.cross) : theme.warning(icons.warn)} ${styles.code(d.name)}  ${d.details}`,
            ),
            { title: " Dependency Issues", width: Math.min(terminalWidth(), 72) },
          ),
        );
      });
  },
};

register(def);
