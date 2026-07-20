import { Command } from "commander";
import { APP_NAME, APP_DESCRIPTION, APP_VERSION } from "./constants/index.js";
import { loadConfig } from "./config/index.js";
import {
  scanCommand,
  reportCommand,
  doctorCommand,
  jsonCommand,
  markdownCommand,
  htmlCommand,
} from "./commands/scan.js";

const program = new Command();

loadConfig();

program
  .name(APP_NAME.toLowerCase())
  .description(APP_DESCRIPTION)
  .version(APP_VERSION, "-v, --version", "Output the current version");

program
  .command("scan")
  .description("Scan a repository and display analysis results")
  .argument("[directory]", "Directory to scan", ".")
  .option("--json", "Output results as JSON")
  .option("--markdown", "Output results as Markdown")
  .option("--html", "Output results as HTML")
  .option("-o, --output <path>", "Save output to a file")
  .option("--verbose", "Enable verbose logging")
  .action(
    async (
      dir: string,
      opts: {
        json?: boolean;
        markdown?: boolean;
        html?: boolean;
        output?: string;
        verbose?: boolean;
      },
    ) => {
      await scanCommand(dir, opts);
    },
  );

program
  .command("report")
  .description("Generate a detailed terminal health report")
  .argument("[directory]", "Directory to analyze", ".")
  .action(async (dir: string) => {
    await reportCommand(dir);
  });

program
  .command("doctor")
  .description("Run diagnostics and identify issues in a repository")
  .argument("[directory]", "Directory to analyze", ".")
  .action(async (dir: string) => {
    await doctorCommand(dir);
  });

program
  .command("json")
  .description("Export analysis results as JSON")
  .argument("[directory]", "Directory to analyze", ".")
  .argument("[output]", "Output file path (defaults to stdout)")
  .action(async (dir: string, output?: string) => {
    await jsonCommand(dir, output);
  });

program
  .command("markdown")
  .description("Export analysis results as Markdown")
  .argument("[directory]", "Directory to analyze", ".")
  .argument("[output]", "Output file path (defaults to stdout)")
  .action(async (dir: string, output?: string) => {
    await markdownCommand(dir, output);
  });

program
  .command("html")
  .description("Generate an interactive HTML report")
  .argument("[directory]", "Directory to analyze", ".")
  .argument("[output]", "Output file path (defaults to repolens-report.html)")
  .action(async (dir: string, output?: string) => {
    await htmlCommand(dir, output);
  });

export async function run(): Promise<void> {
  await program.parseAsync(process.argv);
}
