import type { AnalysisReport } from "../types/index.js";
import { formatFileSize } from "../utils/file.js";
import { scopeIcon, scopeLabel } from "../utils/detectTarget.js";

export class MarkdownReporter {
  render(report: AnalysisReport): string {
    const s: string[] = [];

    s.push(`# ◆ repoinsight Report: ${report.projectName}\n`);
    s.push(
      `> ${scopeIcon(report.scope.type)} **${scopeLabel(report.scope.type)}** — ${report.scope.targetPath}\n`,
    );
    s.push(`> ${report.projectPath} · ${report.analyzedAt} · ${report.duration}ms\n`);

    s.push(this.summary(report));
    s.push(this.score(report));
    s.push(this.technologies(report.technologies));
    s.push(this.categories(report.categoryScores));
    s.push(this.languages(report.languages));
    if (report.gitStats) {
      s.push(this.git(report));
    }
    s.push(this.issues(report));
    s.push(this.recs(report.recommendations));

    if (report.biggestFiles.length) {
      s.push(this.bigFiles(report));
    }
    if (report.complexity.filter((c) => c.cyclomaticComplexity > 10).length) {
      s.push(this.complex(report));
    }

    return s.join("\n\n");
  }

  private summary(r: AnalysisReport): string {
    const m = r.summary;
    return [
      "## Summary\n",
      "| Metric | Value |",
      "|--------|-------|",
      `| Files       | ${m.totalFiles} |`,
      `| Folders     | ${m.totalFolders} |`,
      `| Size        | ${formatFileSize(m.totalSize)} |`,
      `| Languages   | ${m.languages} |`,
      `| Commits     | ${m.commits} |`,
      `| Branches    | ${m.branches} |`,
      `| Contributors| ${m.contributors} |`,
      `| **Score**   | **${m.score}/100** |`,
    ].join("\n");
  }

  private score(r: AnalysisReport): string {
    const bar = this.progressBar(r.score, 20);
    return `## Overall Score\n\n**${r.score}/100**\n\n\`${bar}\`\n`;
  }

  private technologies(tech: AnalysisReport["technologies"]): string {
    const rows: string[] = [
      "## Technologies\n\n| Category | Detected |",
      "|----------|----------|",
    ];
    const add = (label: string, vals: string[]) => {
      if (vals.length) {
        rows.push(`| ${label} | ${vals.join(", ")} |`);
      }
    };
    const pm = tech.packageManager
      ? tech.packageManager + (tech.packageManagerVersion ? `@${tech.packageManagerVersion}` : "")
      : null;
    if (pm) {
      add("Package", [pm]);
    }
    if (tech.monorepo) {
      add("Monorepo", [tech.monorepo]);
    }
    add("Framework", tech.frameworks);
    add("Testing", tech.testFrameworks);
    add("Linter", tech.linters);
    add("Hooks", tech.gitHooks);
    add("CI/CD", tech.ciProviders);
    if (tech.nodeVersion) {
      add("Node", [tech.nodeVersion]);
    }
    if (tech.typescript) {
      add("Lang", ["TypeScript, JavaScript"]);
    }
    if (tech.docker) {
      add("Docker", ["Dockerfile"]);
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
    add("Docs", docs);
    return rows.join("\n") + "\n";
  }

  private categories(cats: { name: string; percentage: number; status: string }[]): string {
    if (!cats.length) {
      return "";
    }
    return (
      "## Category Scores\n\n| Category | Score | Status |\n|----------|-------|--------|\n" +
      cats.map((c) => `| ${c.name} | ${c.percentage}% | ${this.badge(c.status)} |`).join("\n")
    );
  }

  private languages(langs: { language: string; files: number; percentage: number }[]): string {
    if (!langs.length) {
      return "";
    }
    return (
      "## Languages\n\n| Language | Files | Share |\n|----------|-------|-------|\n" +
      langs
        .slice(0, 10)
        .map((l) => `| ${l.language} | ${l.files} | ${l.percentage}% |`)
        .join("\n")
    );
  }

  private git(r: AnalysisReport): string {
    const g = r.gitStats!;
    const lines = [
      "## Git Statistics\n",
      `- **Commits:** ${g.commitCount}`,
      `- **Branches:** ${g.branchCount}`,
      `- **Contributors:** ${g.contributorCount}`,
    ];
    if (g.firstCommitDate) {
      lines.push(`- **First Commit:** ${g.firstCommitDate}`);
    }
    if (g.lastCommitDate) {
      lines.push(`- **Last Commit:** ${g.lastCommitDate}`);
    }
    return lines.join("\n");
  }

  private issues(r: AnalysisReport): string {
    const p: string[] = [];
    if (r.hardcodedSecrets.length) {
      p.push("### 🔒 Hardcoded Secrets\n");
      p.push("| File | Line | Type | Context |\n|------|------|------|---------|");
      for (const s of r.hardcodedSecrets.slice(0, 10)) {
        p.push(`| ${s.file} | ${s.line} | ${s.type} | \`${s.context.slice(0, 50)}\` |`);
      }
    }
    if (r.todoComments.length) {
      p.push("### 📝 TODO/FIXME Comments\n");
      p.push("| File | Line | Type | Text |\n|------|------|------|------|");
      for (const t of r.todoComments.slice(0, 20)) {
        p.push(`| ${t.file} | ${t.line} | ${t.type} | ${t.text.slice(0, 60)} |`);
      }
    }
    if (r.dependencyIssues.length) {
      p.push("### 📦 Dependency Issues\n");
      p.push("| Dependency | Type | Severity |\n|------------|------|----------|");
      for (const d of r.dependencyIssues.slice(0, 15)) {
        p.push(`| ${d.name} | ${d.type} | ${d.severity} |`);
      }
    }
    if (r.circularImports.length) {
      p.push("### 🔄 Circular Imports\n");
      p.push("| File | Chain |\n|------|-------|");
      for (const c of r.circularImports.slice(0, 10)) {
        p.push(`| ${c.file} | ${c.chain.join(" → ")} |`);
      }
    }
    if (!p.length) {
      return "## Issues\n\n_No issues detected._\n";
    }
    return `## Issues\n\n${p.join("\n\n")}\n`;
  }

  private recs(recs: string[]): string {
    if (!recs.length) {
      return "## Recommendations\n\n_No recommendations._\n";
    }
    return "## Recommendations\n\n" + recs.map((r) => `- ◆ ${r}`).join("\n") + "\n";
  }

  private bigFiles(r: AnalysisReport): string {
    return (
      "## Biggest Files\n\n| File | Size |\n|------|------|\n" +
      r.biggestFiles
        .slice(0, 10)
        .map((f) => `| ${f.path} | ${formatFileSize(f.size)} |`)
        .join("\n")
    );
  }

  private complex(r: AnalysisReport): string {
    return (
      "## Complex Code\n\n| File | Lines | Complexity | Functions |\n|------|-------|------------|-----------|\n" +
      r.complexity
        .filter((c) => c.cyclomaticComplexity > 10)
        .map(
          (c) =>
            `| ${c.file} | ${c.linesOfCode} | ${c.cyclomaticComplexity} | ${c.functionCount} |`,
        )
        .join("\n")
    );
  }

  private progressBar(score: number, w: number): string {
    const fill = Math.round((score / 100) * w);
    return "█".repeat(fill) + "░".repeat(w - fill);
  }

  private badge(status: string): string {
    switch (status) {
      case "excellent":
        return "🟢 excellent";
      case "good":
        return "🔵 good";
      case "fair":
        return "🟡 fair";
      case "poor":
        return "🟠 poor";
      case "critical":
        return "🔴 critical";
      default:
        return status;
    }
  }
}
