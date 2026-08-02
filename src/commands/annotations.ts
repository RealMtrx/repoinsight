import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "annotations",
  aliases: ["ann", "annotate", "gha"],
  description: "Emit GitHub Actions annotations from analysis findings",
  helpText:
    "Output ::error/::warning/::notice workflow commands so findings appear inline in the GitHub Actions checks UI",
  category: "Reports",
  examples: [
    { usage: "repoinsight annotations", description: "Print annotations for the current repo" },
    {
      usage: "repoinsight annotations --max-per-level 10",
      description: "Cap annotations per level",
    },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--max-per-level <n>", "limit number of annotations per severity level", "20")
      .option(
        "-l, --level <levels>",
        "only emit the given levels (comma-separated: error,warning,notice)",
      )
      .action(async (directory: string, options: Record<string, unknown>) => {
        const { runAnalysis } = await import("../core/analyzer.js");
        const { generateAnnotations, toAnnotationLine } = await import("../annotations/index.js");

        const report = await runAnalysis(directory);
        const limit = Number(options.maxPerLevel ?? 20);
        const levels = new Set(
          typeof options.level === "string"
            ? options.level
                .split(",")
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean)
            : [],
        );

        const annotations = generateAnnotations(report).filter((annotation) =>
          levels.size === 0 ? true : levels.has(annotation.level),
        );

        const emitted: Record<string, number> = {};
        for (const annotation of annotations) {
          const current = emitted[annotation.level] ?? 0;
          if (limit > 0 && current >= limit) {
            continue;
          }
          emitted[annotation.level] = current + 1;
          process.stdout.write(toAnnotationLine(annotation) + "\n");
        }
      });
  },
};

register(def);
