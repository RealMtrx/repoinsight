import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "stats",
  aliases: ["s", "statistics", "metrics"],
  description: "Display repository statistics and metrics",
  helpText:
    "View detailed statistics including file counts, language breakdown, and historical metrics",
  category: "Analysis",
  examples: [
    { usage: "repoinsight stats", description: "Show repository statistics" },
    { usage: "repoinsight stats --json", description: "Export statistics as JSON" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--json", "output as JSON")
      .action(async (directory: string, _options: Record<string, unknown>) => {
        const { runAnalysis } = await import("../core/analyzer.js");
        const { theme, styles, createBox, terminalWidth } = await import("../tui/index.js");
        const ora = await import("ora").then((m) => m.default);

        const spinner = ora({ text: " Gathering statistics...", color: "yellow" }).start();
        const report = await runAnalysis(directory);
        spinner.succeed(" Statistics gathered");

        const width = Math.min(terminalWidth(), 64);

        const lines: string[] = [
          `${styles.label("Files:")}        ${styles.number(report.fileCount ?? 0)}`,
          `${styles.label("Folders:")}      ${styles.number(report.summary?.totalFolders ?? report.biggestFolders?.length ?? 0)}`,
          `${styles.label("Languages:")}    ${styles.number(report.languages?.length ?? 0)}`,
          `${styles.label("Commits:")}      ${styles.number(report.gitStats?.commitCount ?? 0)}`,
          `${styles.label("Branches:")}     ${styles.number(report.gitStats?.branchCount ?? 0)}`,
          `${styles.label("Contributors:")} ${styles.number(report.gitStats?.contributorCount ?? 0)}`,
          `${styles.label("Score:")}        ${report.score >= 80 ? theme.success(String(report.score) + "%") : report.score >= 60 ? theme.warning(String(report.score) + "%") : theme.error(String(report.score) + "%")}`,
        ];

        console.log(createBox(lines, { title: " Repository Statistics", width }));

        if (report.languages && report.languages.length > 0) {
          console.log("");
          console.log(styles.subheading(" Language Breakdown"));
          for (const lang of report.languages.slice(0, 8)) {
            const pct = `${lang.percentage.toFixed(1)}%`.padStart(6);
            console.log(
              `   ${styles.keyword(lang.language.padEnd(18))} ${styles.number(pct)}  ${styles.dim(`${lang.files} files, ${lang.lines} lines`)}`,
            );
          }
        }
      });
  },
};

register(def);
