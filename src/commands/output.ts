import type { AnalysisReport } from "../types/index.js";
import { theme } from "../tui/index.js";

type Format = "json" | "html" | "md" | "terminal";

interface OutputOptions {
  format: Format;
  output?: string;
}

async function writeFile(path: string, content: string): Promise<void> {
  const fs = await import("node:fs").then((m) => m.promises);
  await fs.writeFile(path, content, "utf-8");
}

export async function renderOutput(report: AnalysisReport, options: OutputOptions): Promise<void> {
  switch (options.format) {
    case "json": {
      const { JsonReporter } = await import("../reporters/JsonReporter.js");
      const output = new JsonReporter().render(report);
      if (options.output) {
        await writeFile(options.output, output);
        console.log(theme.success(`Report saved to ${options.output}`));
      } else {
        console.log(output);
      }
      return;
    }
    case "html": {
      const { HtmlReporter } = await import("../reporters/HtmlReporter.js");
      const output = new HtmlReporter().render(report);
      const path = options.output ?? "repoinsight-report.html";
      await writeFile(path, output);
      console.log(theme.success(`HTML report saved to ${path}`));
      return;
    }
    case "md": {
      const { MarkdownReporter } = await import("../reporters/MarkdownReporter.js");
      const output = new MarkdownReporter().render(report);
      if (options.output) {
        await writeFile(options.output, output);
        console.log(theme.success(`Markdown report saved to ${options.output}`));
      } else {
        console.log(output);
      }
      return;
    }
    case "terminal": {
      const { TerminalReporter } = await import("../reporters/TerminalReporter.js");
      new TerminalReporter().render(report);
      return;
    }
  }
}

export function detectFormat(options: Record<string, unknown>): Format {
  if (options.json) {
    return "json";
  }
  if (options.html) {
    return "html";
  }
  if (options.md) {
    return "md";
  }
  return "terminal";
}
