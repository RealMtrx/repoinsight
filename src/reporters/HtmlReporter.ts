import type { AnalysisReport } from "../types/index.js";
import { formatFileSize } from "../utils/file.js";

export class HtmlReporter {
  render(report: AnalysisReport): string {
    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>repoinsight Report - ${this.escapeHtml(report.projectName)}</title>
<style>
  :root {
    --bg: #0d1117;
    --bg-card: #161b22;
    --bg-hover: #1c2333;
    --text: #e6edf3;
    --text-secondary: #8b949e;
    --border: #30363d;
    --accent: #58a6ff;
    --green: #3fb950;
    --yellow: #d29922;
    --red: #f85149;
    --orange: #db6d28;
    --purple: #bc8cff;
  }
  [data-theme="light"] {
    --bg: #ffffff;
    --bg-card: #f6f8fa;
    --bg-hover: #eef1f5;
    --text: #1f2328;
    --text-secondary: #656d76;
    --border: #d0d7de;
    --accent: #0969da;
    --green: #1a7f37;
    --yellow: #9a6700;
    --red: #cf222e;
    --orange: #bd561d;
    --purple: #8250df;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
    padding: 0;
  }
  .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
  header {
    text-align: center;
    padding: 48px 24px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
  }
  header h1 {
    font-size: 2.5rem;
    background: linear-gradient(135deg, var(--accent), var(--purple));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  header p { color: var(--text-secondary); margin-top: 8px; }
  .theme-toggle {
    position: fixed;
    top: 16px;
    right: 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }
  .theme-toggle:hover { background: var(--bg-hover); }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .summary-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  }
  .summary-card .value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--accent);
  }
  .summary-card .label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .score-container {
    text-align: center;
    margin-bottom: 32px;
  }
  .score-ring {
    width: 160px;
    height: 160px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 700;
    border: 6px solid;
    margin-bottom: 12px;
  }
  .score-excellent { border-color: var(--green); color: var(--green); }
  .score-good { border-color: var(--accent); color: var(--accent); }
  .score-fair { border-color: var(--yellow); color: var(--yellow); }
  .score-poor { border-color: var(--orange); color: var(--orange); }
  .score-critical { border-color: var(--red); color: var(--red); }
  .categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .category-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
  }
  .category-card h3 {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  .category-bar {
    height: 8px;
    background: var(--border);
    border-radius: 4px;
    overflow: hidden;
    margin: 8px 0;
  }
  .category-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  .category-score-value {
    font-size: 1.5rem;
    font-weight: 700;
  }
  .category-status {
    font-size: 0.8rem;
    margin-top: 4px;
  }
  .section {
    margin-bottom: 32px;
  }
  .section h2 {
    font-size: 1.3rem;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }
  th, td {
    padding: 10px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border);
  }
  th {
    background: var(--bg-hover);
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg-hover); }
  .recommendations-list {
    list-style: none;
    padding: 0;
  }
  .recommendations-list li {
    padding: 12px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .recommendations-list li::before {
    content: "→ ";
    color: var(--accent);
  }
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .badge-green { background: rgba(63, 185, 80, 0.15); color: var(--green); }
  .badge-yellow { background: rgba(210, 153, 34, 0.15); color: var(--yellow); }
  .badge-red { background: rgba(248, 81, 73, 0.15); color: var(--red); }
  .badge-blue { background: rgba(88, 166, 255, 0.15); color: var(--accent); }
  .issues-list { margin-top: 16px; }
  .issue-item {
    padding: 12px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 4px solid;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .issue-critical { border-left-color: var(--red); }
  .issue-warning { border-left-color: var(--yellow); }
  footer {
    text-align: center;
    padding: 32px;
    color: var(--text-secondary);
    font-size: 0.85rem;
    border-top: 1px solid var(--border);
    margin-top: 32px;
  }
  @media (max-width: 768px) {
    .container { padding: 16px; }
    header h1 { font-size: 1.8rem; }
    .summary-grid { grid-template-columns: repeat(2, 1fr); }
    .categories-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<button class="theme-toggle" onclick="toggleTheme()">Toggle Theme</button>
<div class="container">
  <header>
    <h1>${this.escapeHtml(report.projectName)}</h1>
    <p>${this.escapeHtml(report.projectPath)}</p>
    <p style="font-size:0.85rem;margin-top:4px">Analyzed: ${report.analyzedAt} | Duration: ${report.duration}ms</p>
  </header>

  <div class="score-container">
    <div class="score-ring score-${this.getScoreClass(report.score)}">
      ${report.score}
    </div>
    <div style="font-size:1.2rem;color:var(--text-secondary)">out of 100</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card"><div class="value">${report.summary.totalFiles}</div><div class="label">Files</div></div>
    <div class="summary-card"><div class="value">${report.summary.totalFolders}</div><div class="label">Folders</div></div>
    <div class="summary-card"><div class="value">${formatFileSize(report.summary.totalSize)}</div><div class="label">Size</div></div>
    <div class="summary-card"><div class="value">${report.summary.languages}</div><div class="label">Languages</div></div>
    <div class="summary-card"><div class="value">${report.summary.commits}</div><div class="label">Commits</div></div>
    <div class="summary-card"><div class="value">${report.summary.contributors}</div><div class="label">Contributors</div></div>
  </div>

  <div class="section">
    <h2>Category Scores</h2>
    <div class="categories-grid">
      ${report.categoryScores.map((cat) => this.renderCategoryCard(cat)).join("")}
    </div>
  </div>

  <div class="section">
    <h2>Languages</h2>
    <table>
      <thead><tr><th>Language</th><th>Files</th><th>Share</th></tr></thead>
      <tbody>
        ${report.languages
          .slice(0, 10)
          .map(
            (l) =>
              `<tr><td>${this.escapeHtml(l.language)}</td><td>${l.files}</td><td>${l.percentage}%</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>

  ${report.gitStats ? this.renderGitStatsHtml(report) : ""}

  ${this.renderIssuesHtml(report)}

  ${
    report.recommendations.length > 0
      ? `
  <div class="section">
    <h2>Recommendations</h2>
    <ul class="recommendations-list">
      ${report.recommendations.map((r) => `<li>${this.escapeHtml(r)}</li>`).join("")}
    </ul>
  </div>`
      : ""
  }

  ${
    report.biggestFiles.length > 0
      ? `
  <div class="section">
    <h2>Biggest Files</h2>
    <table>
      <thead><tr><th>File</th><th>Size</th></tr></thead>
      <tbody>
        ${report.biggestFiles
          .slice(0, 10)
          .map(
            (f) => `<tr><td>${this.escapeHtml(f.path)}</td><td>${formatFileSize(f.size)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }

  ${
    report.largeAssets.length > 0
      ? `
  <div class="section">
    <h2>Large Assets</h2>
    <table>
      <thead><tr><th>File</th><th>Size</th><th>Type</th></tr></thead>
      <tbody>
        ${report.largeAssets.map((a) => `<tr><td>${this.escapeHtml(a.path)}</td><td>${formatFileSize(a.size)}</td><td>${this.escapeHtml(a.type)}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }

  ${
    report.complexity.filter((c) => c.cyclomaticComplexity > 10).length > 0
      ? `
  <div class="section">
    <h2>Complex Code</h2>
    <table>
      <thead><tr><th>File</th><th>Lines</th><th>Complexity</th><th>Functions</th></tr></thead>
      <tbody>
        ${report.complexity
          .filter((c) => c.cyclomaticComplexity > 10)
          .map(
            (c) =>
              `<tr><td>${this.escapeHtml(c.file)}</td><td>${c.linesOfCode}</td><td>${c.cyclomaticComplexity}</td><td>${c.functionCount}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }

  <footer>
    Generated by <strong>repoinsight</strong> &mdash; Understand any repository in seconds.
  </footer>
</div>

<script>
function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
}
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
</script>
</body>
</html>`;
  }

  private renderCategoryCard(cat: { name: string; percentage: number; status: string }): string {
    const color = this.statusColor(cat.status);
    return `<div class="category-card">
      <h3>${this.capitalize(cat.name)}</h3>
      <div class="category-score-value" style="color:${color}">${cat.percentage}%</div>
      <div class="category-bar"><div class="category-bar-fill" style="width:${cat.percentage}%;background:${color}"></div></div>
      <div class="category-status"><span class="badge badge-${this.statusBadgeClass(cat.status)}">${this.capitalize(cat.status)}</span></div>
    </div>`;
  }

  private renderGitStatsHtml(report: AnalysisReport): string {
    const stats = report.gitStats!;
    return `<div class="section">
      <h2>Git Statistics</h2>
      <div class="summary-grid">
        <div class="summary-card"><div class="value">${stats.commitCount}</div><div class="label">Commits</div></div>
        <div class="summary-card"><div class="value">${stats.branchCount}</div><div class="label">Branches</div></div>
        <div class="summary-card"><div class="value">${stats.contributorCount}</div><div class="label">Contributors</div></div>
      </div>
      ${
        stats.largestCommits.length > 0
          ? `
      <table style="margin-top:16px">
        <thead><tr><th>Author</th><th>Message</th><th>Files</th><th>Date</th></tr></thead>
        <tbody>
          ${stats.largestCommits
            .slice(0, 5)
            .map(
              (c) =>
                `<tr><td>${this.escapeHtml(c.author)}</td><td>${this.escapeHtml(c.message.substring(0, 50))}</td><td>${c.filesChanged}</td><td>${this.escapeHtml(c.date)}</td></tr>`,
            )
            .join("")}
        </tbody>
      </table>`
          : ""
      }
    </div>`;
  }

  private renderIssuesHtml(report: AnalysisReport): string {
    const parts: string[] = [];
    if (report.hardcodedSecrets.length > 0) {
      parts.push(
        `<h3>Hardcoded Secrets <span class="badge badge-red">${report.hardcodedSecrets.length}</span></h3>`,
      );
      parts.push('<div class="issues-list">');
      for (const s of report.hardcodedSecrets) {
        parts.push(
          `<div class="issue-item issue-critical"><strong>${this.escapeHtml(s.file)}:${s.line}</strong> — ${this.escapeHtml(s.type)}<br><code>${this.escapeHtml(s.context)}</code></div>`,
        );
      }
      parts.push("</div>");
    }
    if (report.todoComments.length > 0) {
      parts.push(
        `<h3>TODO/FIXME Comments <span class="badge badge-yellow">${report.todoComments.length}</span></h3>`,
      );
      parts.push('<div class="issues-list">');
      for (const t of report.todoComments.slice(0, 20)) {
        parts.push(
          `<div class="issue-item issue-warning"><strong>${this.escapeHtml(t.file)}:${t.line}</strong> [${t.type}] ${this.escapeHtml(t.text)}</div>`,
        );
      }
      parts.push("</div>");
    }
    if (report.dependencyIssues.length > 0) {
      parts.push(
        `<h3>Dependency Issues <span class="badge badge-yellow">${report.dependencyIssues.length}</span></h3>`,
      );
      parts.push('<div class="issues-list">');
      for (const d of report.dependencyIssues) {
        parts.push(
          `<div class="issue-item ${d.severity === "critical" ? "issue-critical" : "issue-warning"}">${this.escapeHtml(d.name)} — ${d.type} (${d.severity})</div>`,
        );
      }
      parts.push("</div>");
    }
    if (report.circularImports.length > 0) {
      parts.push(
        `<h3>Circular Imports <span class="badge badge-red">${report.circularImports.length}</span></h3>`,
      );
      parts.push('<div class="issues-list">');
      for (const c of report.circularImports) {
        parts.push(
          `<div class="issue-item issue-critical"><strong>${this.escapeHtml(c.file)}</strong> → ${this.escapeHtml(c.chain.join(" → "))}</div>`,
        );
      }
      parts.push("</div>");
    }
    if (parts.length === 0) {
      return "";
    }
    return `<div class="section"><h2>Issues</h2>${parts.join("")}</div>`;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private getScoreClass(score: number): string {
    if (score >= 80) {
      return "excellent";
    }
    if (score >= 60) {
      return "good";
    }
    if (score >= 40) {
      return "fair";
    }
    if (score >= 20) {
      return "poor";
    }
    return "critical";
  }

  private statusColor(status: string): string {
    switch (status) {
      case "excellent":
        return "#3fb950";
      case "good":
        return "#58a6ff";
      case "fair":
        return "#d29922";
      case "poor":
        return "#db6d28";
      case "critical":
        return "#f85149";
      default:
        return "#8b949e";
    }
  }

  private statusBadgeClass(status: string): string {
    switch (status) {
      case "excellent":
      case "good":
        return "green";
      case "fair":
        return "yellow";
      case "poor":
      case "critical":
        return "red";
      default:
        return "blue";
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
