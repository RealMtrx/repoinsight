import { useEffect, useState, useRef } from "react";
import { Box, Text } from "ink";
import { scopeIcon } from "../utils/detectTarget.js";
import type { AnalyzeTarget, MultiAnalysisResult } from "../types/index.js";

interface MultiProgressViewProps {
  targets: AnalyzeTarget[];
  onComplete: (results: MultiAnalysisResult[]) => void;
  onError: (error: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function MultiProgressView({
  targets,
  onComplete,
  onError,
}: MultiProgressViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<MultiAnalysisResult[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const runningRef = useRef(true);
  const resultsRef = useRef<MultiAnalysisResult[]>([]);
  const totalTargets = targets.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function runSequential() {
      const accumulated: MultiAnalysisResult[] = [];

      for (let i = 0; i < targets.length; i++) {
        if (!runningRef.current || cancelled) { break; }
        setCurrentIndex(i);
        const target = targets[i];
        if (!target?.enabled) { continue; }

        try {
          const mod = await import("../core/analyzer.js");
          const report = await mod.runAnalysis(target.path, {
            useCache: false,
            scopeType: target.type,
            targetPath: target.path,
          });
          if (!runningRef.current || cancelled) { break; }
          const result: MultiAnalysisResult = {
            path: target.path,
            type: target.type,
            name: report.projectName,
            report,
          };
          accumulated.push(result);
          resultsRef.current = accumulated;
          setResults([...accumulated]);
        } catch (err) {
          if (!runningRef.current || cancelled) { break; }
          const result: MultiAnalysisResult = {
            path: target.path,
            type: target.type,
            name: target.path.split(/[\\/]/).pop() ?? target.path,
            report: null as unknown as never,
            error: err instanceof Error ? err.message : "Analysis failed",
          };
          accumulated.push(result);
          resultsRef.current = accumulated;
          setResults([...accumulated]);
        }
      }
      if (!cancelled) {
        onComplete(resultsRef.current);
      }
    }

    runSequential().catch((err: unknown) => {
      if (!cancelled) {
        onError(err instanceof Error ? err.message : "Unexpected error");
      }
    });

    return () => { cancelled = true; };
  }, []);

  const completedCount = results.length;
  const scanning = completedCount < totalTargets;
  const headerNum = scanning ? completedCount + 1 : totalTargets;
  const remaining = scanning ? totalTargets - headerNum : 0;
  const currentTarget = targets[currentIndex];

  const avgTimePerItem = completedCount > 0 ? elapsed / completedCount : 0;
  const eta = avgTimePerItem * remaining;

  return (
    <Box flexDirection="column" alignItems="center" paddingY={3}>
      <Text color="#D4A017" bold>
        Scanning ({headerNum} / {totalTargets})
      </Text>

      {scanning && currentTarget && (
        <Box flexDirection="column" alignItems="center" marginTop={1}>
          <Text color="#8D99AE">Current</Text>
          <Text>
            <Text>{scopeIcon(currentTarget.type)} </Text>
            <Text color="#E2DCC8" bold>
              {currentTarget.path.split(/[\\/]/).pop()}
            </Text>
          </Text>
        </Box>
      )}

      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Text>
          <Text color="#8D99AE">Remaining  </Text>
          <Text color={remaining > 0 ? "#F4A261" : "#52B788"}>{remaining}</Text>
        </Text>
        <Text>
          <Text color="#8D99AE">Elapsed    </Text>
          <Text color="#64B5F6">{formatTime(elapsed)}</Text>
        </Text>
        {scanning && eta > 0 && (
          <Text>
            <Text color="#8D99AE">ETA        </Text>
            <Text color="#64B5F6">{formatTime(eta)}</Text>
          </Text>
        )}
      </Box>

      {results.length > 0 && (
        <Box marginTop={2} flexDirection="column" width={60}>
          <Text color="#6C757D">  Results so far:</Text>
          {results.map((r, i) => (
            <Text key={i}>
              <Text color={r.error ? "#E63946" : "#52B788"}>
                {r.error ? "✗" : "✓"}
              </Text>
              <Text color="#8D99AE"> {scopeIcon(r.type)} </Text>
              <Text color={r.error ? "#E63946" : "#8D99AE"}>
                {r.name || r.path.split(/[\\/]/).pop()}
              </Text>
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}