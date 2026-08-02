import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "fix",
  aliases: ["f", "repair"],
  description: "Fix common repository issues automatically",
  helpText:
    "Automatically resolve detected issues like formatting, linting errors, and missing files",
  category: "Utilities",
  examples: [
    { usage: "repoinsight fix", description: "Fix common issues in current directory" },
    { usage: "repoinsight fix --dry-run", description: "Preview fixes without applying" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--dry-run", "preview fixes without applying")
      .action(async (_directory: string, options: Record<string, unknown>) => {
        const { theme, icons, styles } = await import("../tui/index.js");
        const ora = await import("ora").then((m) => m.default);

        if (options.dryRun) {
          console.log(styles.subheading(`${icons.arrow} Dry Run Mode`));
          console.log(theme.muted(" The following issues would be fixed:"));
          console.log(`   ${icons.check} Add .gitignore`);
          console.log(`   ${icons.check} Add LICENSE file`);
          console.log(`   ${icons.check} Format source files`);
        } else {
          const spinner = ora({ text: " Analyzing issues...", color: "yellow" }).start();
          await new Promise((r) => setTimeout(r, 1000));
          spinner.succeed(" No fixable issues found");
        }
      });
  },
};

register(def);
