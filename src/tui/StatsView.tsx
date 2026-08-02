import { Box, Text } from "ink";
import type { AnalysisReport } from "../types/index.js";
import { formatDuration } from "./utils.js";
import { scopeIcon, scopeLabel } from "../utils/detectTarget.js";

interface StatsViewProps {
  report: AnalysisReport;
}

export function StatsView({ report }: StatsViewProps) {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#D4A017"
        paddingX={1}
        marginBottom={1}
        width={52}
      >
        <Text bold color="#D4A017">
          {" "}
          Stats{" "}
        </Text>
        <Text>
          <Text color="#8D99AE">Target </Text>
          <Text color="#D4A017">
            {scopeIcon(report.scope.type)} {scopeLabel(report.scope.type)}
          </Text>
        </Text>
        <Text>
          <Text color="#8D99AE">Path </Text>
          <Text color="#64B5F6">{report.scope.targetPath}</Text>
        </Text>
        <DataRow label="Files" value={String(report.fileCount)} color="#E76F51" />
        <DataRow
          label="Score"
          value={`${report.score}/100`}
          color={report.score >= 80 ? "#52B788" : report.score >= 60 ? "#F4A261" : "#E63946"}
        />
        <DataRow label="Duration" value={formatDuration(report.duration)} color="#4895EF" />
        <DataRow label="Languages" value={String(report.languages.length)} color="#D4A017" />
        {report.gitStats && (
          <>
            <DataRow
              label="Commits"
              value={String(report.gitStats.commitCount ?? "—")}
              color="#64B5F6"
            />
            <DataRow
              label="Branches"
              value={String(report.gitStats.branchCount ?? "—")}
              color="#64B5F6"
            />
            <DataRow
              label="Contributors"
              value={String(report.gitStats.contributorCount ?? "—")}
              color="#64B5F6"
            />
          </>
        )}
      </Box>
      <Box justifyContent="space-between" width={52}>
        <Text color="#6C757D">◈ repoinsight</Text>
        <Text color="#8D99AE">Q Back to Dashboard</Text>
      </Box>
    </Box>
  );
}

function DataRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Text>
      <Text color="#8D99AE">{label.padEnd(14)}</Text>
      <Text color={color}>{value}</Text>
    </Text>
  );
}
