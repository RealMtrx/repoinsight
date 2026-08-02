import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "graph",
  aliases: ["g", "visualize", "tree"],
  description: "Visualize repository structure and dependencies",
  helpText:
    "Generate visual representations of the repository structure, dependency graph, and module relationships",
  category: "Visualization",
  examples: [
    { usage: "repoinsight graph", description: "Show directory tree" },
    { usage: "repoinsight graph --deps", description: "Show dependency graph" },
    { usage: "repoinsight graph --depth 3", description: "Limit tree depth to 3 levels" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--deps", "show dependency graph")
      .option("--depth <n>", "tree depth limit", parseInt)
      .action(async (directory: string, options: Record<string, unknown>) => {
        const { getDirectoryTree } = await import("../utils/file.js");
        const { styles, icons, createBox, terminalWidth } = await import("../tui/index.js");

        if (options.deps) {
          console.log(styles.subheading(`${icons.arrow} Dependency Graph`));
          console.log(styles.dim(" Coming in a future release"));
          return;
        }

        const tree = await getDirectoryTree(directory, "", []);
        console.log(
          createBox([styles.subheading("Directory Structure")], {
            title: " Repository Tree",
            width: Math.min(terminalWidth(), 72),
          }),
        );
        console.log(tree);
      });
  },
};

register(def);
