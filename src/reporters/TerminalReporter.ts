import Table from "cli-table3";
import type { AnalysisReport, CategoryScore, MultiAnalysisSummary } from "../types/index.js";
import { APP_NAME } from "../constants/index.js";
import { formatFileSize } from "../utils/file.js";
import { scopeIcon, scopeLabel } from "../utils/detectTarget.js";
import { theme, styles, icons, severity } from "../tui/index.js";
import { terminalWidth, repeat, formatDuration } from "../tui/utils.js";

export class TerminalReporter {
  render(report: AnalysisReport): void {
    console.log(this.renderHeader(report));
    console.log(this.renderSummaryCard(report));
    console.log(this.renderScoreCard(report));
    console.log(this.renderTechnologies(report.technologies));
    console.log(this.renderCategoryScores(report.categoryScores));
    console.log(this.renderLanguages(report.languages));
    console.log(this.renderGitStats(report));
    this.renderIssues(report);
    console.log(this.renderRecommendations(report.recommendations));
    console.log(this.renderFooter(report));
  }

  renderMulti(summary: MultiAnalysisSummary): void {
    const w = Math.min(terminalWidth(), 72);
    const border = theme.border;
    const top = `${border(icons.topLeft)}${border(repeat(icons.horizontal, w))}${border(icons.topRight)}`;
    const bottom = `${border(icons.bottomLeft)}${border(repeat(icons.horizontal, w))}${border(icons.bottomRight)}`;
    const title = `${theme.primary(icons.diamond + " " + APP_NAME)} ${styles.subheading("Multi-Path Analysis")}`;

    const grade = (s: number): string =>
      s >= 90 ? "A" : s >= 80 ? "B" : s >= 65 ? "C" : s >= 50 ? "D" : "F";

    const gradeColor = (s: number): ((t: string) => string) =>
      s >= 80 ? severity.success : s >= 60 ? severity.medium : severity.high;

    const totalTargets = summary.results.length;
    const succeeded = summary.results.filter((r) => r.report && !r.error);
    const failed = summary.results.filter((r) => r.error);

    const lines: string[] = [
      `${styles.label("Targets")}    ${styles.number}${String(totalTargets)}`,
      `${styles.label("Succeeded")}  ${theme.success(String(succeeded.length))}`,
      failed.length > 0
        ? `${styles.label("Failed")}     ${severity.high(String(failed.length))}`
        : "",
      `${styles.label("Repos")}      ${styles.number}${String(summary.repositories)}`,
      `${styles.label("Folders")}    ${styles.number}${String(summary.directories)}`,
      `${styles.label("Total Files")} ${styles.number}${String(summary.totalFiles)}`,
    ].filter(Boolean);

    if (summary.averageScore > 0) {
      const avg = summary.averageScore;
      lines.push(
        `${styles.label("Avg Score")}  ${severity.success(grade(avg))} ${styles.dim(`(${avg}/100)`)}`,
      );
    }

    console.log(
      `\n${top}\n${styles.dim(repeat(" ", Math.floor((w - title.length) / 2))) + title}\n${top}`,
    );
    console.log(this.simpleBox(lines, " Multi-Path Summary "));

    if (summary.bestProject) {
      console.log(
        this.simpleBox(
          [
            `  ${theme.primary(icons.star)} ${summary.bestProject.name}`,
            `  ${styles.label("Score")} ${gradeColor(summary.bestProject.score)(`${summary.bestProject.score}/100`)}`,
          ],
          " Best Project ",
        ),
      );
    }

    if (summary.worstProject && summary.worstProject.name !== summary.bestProject?.name) {
      console.log(
        this.simpleBox(
          [
            `  ${severity.high(icons.alert)} ${summary.worstProject.name}`,
            `  ${styles.label("Score")} ${gradeColor(summary.worstProject.score)(`${summary.worstProject.score}/100`)}`,
          ],
          " Needs Attention ",
        ),
      );
    }

    console.log(`\n${styles.subheading(" Per-Project Results")}\n`);

    for (const r of summary.results) {
      const icon = r.error ? severity.high(icons.cross) : theme.success(icons.check);
      const name = r.name ?? r.path.split(/[\\/]/).pop() ?? r.path;
      console.log(`  ${icon} ${scopeIcon(r.type)} ${styles.keyword(name)}`);
      console.log(`     ${styles.dim(r.path)}`);
      if (r.error) {
        console.log(`     ${severity.high(r.error)}`);
      } else if (r.report) {
        console.log(
          `  ${styles.label("Score")} ${gradeColor(r.report.score)(`${r.report.score}/100`)}` +
            `  ${styles.label("Files")} ${styles.number}${String(r.report.fileCount)}` +
            `  ${styles.label("Duration")} ${styles.dim(formatDuration(r.report.duration))}`,
        );
      }
      console.log("");
    }

    console.log(bottom);
  }

  private renderHeader(report: AnalysisReport): string {
    const w = Math.min(terminalWidth(), 72);
    const score = report.summary?.score;
    const scoreStr = score !== null && score !== undefined ? `v${score}` : "";
    const title = `${theme.primary(icons.diamond + " " + APP_NAME)} ${theme.muted(scoreStr)}`;
    const path = styles.dim(report.projectPath);
    const top = theme.border(repeat(icons.horizontal, w));
    const mid = `  ${styles.dim(repeat(" ", Math.max(0, Math.floor((w - styles.dim(path).length) / 2))))}${path}`;
    const scopeInfo = report.scope
      ? `  ${scopeIcon(report.scope.type)} ${scopeLabel(report.scope.type)}`
      : "";
    return `\n${top}\n${styles.dim(repeat(" ", Math.max(0, Math.floor((w - title.length) / 2))))}${title}\n${mid}\n${scopeInfo}\n${top}`;
  }

  private renderSummaryCard(report: AnalysisReport): string {
    const s = report.summary;
    const lines: string[] = [];
    if (report.scope) {
      lines.push(
        `  ${scopeIcon(report.scope.type)} ${styles.label(scopeLabel(report.scope.type))}` +
          `  ${styles.dim(report.scope.targetPath)}`,
      );
    }
    lines.push(
      `${styles.label("Files:")}     ${styles.number(s.totalFiles)}`,
      `${styles.label("Folders:")}   ${styles.number(s.totalFolders)}`,
      `${styles.label("Size:")}      ${styles.number(formatFileSize(s.totalSize))}`,
      `${styles.label("Languages:")} ${styles.number(s.languages)}`,
      `${styles.label("Commits:")}   ${styles.number(s.commits)}`,
      `${styles.label("Branches:")}  ${styles.number(s.branches)}`,
      `${styles.label("Score:")}     ${this.scoreColor(s.score)(`${s.score}/100`)}`,
    );
    return this.simpleBox(lines, " Summary ");
  }

  private renderScoreCard(report: AnalysisReport): string {
    const barWidth = 20;
    const score = report.score;
    const filled = Math.round((score / 100) * barWidth);
    const bar = `${theme.success(repeat(icons.progressFill, filled))}${theme.muted(repeat(icons.progressEmpty, barWidth - filled))}`;
    const lines = [`      ${this.scoreColor(score)(`${score}/100`)}`, `   ${bar}`];
    return this.simpleBox(lines, " Project Score ");
  }

  private renderTechnologies(tech: AnalysisReport["technologies"]): string {
    const lines: string[] = [];
    const add = (label: string, vals: string[]) => {
      if (vals.length) {
        lines.push(`  ${styles.label(label)}  ${vals.map((v) => styles.keyword(v)).join(", ")}`);
      }
    };
    add(
      "Package",
      tech.packageManager
        ? [
            tech.packageManager +
              (tech.packageManagerVersion ? `@${tech.packageManagerVersion}` : ""),
          ]
        : [],
    );
    if (tech.monorepo) {
      add("Monorepo", [tech.monorepo]);
    }
    add("Framework", tech.frameworks);
    add("Testing", tech.testFrameworks);
    add("Linter", tech.linters);
    add("Hooks", tech.gitHooks);
    add("CI/CD", tech.ciProviders);
    if (tech.nodeVersion) {
      lines.push(`  ${styles.label("Node")}       ${styles.keyword(tech.nodeVersion)}`);
    }
    if (tech.typescript) {
      lines.push(`  ${styles.label("Lang")}      TypeScript, JavaScript`);
    }
    if (tech.docker) {
      lines.push(`  ${styles.label("Docker")}     ${theme.muted("Dockerfile")}`);
    }
    const docs: string[] = [];
    if (tech.hasReadme) {
      docs.push("README");
    }
    if (tech.hasLicense) {
      docs.push("LICENSE");
    }
    if (tech.hasSecurity) {
      docs.push("SECURITY");
    }
    if (tech.hasContributing) {
      docs.push("CONTRIBUTING");
    }
    if (tech.changesets) {
      docs.push("changesets");
    }
    add("Docs", docs);
    return `\n${styles.subheading(` ${icons.arrow} Technologies`)}\n${this.simpleBox(lines, "")}`;
  }

  private renderCategoryScores(scores: CategoryScore[]): string {
    const table = new Table({
      head: [styles.label("Category"), styles.label("Score"), styles.label("Status")],
      style: { head: [], border: ["grey"] },
      chars: {
        top: icons.horizontal,
        "top-mid": icons.teeDown,
        "top-left": icons.topLeft,
        "top-right": icons.topRight,
        bottom: icons.horizontal,
        "bottom-mid": icons.teeUp,
        "bottom-left": icons.bottomLeft,
        "bottom-right": icons.bottomRight,
        left: icons.vertical,
        "left-mid": icons.teeRight,
        mid: icons.horizontal,
        "mid-mid": icons.crossLine,
        right: icons.vertical,
        "right-mid": icons.teeLeft,
        middle: " ",
      },
    });
    for (const cat of scores) {
      const statusIcon = this.statusIcon(cat.status);
      table.push([
        styles.label(cat.name),
        styles.number(`${cat.percentage}%`),
        `${statusIcon} ${styles.label(cat.status)}`,
      ]);
    }
    return `\n${styles.subheading(` ${icons.arrow} Category Scores`)}\n${table.toString()}`;
  }

  private renderLanguages(
    languages: Array<{ language: string; files: number; percentage: number; lines?: number }>,
  ): string {
    if (!languages.length) {
      return "";
    }
    const table = new Table({
      head: [styles.label("Language"), styles.label("Files"), styles.label("Share")],
      style: { head: [], border: ["grey"] },
      chars: {
        top: icons.horizontal,
        "top-mid": icons.teeDown,
        "top-left": icons.topLeft,
        "top-right": icons.topRight,
        bottom: icons.horizontal,
        "bottom-mid": icons.teeUp,
        "bottom-left": icons.bottomLeft,
        "bottom-right": icons.bottomRight,
        left: icons.vertical,
        "left-mid": icons.teeRight,
        mid: icons.horizontal,
        "mid-mid": icons.crossLine,
        right: icons.vertical,
        "right-mid": icons.teeLeft,
        middle: " ",
      },
    });
    for (const lang of languages.slice(0, 10)) {
      table.push([lang.language, String(lang.files), `${lang.percentage}%`]);
    }
    return `\n${styles.subheading(` ${icons.arrow} Languages`)}\n${table.toString()}`;
  }

  private renderGitStats(report: AnalysisReport): string {
    const git = report.gitStats;
    if (!git) {
      return "";
    }
    const lines: string[] = [
      `${styles.label("Commits:")}      ${styles.number(git.commitCount)}`,
      `${styles.label("Branches:")}     ${styles.number(git.branchCount)}`,
      `${styles.label("Contributors:")} ${styles.number(git.contributorCount)}`,
    ];
    if (git.largestCommits?.length) {
      const table = new Table({
        head: [styles.label("Author"), styles.label("Message"), styles.label("Files")],
        style: { head: [], border: ["grey"] },
        chars: {
          top: icons.horizontal,
          "top-mid": icons.teeDown,
          "top-left": icons.topLeft,
          "top-right": icons.topRight,
          bottom: icons.horizontal,
          "bottom-mid": icons.teeUp,
          "bottom-left": icons.bottomLeft,
          "bottom-right": icons.bottomRight,
          left: icons.vertical,
          "left-mid": icons.teeRight,
          mid: icons.horizontal,
          "mid-mid": icons.crossLine,
          right: icons.vertical,
          "right-mid": icons.teeLeft,
          middle: " ",
        },
      });
      for (const c of git.largestCommits.slice(0, 5)) {
        table.push([c.author, c.message.slice(0, 50), String(c.filesChanged)]);
      }
      lines.push(`\n   ${styles.subheading("Largest Commits")}\n${table.toString()}`);
    }
    return `\n${styles.subheading(` ${icons.arrow} Git Statistics`)}\n${this.simpleBox(lines, "")}`;
  }

  private renderIssues(report: AnalysisReport): void {
    if (report.hardcodedSecrets?.length) {
      const table = new Table({
        head: [
          severity.high("File"),
          severity.high("Line"),
          severity.high("Type"),
          severity.high("Context"),
        ],
        style: { head: [], border: ["red"] },
        chars: {
          top: icons.horizontal,
          "top-mid": icons.teeDown,
          "top-left": icons.topLeft,
          "top-right": icons.topRight,
          bottom: icons.horizontal,
          "bottom-mid": icons.teeUp,
          "bottom-left": icons.bottomLeft,
          "bottom-right": icons.bottomRight,
          left: icons.vertical,
          "left-mid": icons.teeRight,
          mid: icons.horizontal,
          "mid-mid": icons.crossLine,
          right: icons.vertical,
          "right-mid": icons.teeLeft,
          middle: " ",
        },
      });
      for (const s of report.hardcodedSecrets.slice(0, 10)) {
        table.push([s.file, String(s.line), s.type, s.context.slice(0, 60)]);
      }
      console.log(
        `\n${severity.critical(` ${icons.alert} Hardcoded Secrets Detected`)}\n${table.toString()}`,
      );
    }

    if (report.todoComments?.length) {
      const table = new Table({
        head: [
          severity.medium("File"),
          severity.medium("Line"),
          severity.medium("Type"),
          severity.medium("Text"),
        ],
        style: { head: [], border: ["yellow"] },
        chars: {
          top: icons.horizontal,
          "top-mid": icons.teeDown,
          "top-left": icons.topLeft,
          "top-right": icons.topRight,
          bottom: icons.horizontal,
          "bottom-mid": icons.teeUp,
          "bottom-left": icons.bottomLeft,
          "bottom-right": icons.bottomRight,
          left: icons.vertical,
          "left-mid": icons.teeRight,
          mid: icons.horizontal,
          "mid-mid": icons.crossLine,
          right: icons.vertical,
          "right-mid": icons.teeLeft,
          middle: " ",
        },
      });
      for (const t of report.todoComments.slice(0, 20)) {
        table.push([t.file, String(t.line), t.type, t.text.slice(0, 60)]);
      }
      console.log(
        `\n${severity.medium(` ${icons.warn} TODO/FIXME Comments`)}\n${table.toString()}`,
      );
    }

    if (report.dependencyIssues?.length) {
      const table = new Table({
        head: [
          severity.medium("Dependency"),
          severity.medium("Issue"),
          severity.medium("Severity"),
        ],
        style: { head: [], border: ["yellow"] },
        chars: {
          top: icons.horizontal,
          "top-mid": icons.teeDown,
          "top-left": icons.topLeft,
          "top-right": icons.topRight,
          bottom: icons.horizontal,
          "bottom-mid": icons.teeUp,
          "bottom-left": icons.bottomLeft,
          "bottom-right": icons.bottomRight,
          left: icons.vertical,
          "left-mid": icons.teeRight,
          mid: icons.horizontal,
          "mid-mid": icons.crossLine,
          right: icons.vertical,
          "right-mid": icons.teeLeft,
          middle: " ",
        },
      });
      for (const d of report.dependencyIssues.slice(0, 15)) {
        table.push([d.name, d.type, d.severity]);
      }
      console.log(`\n${severity.medium(` ${icons.warn} Dependency Issues`)}\n${table.toString()}`);
    }

    if (report.vulnerabilities?.length) {
      const table = new Table({
        head: [
          severity.medium("Package"),
          severity.medium("Version"),
          severity.medium("CVE"),
          severity.medium("Patched"),
          severity.medium("Severity"),
        ],
        style: { head: [], border: ["red"] },
        chars: {
          top: icons.horizontal,
          "top-mid": icons.teeDown,
          "top-left": icons.topLeft,
          "top-right": icons.topRight,
          bottom: icons.horizontal,
          "bottom-mid": icons.teeUp,
          "bottom-left": icons.bottomLeft,
          "bottom-right": icons.bottomRight,
          left: icons.vertical,
          "left-mid": icons.teeRight,
          mid: icons.horizontal,
          "mid-mid": icons.crossLine,
          right: icons.vertical,
          "right-mid": icons.teeLeft,
          middle: " ",
        },
      });
      for (const v of report.vulnerabilities.slice(0, 15)) {
        table.push([v.package, v.installedVersion, v.id, v.patchedVersion, v.severity]);
      }
      console.log(
        `\n${severity.critical(` ${icons.alert} Known Vulnerabilities`)}\n${table.toString()}`,
      );
    }

    if (report.circularImports?.length) {
      const table = new Table({
        head: [severity.medium("File"), severity.medium("Chain")],
        style: { head: [], border: ["yellow"] },
        chars: {
          top: icons.horizontal,
          "top-mid": icons.teeDown,
          "top-left": icons.topLeft,
          "top-right": icons.topRight,
          bottom: icons.horizontal,
          "bottom-mid": icons.teeUp,
          "bottom-left": icons.bottomLeft,
          "bottom-right": icons.bottomRight,
          left: icons.vertical,
          "left-mid": icons.teeRight,
          mid: icons.horizontal,
          "mid-mid": icons.crossLine,
          right: icons.vertical,
          "right-mid": icons.teeLeft,
          middle: " ",
        },
      });
      for (const c of report.circularImports.slice(0, 10)) {
        table.push([c.file, c.chain.slice(0, 5).join(" → ")]);
      }
      console.log(`\n${severity.medium(` ${icons.warn} Circular Imports`)}\n${table.toString()}`);
    }
  }

  private renderRecommendations(recommendations: string[]): string {
    if (!recommendations.length) {
      return "";
    }
    const lines = recommendations.map((r) => `   ${theme.primary(icons.star)} ${theme.muted(r)}`);
    return `\n${this.simpleBox(lines, ` ${icons.star} Recommendations `)}`;
  }

  private renderFooter(report: AnalysisReport): string {
    const duration = report.duration ?? 0;
    const time = report.analyzedAt ?? new Date().toISOString();
    return `\n${styles.dim(`   ${icons.diamond} Analyzed in ${formatDuration(duration)} at ${time}`)}\n`;
  }

  private simpleBox(lines: string[], title: string): string {
    const w = Math.min(terminalWidth(), 72);
    const border = theme.border;
    const inner = lines.map((l) => `  ${l}`).join("\n");
    const topBorder = title
      ? `  ${border(icons.topLeft + icons.horizontal)} ${styles.subheading(title)} ${border(repeat(icons.horizontal, Math.max(0, w - title.length - 6)))}${border(icons.topRight)}`
      : `  ${border(icons.topLeft)}${border(repeat(icons.horizontal, w))}${border(icons.topRight)}`;
    const bottom = `  ${border(icons.bottomLeft)}${border(repeat(icons.horizontal, w))}${border(icons.bottomRight)}`;
    return `${topBorder}\n${inner}\n${bottom}`;
  }

  private scoreColor(score: number): (s: string) => string {
    if (score >= 80) {
      return severity.success;
    }
    if (score >= 60) {
      return severity.medium;
    }
    return severity.high;
  }

  private statusIcon(status: string): string {
    switch (status) {
      case "excellent":
        return severity.success(icons.checkCircle);
      case "good":
        return severity.success(icons.check);
      case "fair":
        return severity.medium(icons.warn);
      case "poor":
        return severity.high(icons.cross);
      case "critical":
        return severity.critical(icons.alert);
      default:
        return theme.muted(icons.dot);
    }
  }
}
