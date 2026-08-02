import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "report",
  aliases: ["r", "summary"],
  description: "Generate repository health reports",
  helpText: "Create detailed reports in various formats (HTML, Markdown, JSON, or terminal)",
  category: "Reports",
  examples: [
    { usage: "repoinsight report", description: "Show terminal report" },
    { usage: "repoinsight report --html", description: "Generate interactive HTML report" },
    { usage: "repoinsight report --md", description: "Generate Markdown report" },
    {
      usage: "repoinsight report --json -o report.json",
      description: "Export JSON report to file",
    },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--json", "output as JSON")
      .option("--html", "generate HTML report")
      .option("--md", "generate Markdown report")
      .option("-o, --output <path>", "save output to file")
      .action(async (directory: string, options: Record<string, unknown>) => {
        const { runAnalysis } = await import("../core/analyzer.js");
        const ora = await import("ora").then((m) => m.default);
        const spinner = ora({ text: " Generating report...", color: "yellow" }).start();
        const report = await runAnalysis(directory);
        spinner.succeed(" Report generated");

        const { renderOutput, detectFormat } = await import("./output.js");
        await renderOutput(report, {
          format: detectFormat(options),
          output: typeof options.output === "string" ? options.output : undefined,
        });
      });
  },
};

register(def);
