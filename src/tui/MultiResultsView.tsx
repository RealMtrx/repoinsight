import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Header } from "./Header.js";
import { scopeIcon } from "../utils/detectTarget.js";
import type { MultiAnalysisSummary } from "../types/index.js";
import { formatDuration } from "./utils.js";

interface MultiResultsViewProps {
  summary: MultiAnalysisSummary;
  onBack: () => void;
}

function scoreColor(score: number): string {
  if (score >= 80) {
    return "#52B788";
  }
  if (score >= 60) {
    return "#F4A261";
  }
  return "#E63946";
}

function gradeLabel(score: number): string {
  if (score >= 90) {
    return "A";
  }
  if (score >= 80) {
    return "B";
  }
  if (score >= 65) {
    return "C";
  }
  if (score >= 50) {
    return "D";
  }
  return "F";
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function MultiResultsView({ summary, onBack }: MultiResultsViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  useInput((_input, key) => {
    if (key.escape || key.return) {
      if (showDetails) {
        setShowDetails(false);
      } else {
        onBack();
      }
      return;
    }
    if (key.downArrow || key.rightArrow) {
      if (!showDetails) {
        setShowDetails(true);
      }
      return;
    }
    if (key.upArrow || key.leftArrow) {
      if (showDetails) {
        setShowDetails(false);
      }
      return;
    }
  });

  if (showDetails) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Header tagline="Per-Project Results" compact />
        <Box flexDirection="column">
          {summary.results.map((r, i) => (
            <Box
              key={i}
              flexDirection="column"
              borderStyle="round"
              borderColor={r.error ? "#E63946" : r.report?.score >= 80 ? "#52B788" : "#F4A261"}
              paddingX={1}
              marginBottom={1}
              width={68}
            >
              <Text bold color={r.error ? "#E63946" : "#D4A017"}>
                {" "}
                {scopeIcon(r.type)} {r.name || "Unknown"}
              </Text>
              {r.error ? (
                <Text color="#E63946"> ✗ {r.error}</Text>
              ) : (
                <>
                  <Text>
                    <Text color="#8D99AE"> Score: </Text>
                    <Text color={scoreColor(r.report.score)}>{r.report.score}/100</Text>
                  </Text>
                  <Text>
                    <Text color="#8D99AE"> Files: </Text>
                    <Text color="#E76F51">{formatNumber(r.report.fileCount)}</Text>
                  </Text>
                  <Text>
                    <Text color="#8D99AE"> Duration: </Text>
                    <Text color="#4895EF">{formatDuration(r.report.duration)}</Text>
                  </Text>
                  {r.report.languages.length > 0 && (
                    <Text>
                      <Text color="#8D99AE"> Languages: </Text>
                      <Text color="#D4A017">
                        {r.report.languages
                          .slice(0, 3)
                          .map((l) => l.language)
                          .join(", ")}
                      </Text>
                    </Text>
                  )}
                </>
              )}
            </Box>
          ))}
        </Box>
        <Box justifyContent="space-between" width={68}>
          <Text color="#6C757D">◈ repoinsight</Text>
          <Text color="#8D99AE">↑↓ Overview · Esc Back</Text>
        </Box>
      </Box>
    );
  }

  const avg = summary.averageScore;
  const best = summary.bestProject;
  const worst = summary.worstProject;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header tagline="Multi-path analysis complete" compact />

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#D4A017"
        paddingX={1}
        marginBottom={1}
        width={48}
      >
        <Text bold color="#D4A017">
          {" "}
          Analysis Complete{" "}
        </Text>
        <DataRow label="Repositories" value={formatNumber(summary.repositories)} color="#2A9D8F" />
        <DataRow label="Folders" value={formatNumber(summary.directories)} color="#4895EF" />
        <DataRow label="Total Files" value={formatNumber(summary.totalFiles)} color="#E76F51" />
        <Text>
          <Text color="#8D99AE"> Average Health Score </Text>
          <Text bold color={scoreColor(avg)}>
            {gradeLabel(avg)}
          </Text>
        </Text>
      </Box>

      {best && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="#52B788"
          paddingX={1}
          marginBottom={1}
          width={48}
        >
          <Text bold color="#52B788">
            {" "}
            Best Project{" "}
          </Text>
          <Text>
            <Text color="#8D99AE"> </Text>
            <Text color="#E2DCC8" bold>
              {best.name}
            </Text>
          </Text>
        </Box>
      )}

      {worst && worst.name !== best?.name && (
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="#F4A261"
          paddingX={1}
          marginBottom={1}
          width={48}
        >
          <Text bold color="#F4A261">
            {" "}
            Needs Attention{" "}
          </Text>
          <Text>
            <Text color="#8D99AE"> </Text>
            <Text color="#E2DCC8" bold>
              {worst.name}
            </Text>
          </Text>
        </Box>
      )}

      <Box justifyContent="space-between" width={48}>
        <Text color="#6C757D">◈ repoinsight</Text>
        <Text color="#8D99AE">↓ Details · Esc Back</Text>
      </Box>
    </Box>
  );
}

function DataRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Text>
      <Text color="#8D99AE"> {label.padEnd(16)}</Text>
      <Text color={color}>{value}</Text>
    </Text>
  );
}
