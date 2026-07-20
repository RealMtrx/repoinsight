import { writeFile } from "node:fs/promises";
import ora from "ora";
import { AnalyzerEngine } from "../core/AnalyzerEngine.js";
import { AnalysisOptionsModel } from "../models/AnalysisOptionsModel.js";
import { TerminalReporter } from "../reporters/TerminalReporter.js";
import { JsonReporter } from "../reporters/JsonReporter.js";
import { MarkdownReporter } from "../reporters/MarkdownReporter.js";
import { HtmlReporter } from "../reporters/HtmlReporter.js";

export async function scanCommand(
  dir: string,
  options: {
    json?: boolean;
    markdown?: boolean;
    html?: boolean;
    output?: string;
    verbose?: boolean;
  },
): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({
    path: targetPath,
    verbose: options.verbose ?? false,
    excludePatterns: [],
  });

  const spinner = ora("Analyzing repository...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Analysis complete");

    if (options.json) {
      const reporter = new JsonReporter();
      const output = reporter.render(report);
      if (options.output) {
        await writeFile(options.output, output, "utf-8");
        console.log(`JSON report saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } else if (options.markdown) {
      const reporter = new MarkdownReporter();
      const output = reporter.render(report);
      if (options.output) {
        await writeFile(options.output, output, "utf-8");
        console.log(`Markdown report saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } else if (options.html) {
      const reporter = new HtmlReporter();
      const output = reporter.render(report);
      if (options.output) {
        await writeFile(options.output, output, "utf-8");
        console.log(`HTML report saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } else {
      const reporter = new TerminalReporter();
      reporter.render(report);
    }
  } catch (error) {
    spinner.fail("Analysis failed");
    throw error;
  }
}

export async function reportCommand(dir?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Report generated");

    const reporter = new TerminalReporter();
    reporter.render(report);
  } catch (error) {
    spinner.fail("Report generation failed");
    throw error;
  }
}

export async function doctorCommand(dir?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Running diagnostics...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Diagnostics complete");

    const issues: { type: "critical" | "warning"; message: string }[] = [];

    for (const s of report.hardcodedSecrets) {
      issues.push({ type: "critical", message: `Hardcoded ${s.type} in ${s.file}:${s.line}` });
    }
    for (const c of report.circularImports) {
      issues.push({ type: "critical", message: `Circular import in ${c.file}` });
    }
    for (const d of report.dependencyIssues) {
      if (d.severity === "critical") {
        issues.push({ type: "critical", message: d.details });
      }
    }
    for (const d of report.dependencyIssues) {
      if (d.severity === "warning") {
        issues.push({ type: "warning", message: d.details });
      }
    }
    for (const t of report.todoComments) {
      issues.push({ type: "warning", message: `${t.type} in ${t.file}:${t.line} — ${t.text}` });
    }
    for (const f of report.emptyFolders) {
      issues.push({ type: "warning", message: `Empty folder: ${f}` });
    }

    if (report.missingReadme) {
      issues.push({ type: "warning", message: "Missing README.md" });
    }
    if (report.missingLicense) {
      issues.push({ type: "warning", message: "Missing LICENSE" });
    }
    if (report.missingGitignore) {
      issues.push({ type: "warning", message: "Missing .gitignore" });
    }
    if (report.missingTests) {
      issues.push({ type: "warning", message: "No test files found" });
    }
    if (report.missingCi) {
      issues.push({ type: "warning", message: "No CI configuration found" });
    }

    console.log(`\n${"=".repeat(56)}`);
    console.log(`  RepoLens Doctor — ${report.projectName}`);
    console.log("=".repeat(56));

    const criticalCount = issues.filter((i) => i.type === "critical").length;
    const warningCount = issues.filter((i) => i.type === "warning").length;

    console.log(`\n  Overall Score: ${report.score}/100`);
    console.log(`  Issues found:  ${criticalCount + warningCount}`);
    console.log(`    Critical:    ${criticalCount}`);
    console.log(`    Warnings:    ${warningCount}`);

    if (issues.length > 0) {
      console.log(`\n${"\u2500".repeat(56)}`);
      for (const issue of issues) {
        const icon = issue.type === "critical" ? "\u2716" : "\u26A0";
        console.log(`  ${icon} [${issue.type.toUpperCase().padEnd(8)}] ${issue.message}`);
      }
    }

    if (report.recommendations.length > 0) {
      console.log(`\n${"\u2500".repeat(56)}`);
      console.log("  Recommendations:");
      for (const rec of report.recommendations) {
        console.log(`    \u2192 ${rec}`);
      }
    }

    console.log();
  } catch (error) {
    spinner.fail("Diagnostics failed");
    throw error;
  }
}

export async function jsonCommand(dir?: string, outputFile?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating JSON report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("JSON report generated");

    const reporter = new JsonReporter();
    const output = reporter.render(report);

    if (outputFile) {
      await writeFile(outputFile, output, "utf-8");
      console.log(`Report saved to ${outputFile}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    spinner.fail("JSON report generation failed");
    throw error;
  }
}

export async function markdownCommand(dir?: string, outputFile?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating Markdown report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("Markdown report generated");

    const reporter = new MarkdownReporter();
    const output = reporter.render(report);

    if (outputFile) {
      await writeFile(outputFile, output, "utf-8");
      console.log(`Report saved to ${outputFile}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    spinner.fail("Markdown report generation failed");
    throw error;
  }
}

export async function htmlCommand(dir?: string, outputFile?: string): Promise<void> {
  const targetPath = dir ?? ".";
  const analysisOptions = AnalysisOptionsModel.create({ path: targetPath });

  const spinner = ora("Generating HTML report...").start();

  try {
    const engine = new AnalyzerEngine(analysisOptions.toObject());
    const report = await engine.analyze(targetPath);
    spinner.succeed("HTML report generated");

    const reporter = new HtmlReporter();
    const output = reporter.render(report);

    if (outputFile) {
      await writeFile(outputFile, output, "utf-8");
      console.log(`HTML report saved to ${outputFile}`);
    } else {
      const filePath = "repolens-report.html";
      await writeFile(filePath, output, "utf-8");
      console.log(`HTML report saved to ${filePath}`);
    }
  } catch (error) {
    spinner.fail("HTML report generation failed");
    throw error;
  }
}
