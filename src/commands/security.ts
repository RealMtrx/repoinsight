import { Command } from "commander";
import { register } from "./registry.js";
import type { CommandDefinition } from "./types.js";

const def: CommandDefinition = {
  name: "security",
  aliases: ["sec", "audit", "sast"],
  description: "Run security analysis on the repository",
  helpText: "Scan for hardcoded secrets, vulnerable patterns, and security best practices",
  category: "Analysis",
  examples: [
    { usage: "repoinsight security", description: "Run security audit" },
    { usage: "repoinsight security --json", description: "Output results as JSON" },
    { usage: "repoinsight security --fail-fast", description: "Stop at first critical issue" },
  ],
  setup(cmd: Command) {
    cmd
      .argument("[directory]", "target directory", ".")
      .option("--json", "output as JSON")
      .option("--fail-fast", "exit on first critical issue")
      .action(async (directory: string, _options: Record<string, unknown>) => {
        const { runAnalysis } = await import("../core/analyzer.js");
        const { theme, styles, icons, createBox, terminalWidth, severity } =
          await import("../tui/index.js");
        const ora = await import("ora").then((m) => m.default);

        const spinner = ora({ text: " Running security audit...", color: "yellow" }).start();
        const report = await runAnalysis(directory);
        spinner.succeed(" Security audit complete");

        const secrets = report.hardcodedSecrets ?? [];
        const vulnerabilities = report.vulnerabilities ?? [];

        if (secrets.length === 0 && vulnerabilities.length === 0) {
          console.log(theme.success(`\n${icons.checkCircle} No security issues detected`));
          return;
        }

        const findings: string[] = [];

        if (secrets.length > 0) {
          findings.push(
            ...secrets.map(
              (s) =>
                `${severity.critical(icons.alert)} ${styles.path(s.file)} ${styles.label(`line ${s.line}`)}`,
            ),
          );
        }

        if (vulnerabilities.length > 0) {
          findings.push("", severity.critical(`${icons.alert} Known Vulnerabilities`));
          for (const v of vulnerabilities) {
            findings.push(
              `${v.severity === "critical" ? theme.error(icons.cross) : theme.warning(icons.warn)} ${styles.code(v.package)} v${v.installedVersion} ${styles.label(v.id)} â†’ upgrade to v${v.patchedVersion}`,
            );
          }
        }

        console.log(
          createBox(findings, {
            title: " Security Findings",
            width: Math.min(terminalWidth(), 72),
            borderColor: theme.error,
          }),
        );
      });
  },
};

register(def);
