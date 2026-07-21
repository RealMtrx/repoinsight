import { useEffect, useState, useRef } from "react";
import { Box, Text } from "ink";
import { createSpinnerFrames } from "./Progress.js";

export function ProgressView() {
  const [t, setT] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setT((x) => x + 1), 80);
    return () => clearInterval(timer);
  }, []);

  const barWidth = 40;
  const pos = ((t % 50) / 50) * (barWidth - 2);
  const before = Math.max(0, Math.floor(pos));
  const after = Math.max(0, barWidth - before - 1);
  const elapsed = ((Date.now() - startRef.current) / 1000).toFixed(1);
  const frame = createSpinnerFrames()[t % 4];

  return (
    <Box flexDirection="column" alignItems="center" paddingY={3}>
      <Text color="#D4A017" bold>
        {frame} Analyzing Repository
      </Text>
      <Box marginTop={1}>
        <Text color="#3D405B">{"─".repeat(before)}</Text>
        <Text color="#D4A017">◇</Text>
        <Text color="#3D405B">{"─".repeat(after)}</Text>
      </Box>
      <Box
        marginTop={1}
        flexDirection="column"
        alignItems="center"
      >
        <Text color="#6C757D">Scanning codebase for insights...</Text>
        <Text color="#8D99AE">Elapsed: {elapsed}s</Text>
      </Box>
    </Box>
  );
}
