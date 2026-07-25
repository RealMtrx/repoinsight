import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { Header } from "./Header.js";
import { detectTarget, scopeIcon } from "../utils/detectTarget.js";
import type { AnalyzeTarget } from "../types/index.js";

interface PathManagerScreenProps {
  targets: AnalyzeTarget[];
  onTargetsChange: (targets: AnalyzeTarget[]) => void;
  onStart: () => void;
  onBack: () => void;
}

type Mode = "browse" | "adding";

export function PathManagerScreen({
  targets,
  onTargetsChange,
  onStart,
  onBack,
}: PathManagerScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("browse");
  const [inputPath, setInputPath] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const addPath = useCallback((rawPath: string) => {
    const trimmed = rawPath.trim();
    if (!trimmed) {
      setInputError("Please enter a path");
      return;
    }
    try {
      const scope = detectTarget(trimmed);
      const exists = targets.some(
        (t) => t.path.toLowerCase() === scope.targetPath.toLowerCase(),
      );
      if (exists) {
        setInputError("This path is already in the list");
        return;
      }
      const newTarget: AnalyzeTarget = {
        path: scope.targetPath,
        type: scope.type,
        enabled: true,
      };
      onTargetsChange([...targets, newTarget]);
      setInputPath("");
      setInputError(null);
      setMode("browse");
      setSelectedIndex(targets.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("ENOENT") || message.includes("does not exist")) {
        setInputError("Path does not exist");
      } else if (message.includes("EACCES") || message.includes("permission")) {
        setInputError("Permission denied — cannot access this path");
      } else {
        setInputError(`Invalid path — ${message || "does not exist"}`);
      }
    }
  }, [targets, onTargetsChange]);

  const removeSelected = useCallback(() => {
    if (targets.length === 0 || selectedIndex >= targets.length) { return; }
    const updated = targets.filter((_, i) => i !== selectedIndex);
    onTargetsChange(updated);
    setSelectedIndex((i) => Math.min(i, updated.length - 1));
  }, [targets, selectedIndex, onTargetsChange]);

  const toggleSelected = useCallback(() => {
    if (targets.length === 0 || selectedIndex >= targets.length) { return; }
    const updated = targets.map((t, i) =>
      i === selectedIndex ? { ...t, enabled: !t.enabled } : t,
    );
    onTargetsChange(updated);
  }, [targets, selectedIndex, onTargetsChange]);

  const enabledCount = targets.filter((t) => t.enabled).length;

  useInput(
    (input, key) => {
      if (mode === "adding") {
        if (key.escape) {
          setMode("browse");
          setInputPath("");
          setInputError(null);
          return;
        }
        if (key.return) {
          addPath(inputPath);
          return;
        }
        if (key.backspace || key.delete) {
          setInputPath((p) => p.slice(0, -1));
          setInputError(null);
          return;
        }
        if (input?.length === 1 && !key.ctrl && !key.meta) {
          setInputPath((p) => p + input);
          setInputError(null);
          return;
        }
        return;
      }

      if (key.escape) {
        onBack();
        return;
      }

      if (key.return) {
        if (enabledCount === 0) { return; }
        onStart();
        return;
      }

      if (key.upArrow) {
        setSelectedIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex((i) => Math.min(targets.length - 1, i + 1));
        return;
      }
      if (key.pageUp) {
        setSelectedIndex(0);
        return;
      }
      if (key.pageDown) {
        setSelectedIndex(targets.length - 1);
        return;
      }

      const ch = input?.toLowerCase();
      if (ch === "a") {
        setMode("adding");
        setInputPath("");
        setInputError(null);
        return;
      }
      if (ch === "d") {
        removeSelected();
        return;
      }
      if (ch === " ") {
        toggleSelected();
        return;
      }
    },
  );

  if (mode === "adding") {
    return (
      <Box flexDirection="column" paddingX={2}>
        <Header tagline="Type a path and press Enter" />
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor="#D4A017"
          paddingX={1}
          paddingY={1}
          marginBottom={1}
          width={68}
        >
          <Text bold color="#D4A017">
            {" "}Add Path{" "}
          </Text>
          <Box marginTop={1}>
            <Text color="#8D99AE">  Path: </Text>
            <Text color="#E2DCC8">{inputPath}</Text>
            <Text color="#6C757D">█</Text>
          </Box>
          {inputError && (
            <Box marginTop={1}>
              <Text color="#E63946">  {inputError}</Text>
            </Box>
          )}
        </Box>
        <Text color="#6C757D">  Enter Confirm · Esc Cancel</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Header tagline="Add folders and repositories to analyze" />

      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="#2A9D8F"
        paddingX={1}
        marginBottom={1}
        width={68}
      >
        <Text bold color="#2A9D8F">
          {" "}Analysis Targets{" "}
        </Text>
        {targets.length === 0 ? (
          <Text color="#6C757D">  No paths added yet — press A to add one</Text>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            {targets.map((t, i) => {
              const isSelected = i === selectedIndex;
              const displayPath =
                t.path.length > 60 ? "..." + t.path.slice(-57) : t.path;
              return (
                <Text key={`${t.path}-${i}`}>
                  <Text color={isSelected ? "#D4A017" : "transparent"}>
                    {isSelected ? "▸ " : "  "}
                  </Text>
                  <Text color={t.enabled ? "#52B788" : "#6C757D"}>
                    {t.enabled ? "✓" : "○"}
                  </Text>
                  <Text color={isSelected ? "#E2DCC8" : t.enabled ? "#8D99AE" : "#6C757D"} bold={isSelected}>
                    {" "}{scopeIcon(t.type)}{" "}{displayPath}
                  </Text>
                </Text>
              );
            })}
          </Box>
        )}
      </Box>

      <Box justifyContent="space-between" width={68}>
        <Text color="#6C757D">{targets.length} target(s), {enabledCount} enabled</Text>
        <Text color="#8D99AE">
          A Add · D Remove · Space Toggle · Enter Start · Esc Back
        </Text>
      </Box>
    </Box>
  );
}