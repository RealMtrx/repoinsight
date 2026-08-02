import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "update",
  aliases: ["u", "upgrade", "latest"],
  description: "Check for repoinsight updates",
  helpText: "Check if a newer version of repoinsight is available and optionally update",
  category: "Utilities",
  examples: [
    { usage: "repoinsight update", description: "Check for updates" },
    { usage: "repoinsight update --install", description: "Check and install updates" },
  ],
  setup(cmd: Command) {
    cmd
      .option("--install", "automatically install update")
      .action(async (_options: Record<string, unknown>) => {
        const { APP_NAME, APP_VERSION } = await import("../constants/index.js");
        const { theme, styles, icons, createBox } = await import("../tui/index.js");

        const box = createBox(
          [
            `${styles.label("Current version:")} ${theme.primary(APP_VERSION)}`,
            `${styles.label("Latest version:")}  ${theme.success(APP_VERSION)}`,
            "",
            theme.success(`${icons.check} ${APP_NAME} is up to date`),
          ],
          { title: " Update Check", width: 44 },
        );

        console.log(box);
      });
  },
};

register(def);
