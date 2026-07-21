import { useEffect, useState, useRef } from "react";
import { Box, Text } from "ink";

const PHASES = [
  "Scanning file structure",
  "Analyzing dependencies",
  "Evaluating code quality",
  "Checking Git history",
  "Generating insights",
];

export function ProgressView() {
  const [t, setT] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setT((x) => x + 1), 100);
    return () => clearInterval(timer);
  }, []);

  const elapsed = ((Date.now() - startRef.current) / 1000).toFixed(1);
  const phaseIndex = Math.floor(t / 25) % PHASES.length;
  const dots = ".".repeat((t % 4) + 1);

  const barWidth = 36;
  const pos = ((t % 40) / 40) * (barWidth - 2);
  const before = Math.max(0, Math.floor(pos));
  const after = Math.max(0, barWidth - before - 1);

  return (
    <Box flexDirection="column" alignItems="center" paddingY={4}>
      <Text color="#D4A017" bold>
        ◈ Analyzing Repository
      </Text>
      <Box marginTop={1}>
        <Text color="#3D405B">{"─".repeat(before)}</Text>
        <Text color="#D4A017">◆</Text>
        <Text color="#3D405B">{"─".repeat(after)}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="#8D99AE">{PHASES[phaseIndex]}{dots}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color="#6C757D">elapsed {elapsed}s</Text>
      </Box>
    </Box>
  );
}
