import { Box, Text } from "ink";
import type { AnalysisReport } from "../types/index.js";
import { Header } from "./Header.js";
import { icons } from "./symbols.js";
import { formatDuration } from "./utils.js";
import { scopeIcon, scopeLabel } from "../utils/detectTarget.js";

interface ResultsViewProps {
  report: AnalysisReport;
  section: number;
}

interface SectionDef {
  label: string;
  icon: string;
  render: (report: AnalysisReport) => React.ReactNode;
}

function ScoreColor({ score }: { score: number }) {
  const color = score >= 80 ? "#52B788" : score >= 60 ? "#F4A261" : "#E63946";
  return <Text color={color}>{score}/100</Text>;
}

function IssueLine({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  const has = count > 0;
  return (
    <Text>
      <Text color="#8D99AE">{label.padEnd(18)} </Text>
      <Text color={has ? color : "#8D99AE"}>
        {has ? "◐" : "◉"} {has ? count : "—"}
      </Text>
    </Text>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const barWidth = 20;
  const ratio = Math.min(score / 100, 1);
  const filled = Math.round(ratio * barWidth);
  const empty = barWidth - filled;
  const barColor = score >= 80 ? "#52B788" : score >= 60 ? "#F4A261" : "#E63946";

  return (
    <Text>
      <Text color="#8D99AE">{label.padEnd(18)}</Text>
      <Text color={barColor}>{"▓".repeat(filled)}</Text>
      <Text color="#3D405B">{"░".repeat(empty)}</Text>
      <Text color={barColor}> {score}%</Text>
    </Text>
  );
}

function LangBar({ lang, files, total }: { lang: string; files: number; total: number }) {
  const width = 20;
  const ratio = total > 0 ? Math.min(files / total, 1) : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const pct = (ratio * 100).toFixed(0);

  return (
    <Text>
      <Text color="#8D99AE">{lang.padEnd(18)}</Text>
      <Text color="#D4A017">{"▓".repeat(filled)}</Text>
      <Text color="#3D405B">{"░".repeat(empty)}</Text>
      <Text color="#D4A017"> {pct}%</Text>
      <Text color="#6C757D"> ({files} files)</Text>
    </Text>
  );
}

function SummarySection({ report }: { report: AnalysisReport }) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="#8D99AE">Target:   </Text>
        <Text color="#D4A017">{scopeIcon(report.scope.type)} {scopeLabel(report.scope.type)}</Text>
      </Text>
      <Text>
        <Text color="#8D99AE">Path:     </Text>
        <Text color="#64B5F6">{report.scope.targetPath}</Text>
      </Text>
      <Text>
        <Text color="#8D99AE">Score:    </Text>
        <ScoreColor score={report.score} />
      </Text>
      <Text>
        <Text color="#8D99AE">Files:    </Text>
        <Text color="#E76F51">{report.fileCount}</Text>
      </Text>
      <Text>
        <Text color="#8D99AE">Duration: </Text>
        <Text color="#E76F51">{formatDuration(report.duration)}</Text>
      </Text>
      <Text>
        <Text color="#8D99AE">Size:     </Text>
        <Text color="#E76F51">{formatSize(report.projectSize)}</Text>
      </Text>
      <Text>
        <Text color="#8D99AE">Git:      </Text>
        <Text color={report.gitStats ? "#52B788" : "#8D99AE"}>
          {report.gitStats ? "✓ active" : "—"}
        </Text>
      </Text>
      <Text>
        <Text color="#8D99AE">Languages:</Text>
        <Text color="#E76F51"> {report.languages.length}</Text>
      </Text>
      <Box marginTop={1} flexDirection="column">
        <IssueLine
          label="Secrets"
          count={report.hardcodedSecrets.length}
          color="#E63946"
        />
        <IssueLine
          label="TODO Items"
          count={report.todoComments.length}
          color="#F4A261"
        />
        <IssueLine
          label="Circular Imports"
          count={report.circularImports.length}
          color="#F4A261"
        />
        <IssueLine
          label="Dependency Issues"
          count={report.dependencyIssues.length}
          color="#4895EF"
        />
        <IssueLine
          label="Duplicate Files"
          count={report.duplicateFileNames.length}
          color="#4895EF"
        />
        <IssueLine
          label="Missing README"
          count={report.missingReadme ? 1 : 0}
          color="#F4A261"
        />
        <IssueLine
          label="Missing License"
          count={report.missingLicense ? 1 : 0}
          color="#F4A261"
        />
        <IssueLine
          label="Missing Tests"
          count={report.missingTests ? 1 : 0}
          color="#F4A261"
        />
      </Box>
    </Box>
  );
}

function ScoresSection({ report }: { report: AnalysisReport }) {
  return (
    <Box flexDirection="column">
      {report.categoryScores.map((cat) => (
        <ScoreBar key={cat.name} label={cat.name} score={cat.score} />
      ))}
      <Box marginTop={1}>
        <Text color="#8D99AE">Overall: </Text>
        <ScoreColor score={report.score} />
      </Box>
    </Box>
  );
}

function LanguagesSection({ report }: { report: AnalysisReport }) {
  const sorted = [...report.languages].sort((a, b) => b.percentage - a.percentage);
  return (
    <Box flexDirection="column">
      {sorted.map((lang) => (
        <LangBar
          key={lang.language}
          lang={lang.language}
          files={lang.files}
          total={report.fileCount}
        />
      ))}
    </Box>
  );
}

function TechSection({ report }: { report: AnalysisReport }) {
  const tech = report.technologies;
  const items: Array<[string, string]> = [];

  if (tech.packageManager) {items.push(["Package Manager", tech.packageManager]);}
  if (tech.monorepo) {items.push(["Monorepo", tech.monorepo]);}
  for (const f of tech.frameworks) {items.push(["Framework", f]);}
  for (const t of tech.testFrameworks) {items.push(["Testing", t]);}
  for (const l of tech.linters) {items.push(["Linter", l]);}
  for (const c of tech.ciProviders) {items.push(["CI/CD", c]);}
  if (tech.nodeVersion) {items.push(["Node", tech.nodeVersion]);}
  if (tech.typescript) {items.push(["TypeScript", "✓"]);}
  if (tech.docker) {items.push(["Docker", "✓ detected"]);}
  for (const h of tech.gitHooks) {items.push(["Hooks", h]);}

  return (
    <Box flexDirection="column">
      {items.map(([label, value]) => (
        <Text key={label}>
          <Text color="#8D99AE">{label.padEnd(16)}</Text>
          <Text color="#2A9D8F" bold>
            {" "}{value}
          </Text>
        </Text>
      ))}
    </Box>
  );
}

function FilesSection({ report }: { report: AnalysisReport }) {
  return (
    <Box flexDirection="column">
      {report.biggestFolders.length > 0 && (
        <Box flexDirection="column">
          <Text color="#2A9D8F" bold>
            ▣ Largest Folders
          </Text>
          {report.biggestFolders.slice(0, 5).map((f) => (
            <Text key={f.path}>
              <Text>  ◇ </Text>
              <Text color="#64B5F6" italic>
                {f.path}
              </Text>
              <Text color="#6C757D"> ({f.fileCount} files)</Text>
            </Text>
          ))}
        </Box>
      )}
      {report.biggestFiles.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text color="#2A9D8F" bold>
            ◇ Largest Files
          </Text>
          {report.biggestFiles.slice(0, 5).map((f) => (
            <Text key={f.path}>
              <Text>  ◇ </Text>
              <Text color="#64B5F6" italic>
                {f.path}
              </Text>
              <Text color="#6C757D"> ({formatSize(f.size)})</Text>
            </Text>
          ))}
        </Box>
      )}
      {(() => {
        const missing: string[] = [];
        if (report.missingReadme) {missing.push("README");}
        if (report.missingLicense) {missing.push("LICENSE");}
        if (report.missingGitignore) {missing.push(".gitignore");}
        if (report.missingTests) {missing.push("Tests");}
        if (report.missingCi) {missing.push("CI/CD");}
        if (missing.length > 0) {
          return (
            <Box marginTop={1} flexDirection="column">
              <Text color="#F4A261" bold>
                ◐ Missing
              </Text>
              <Text color="#8D99AE"> {missing.join(", ")}</Text>
            </Box>
          );
        }
        return null;
      })()}
    </Box>
  );
}

function RecsSection({ report }: { report: AnalysisReport }) {
  if (report.recommendations.length === 0) {
    return <Text color="#6C757D">No recommendations — repository looks great!</Text>;
  }
  return (
    <Box flexDirection="column">
      {report.recommendations.map((rec, i) => (
        <Text key={i}>
          <Text color="#D4A017">▸ </Text>
          <Text>{rec}</Text>
        </Text>
      ))}
    </Box>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes} B`;}
  if (bytes < 1_048_576) {return `${(bytes / 1024).toFixed(1)} KB`;}
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function ResultsView({
  report,
  section,
}: ResultsViewProps) {
  const sections: SectionDef[] = [
    { label: "Summary", icon: icons.diamond, render: (r) => <SummarySection report={r} /> },
    { label: "Score Breakdown", icon: icons.chart, render: (r) => <ScoresSection report={r} /> },
    { label: "Languages", icon: icons.file, render: (r) => <LanguagesSection report={r} /> },
    { label: "Technologies", icon: icons.package, render: (r) => <TechSection report={r} /> },
    { label: "Files & Folders", icon: icons.folder, render: (r) => <FilesSection report={r} /> },
    { label: "Recommendations", icon: icons.flag, render: (r) => <RecsSection report={r} /> },
  ];

  const current = sections[section];
  if (!current) {return null;}

  const totalSections = sections.length;

  return (
    <Box flexDirection="column" paddingX={2}>
      <Header tagline="Analysis Complete" compact />
      <Box
        flexDirection="row"
        borderStyle="round"
        borderColor="#2A9D8F"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="#2A9D8F">
          {" "}Sections{" "}
        </Text>
        <Box gap={1} flexWrap="wrap">
          {sections.map((s, i) => (
            <Text
              key={s.label}
              color={i === section ? "#D4A017" : "#8D99AE"}
              bold={i === section}
            >
              {i === section ? `${icons.arrow} ` : "  "}
              {s.label}
            </Text>
          ))}
        </Box>
      </Box>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#D4A017"
        paddingX={2}
        paddingY={1}
        marginBottom={1}
      >
        <Text bold color="#D4A017">
          {" "}{current.icon} {current.label}{" "}
        </Text>
        {current.render(report)}
      </Box>
      <Box justifyContent="space-between" width="100%">
        <Text color="#6C757D">
          ◈ {report.projectName ?? report.projectPath}
        </Text>
        <Text color="#8D99AE">
          {current.label} ({section + 1}/{totalSections})
        </Text>
        <Text color="#6C757D">
          ←→ Navigate · Q Back
        </Text>
      </Box>
    </Box>
  );
}
