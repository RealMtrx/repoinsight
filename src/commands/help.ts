import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "help",
  aliases: ["h", "?"],
  description: "Display help for repoinsight commands",
  helpText: "Get detailed help for any repoinsight command",
  category: "Utilities",
  examples: [
    { usage: "repoinsight help", description: "Show general help" },
    { usage: "repoinsight help analyze", description: "Show help for analyze command" },
    { usage: "repoinsight help deps", description: "Show help for deps command" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[command]", "command to get help for")
      .action(async (commandName: string | undefined) => {
        const { getAll, get, createHelpPage } = await import("./registry.js");
        const { theme, styles, icons, createBox, terminalWidth } = await import("../tui/index.js");

        if (commandName) {
          const def = get(commandName);
          if (def) {
            console.log(createHelpPage(def));
            return;
          }
          console.log(theme.error(`Unknown command: ${commandName}`));
        }

        const commands = getAll();
        console.log(
          createBox(
            commands.map(
              (c) =>
                `  ${theme.primary(icons.diamond)} ${styles.value(c.name.padEnd(12))} ${styles.dim(c.description)}`,
            ),
            { title: ` repoinsight - Available Commands`, width: Math.min(terminalWidth(), 72) },
          ),
        );
        console.log(theme.muted(`\n ${icons.arrow} Run 'repoinsight help <command>' for details`));
      });
  },
};

register(def);
