import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Header } from "./Header.js";
import { getSystemTargets } from "../utils/getSystemDrives.js";

interface AnalyzeScopeScreenProps {
  onSelectEntireComputer: () => void;
  onSelectCustomPaths: () => void;
  onBack: () => void;
}

type Mode = "menu" | "confirm-entire";

const OPTIONS = [
  { id: "entire-pc", label: "Entire Computer", description: "Scan all drives and mounted volumes" },
  { id: "custom-paths", label: "Custom Paths", description: "Choose specific folders and repositories" },
] as const;

export function AnalyzeScopeScreen({
  onSelectEntireComputer,
  onSelectCustomPaths,
  onBack,
}: AnalyzeScopeScreenProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const [selected, setSelected] = useState(0);

  const drives = getSystemTargets();
  const driveList = drives.map((d) => d.path).join(", ");

  useInput((_input, key) => {
    if (mode === "confirm-entire") {
      if (key.escape) {
        setMode("menu");
        return;
      }
      if (key.return) {
        onSelectEntireComputer();
        return;
      }
      return;
    }

    if (key.escape) {
      onBack();
      return;
    }
    if (key.upArrow) {
      setSelected((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setSelected((i) => Math.min(OPTIONS.length - 1, i + 1));
      return;
    }
    if (key.return) {
      const option = OPTIONS[selected];
      if (option?.id === "custom-paths") {
        onSelectCustomPaths();
      } else if (option?.id === "entire-pc") {
        setMode("confirm-entire");
      }
      return;
    }
  });

  if (mode === "confirm-entire") {
    return (
      <Box flexDirection="column" paddingX={2} alignItems="center" paddingY={4}>
        <Text color="#F4A261" bold>⚠ Scanning Entire Computer</Text>
        <Box marginTop={1} width={56}>
          <Text color="#8D99AE">
            This will scan all connected drives and mounted volumes. Depending on
            the size of your drives, this may take a very long time and consume
            significant system resources.
          </Text>
        </Box>
        {drives.length > 0 && (
          <Box marginTop={1} width={56}>
            <Text color="#6C757D">
              Detected drives ({drives.length}): {driveList}
            </Text>
          </Box>
        )}
        <Box marginTop={2}>
          <Text color="#E2DCC8">Are you sure you want to continue?</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="#D4A017">Enter Continue</Text>
          <Text color="#6C757D">  ·  </Text>
          <Text color="#8D99AE">Esc Cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Header tagline="Choose what to analyze" />

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#D4A017"
        paddingX={1}
        marginBottom={1}
        width={60}
      >
        <Text bold color="#D4A017">
          {" "}Analyze Scope{" "}
        </Text>
        <Box marginTop={1} flexDirection="column">
          {OPTIONS.map((opt, i) => (
            <Text key={opt.id}>
              <Text color={i === selected ? "#D4A017" : "transparent"}>
                {i === selected ? "▸ " : "  "}
              </Text>
              <Text color={i === selected ? "#D4A017" : "#8D99AE"} bold={i === selected}>
                {opt.label.padEnd(18)}
              </Text>
              <Text color="#6C757D"> {opt.description}</Text>
            </Text>
          ))}
        </Box>
      </Box>

      <Box justifyContent="space-between" width={60}>
        <Text color="#6C757D">◈ repoinsight</Text>
        <Text color="#8D99AE">↑↓ · Enter · Esc Back</Text>
      </Box>
    </Box>
  );
}