import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "licenses",
  aliases: ["l", "license", "legal"],
  description: "Display license information for the project and dependencies",
  helpText: "Show license details for the current project and its dependencies",
  category: "Analysis",
  examples: [
    { usage: "repoinsight licenses", description: "Show project license information" },
    { usage: "repoinsight licenses --deps", description: "Include dependency licenses" },
    { usage: "repoinsight licenses --json", description: "Export as JSON" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--deps", "include dependency licenses")
      .option("--json", "output as JSON")
      .action(async (directory: string, _options: Record<string, unknown>) => {
        const fs = await import("fs");
        const path = await import("path");
        const { theme, styles, icons, createBox, terminalWidth } = await import("../tui/index.js");

        const licensePath = path.join(directory, "LICENSE");
        const hasLicense = fs.existsSync(licensePath);

        if (hasLicense) {
          console.log(
            createBox(
              [theme.success(`${icons.check} License file found`), styles.dim(licensePath)],
              { title: " Project License", width: Math.min(terminalWidth(), 64) },
            ),
          );
        } else {
          console.log(
            createBox([theme.warning(`${icons.warn} No LICENSE file found`)], {
              title: " License",
              width: Math.min(terminalWidth(), 64),
            }),
          );
        }
      });
  },
};

register(def);
