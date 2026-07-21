import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";
import { detectTarget } from "../utils/detectTarget.js";

const def: CommandDefinition = {
  name: "analyze",
  aliases: ["a", "inspect"],
  description: "Analyze repository, directory, or file health and structure",
  helpText:
    "Perform a comprehensive analysis. Automatically detects whether the target is a file, directory, or repository root.",
  category: "Analysis",
  examples: [
    { usage: "repoinsight analyze", description: "Analyze current repository" },
    { usage: "repoinsight analyze ./src", description: "Analyze a specific directory" },
    { usage: "repoinsight analyze ./src/index.ts", description: "Analyze a single file" },
    { usage: "repoinsight analyze /path/to/repo", description: "Analyze a full repository" },
    { usage: "repoinsight analyze --json", description: "Output results as JSON" },
    { usage: "repoinsight analyze --html", description: "Generate HTML report" },
    { usage: "repoinsight analyze -o report.html", description: "Save report to file" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[target]", "target path (file, directory, or repository)", ".")
      .option("--json", "output as JSON")
      .option("--html", "generate HTML report")
      .option("--md", "generate Markdown report")
      .option("-o, --output <path>", "save output to file")
      .option("--verbose", "show detailed output")
      .option("--no-cache", "disable analysis cache")
      .option("--incremental", "only re-analyze changed files")
      .action(analyzeAction);
  },
};

register(def);

export function analyzeCommand(cmd: Command): void {
  def.setup(cmd);
}

export async function analyzeAction(
  target: string,
  options: Record<string, unknown>,
): Promise<void> {
  const scope = detectTarget(target);

  const { runAnalysis } = await import("../core/analyzer.js");
  const report = await runAnalysis(target, {
    useCache: options.cache !== false,
    incremental: options.incremental === true,
    scopeType: scope.type,
    targetPath: scope.targetPath,
  });

  if (options.json) {
    const { JsonReporter } = await import("../reporters/JsonReporter.js");
    const output = new JsonReporter().render(report);
    if (typeof options.output === "string") {
      await import("fs").then((fs) =>
        fs.promises.writeFile(options.output as string, output, "utf-8"),
      );
      console.log(`Report saved to ${options.output}`);
    } else {
      console.log(output);
    }
    return;
  }

  if (options.html) {
    const { HtmlReporter } = await import("../reporters/HtmlReporter.js");
    const output = new HtmlReporter().render(report);
    const path = typeof options.output === "string" ? options.output : "repoinsight-report.html";
    await import("fs").then((fs) => fs.promises.writeFile(path, output, "utf-8"));
    console.log(`HTML report saved to ${path}`);
    return;
  }

  if (options.md) {
    const { MarkdownReporter } = await import("../reporters/MarkdownReporter.js");
    const output = new MarkdownReporter().render(report);
    if (typeof options.output === "string") {
      await import("fs").then((fs) =>
        fs.promises.writeFile(options.output as string, output, "utf-8"),
      );
      console.log(`Markdown report saved to ${options.output}`);
    } else {
      console.log(output);
    }
    return;
  }

  const { TerminalReporter } = await import("../reporters/TerminalReporter.js");
  new TerminalReporter().render(report);
}
