import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";
import { APP_NAME, APP_VERSION } from "../constants/index.js";

const def: CommandDefinition = {
  name: "version",
  aliases: ["ver"],
  description: "Display repoinsight version",
  helpText: "Show the current installed version of repoinsight",
  category: "Utilities",
  examples: [{ usage: "repoinsight version", description: "Show version information" }],
  setup(cmd: Command) {
    cmd.action(async () => {
      const { theme, styles, createBox } = await import("../tui/index.js");
      console.log(
        createBox(
          [
            `${styles.label("Name:")}    ${theme.primary.bold(APP_NAME)}`,
            `${styles.label("Version:")} ${theme.primary(APP_VERSION)}`,
            "",
            styles.dim("Cross-platform repository analysis CLI"),
          ],
          { title: ` ${APP_NAME}`, width: 40 },
        ),
      );
    });
  },
};

register(def);
