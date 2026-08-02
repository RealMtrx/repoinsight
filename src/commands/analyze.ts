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

  const { renderOutput, detectFormat } = await import("./output.js");
  await renderOutput(report, {
    format: detectFormat(options),
    output: typeof options.output === "string" ? options.output : undefined,
  });
}
