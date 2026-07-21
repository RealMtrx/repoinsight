import { Box, Text } from "ink";
import type { AnalysisReport } from "../types/index.js";
import { formatDuration } from "./utils.js";

interface StatsViewProps {
  report: AnalysisReport;
}

export function StatsView({ report }: StatsViewProps) {
  return (
    <Box flexDirection="column" paddingX={2}>
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#D4A017"
        paddingX={2}
        marginBottom={1}
      >
        <Text bold color="#D4A017">
          {" "}Stats{" "}
        </Text>
        <Text>
          <Text color="#8D99AE">Files:     </Text>
          <Text color="#E76F51">{report.fileCount}</Text>
        </Text>
        <Text>
          <Text color="#8D99AE">Score:     </Text>
          <Text color={report.score >= 80 ? "#52B788" : report.score >= 60 ? "#F4A261" : "#E63946"}>
            {report.score}/100
          </Text>
        </Text>
        <Text>
          <Text color="#8D99AE">Duration:  </Text>
          <Text color="#E76F51">{formatDuration(report.duration)}</Text>
        </Text>
        <Text>
          <Text color="#8D99AE">Languages: </Text>
          <Text color="#E76F51">{report.languages.length}</Text>
        </Text>
      </Box>
      <Box justifyContent="space-between" width="100%">
        <Text color="#6C757D">◈ repoinsight</Text>
        <Text color="#8D99AE">Q Back to Dashboard</Text>
      </Box>
    </Box>
  );
}
