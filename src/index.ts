import { Command, CommanderError } from "commander";
import { APP_NAME, APP_VERSION, APP_DESCRIPTION } from "./constants/index.js";
import { theme, styles, icons, createBox, terminalWidth } from "./tui/index.js";

import "./commands/analyze.js";
import "./commands/doctor.js";
import "./commands/report.js";
import "./commands/init.js";
import "./commands/config.js";
import "./commands/fix.js";
import "./commands/stats.js";
import "./commands/graph.js";
import "./commands/deps.js";
import "./commands/licenses.js";
import "./commands/security.js";
import "./commands/cache.js";
import "./commands/annotations.js";
import "./commands/update.js";
import "./commands/version.js";
import "./commands/help.js";

import { getAll } from "./commands/registry.js";
import { loadConfig } from "./config/index.js";

export async function run(): Promise<void> {
  loadConfig();

  const program = new Command();

  program
    .name(APP_NAME)
    .description(APP_DESCRIPTION)
    .version(APP_VERSION, "-v, --version", "output version information")
    .helpOption("-h, --help", "display help information")
    .option("--debug", "print full error stack traces")
    .configureHelp({ sortSubcommands: true, showGlobalOptions: true })
    .exitOverride();

  const defs = getAll();
  for (const def of defs) {
    const cmd = new Command(def.name);
    cmd
      .description(def.description)
      .helpOption("-h, --help", "display help for command")
      .aliases(def.aliases)
      .option("--debug", "print full error stack traces")
      .exitOverride();
    def.setup(cmd);
    program.addCommand(cmd);
  }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    const { startInteractiveTUI } = await import("./tui/InteractiveTUI.js");
    await startInteractiveTUI();
    return;
  }

  if (args[0] === "help" && !args[1]) {
    showGeneralHelp();
    return;
  }

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof CommanderError) {
      process.exitCode = error.exitCode;
      return;
    }
    throw error;
  }
}

function showGeneralHelp(): void {
  const width = Math.min(terminalWidth(), 72);
  const commands = getAll();

  console.log("");
  console.log(
    createBox(
      [theme.primary.bold(` ${icons.diamond} ${APP_NAME}`), theme.muted(` ${APP_DESCRIPTION}`)],
      { title: ` v${APP_VERSION}`, width },
    ),
  );
  console.log("");

  console.log(styles.subheading(` ${icons.arrow} Usage`));
  console.log(`   ${styles.code(`$ ${APP_NAME} <command> [options]`)}`);
  console.log("");

  const categories = new Map<string, typeof commands>();
  for (const cmd of commands) {
    const cat = categories.get(cmd.category) ?? [];
    cat.push(cmd);
    categories.set(cmd.category, cat);
  }

  for (const [cat, cmds] of categories) {
    console.log(styles.subheading(` ${icons.arrow} ${cat}`));
    for (const cmd of cmds) {
      const aliases = cmd.aliases.length > 0 ? theme.muted(` (${cmd.aliases.join(", ")})`) : "";
      console.log(
        `   ${theme.primary(cmd.name.padEnd(12))} ${styles.dim(cmd.description)}${aliases}`,
      );
    }
    console.log("");
  }

  console.log(theme.muted(` ${icons.arrow} Run '${APP_NAME} help <command>' for command details`));
  console.log("");
}
