import { useState, useEffect, useCallback } from "react";
import { useInput, useApp } from "ink";
import { Dashboard } from "./Dashboard.js";
import { AnalyzeScopeScreen } from "./AnalyzeScopeScreen.js";
import { PathManagerScreen } from "./PathManagerScreen.js";
import { ProgressView } from "./ProgressView.js";
import { MultiProgressView } from "./MultiProgressView.js";
import { ResultsView } from "./ResultsView.js";
import { MultiResultsView } from "./MultiResultsView.js";
import { StatsView } from "./StatsView.js";
import { TUIErrorBoundary } from "./ErrorBoundary.js";
import { Detector } from "../detection/index.js";
import { detectTarget } from "../utils/detectTarget.js";
import { getSystemTargets } from "../utils/getSystemDrives.js";
import type {
  AnalysisReport,
  DetectedTechnologies,
  AnalysisScope,
  AnalyzeTarget,
  MultiAnalysisResult,
  MultiAnalysisSummary,
} from "../types/index.js";
import type { MenuItem } from "./actions.js";

type View =
  | "dashboard"
  | "analyze-scope"
  | "path-manager"
  | "progress"
  | "multi-progress"
  | "results"
  | "multi-results"
  | "stats";

const menuItems: MenuItem[] = [
  {
    id: "analyze",
    label: "analyze",
    description: "Analyze scope — file, directory, or full system",
    category: "Commands",
  },
  {
    id: "doctor",
    label: "doctor",
    description: "Run repository diagnostics",
    category: "Commands",
  },
  {
    id: "report",
    label: "report",
    description: "Show terminal report",
    category: "Reports",
  },
  {
    id: "stats",
    label: "stats",
    description: "Show quick statistics",
    category: "Reports",
  },
];

export default function App() {
  const { exit } = useApp();
  const directory = process.cwd();

  const [view, setView] = useState<View>("dashboard");
  const [menuIndex, setMenuIndex] = useState(0);
  const [tech, setTech] = useState<DetectedTechnologies | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [resultsSection, setResultsSection] = useState(0);
  const [analysisScope, setAnalysisScope] = useState<AnalysisScope>(() => detectTarget(directory));

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);

  const [isRunning, setIsRunning] = useState(false);

  const [targets, setTargets] = useState<AnalyzeTarget[]>([]);
  const [multiResults, setMultiResults] = useState<MultiAnalysisSummary | null>(null);

  useEffect(() => {
    try {
      const detector = new Detector(directory);
      setTech(detector.detect());
    } catch {
      setTech(null);
    }
  }, [directory]);

  const goToDashboard = useCallback(() => {
    setView("dashboard");
    setReport(null);
    setMultiResults(null);
    setTargets([]);
    setStatusMessage("Ready");
    setResultsSection(0);
  }, []);

  const buildMultiSummary = useCallback((results: MultiAnalysisResult[]): MultiAnalysisSummary => {
    const finished = results.filter((r) => r.report && !r.error);
    const totalFiles = finished.reduce((s, r) => s + (r.report?.fileCount ?? 0), 0);
    const repos = results.filter((r) => r.type === "repository").length;
    const dirs = results.filter((r) => r.type === "directory").length;
    const files = results.filter((r) => r.type === "file").length;
    const scores = finished.map((r) => r.report?.score ?? 0).filter((s) => s > 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    let best: MultiAnalysisSummary["bestProject"] = null;
    let worst: MultiAnalysisSummary["worstProject"] = null;
    for (const r of finished) {
      if (!r.report) {
        continue;
      }
      const name = r.name ?? r.path.split(/[\\/]/).pop() ?? r.path;
      if (!best || (r.report.score ?? 0) > best.score) {
        best = { name, score: r.report.score ?? 0 };
      }
      if (!worst || (r.report.score ?? 0) < worst.score) {
        worst = { name, score: r.report.score ?? 0 };
      }
    }

    return {
      results,
      totalTargets: results.length,
      totalFiles,
      repositories: repos,
      directories: dirs,
      files,
      averageScore: Math.round(avg),
      bestProject: best,
      worstProject: worst && worst.name !== best?.name ? worst : null,
    };
  }, []);

  const runAnalysis = useCallback(
    async (targetView: View, statusMsg: string) => {
      setView("progress");
      setIsRunning(true);
      setStatusMessage(statusMsg);
      const scope = detectTarget(directory);
      setAnalysisScope(scope);
      try {
        const mod = await import("../core/analyzer.js");
        const result = await mod.runAnalysis(directory, {
          useCache: false,
          scopeType: scope.type,
          targetPath: scope.targetPath,
        });
        setReport(result);
        setView(targetView);
        setResultsSection(0);
        setStatusMessage("Complete");
      } catch {
        setView("dashboard");
        setStatusMessage(`${statusMsg} failed`);
      } finally {
        setIsRunning(false);
      }
    },
    [directory],
  );

  const executeCommand = useCallback(
    async (id: string) => {
      if (id === "report") {
        await runAnalysis("results", "Analyzing...");
      } else if (id === "stats") {
        await runAnalysis("stats", "Gathering stats...");
      } else if (id === "doctor" || id === "checkup") {
        await runAnalysis("results", "Running diagnostics...");
      } else if (id === "analyze" || id === "inspect") {
        setView("analyze-scope");
      }
    },
    [runAnalysis],
  );

  const handleMultiComplete = useCallback(
    (results: MultiAnalysisResult[]) => {
      const summary = buildMultiSummary(results);
      setMultiResults(summary);
      setView("multi-results");
      setStatusMessage("Complete");
      setIsRunning(false);
    },
    [buildMultiSummary],
  );

  const handleMultiError = useCallback((error: string) => {
    setStatusMessage(`Analysis failed: ${error}`);
    setView("dashboard");
    setIsRunning(false);
  }, []);

  const startEntireComputer = useCallback(() => {
    const drives = getSystemTargets();
    setTargets(drives);
    if (drives.length === 0) {
      setStatusMessage("No drives detected");
      setView("dashboard");
      return;
    }
    setIsRunning(true);
    setView("multi-progress");
  }, []);

  const startCustomPaths = useCallback(() => {
    setView("path-manager");
  }, []);

  const startMultiAnalysis = useCallback(() => {
    const enabled = targets.filter((t) => t.enabled);
    if (enabled.length === 0) {
      return;
    }
    setIsRunning(true);
    setView("multi-progress");
  }, [targets]);

  const openPalette = useCallback(() => {
    setPaletteVisible(true);
    setPaletteQuery("");
    setPaletteIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setPaletteVisible(false);
    setPaletteQuery("");
  }, []);

  const getFilteredPalette = useCallback(() => {
    if (!paletteQuery) {
      return menuItems;
    }
    const q = paletteQuery.toLowerCase();
    return menuItems.filter(
      (item) => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
    );
  }, [paletteQuery]);

  useInput(
    (input, key) => {
      if (isRunning) {
        return;
      }

      if (paletteVisible) {
        if (key.escape) {
          if (paletteQuery) {
            setPaletteQuery("");
            setPaletteIndex(0);
          } else {
            closePalette();
          }
          return;
        }
        if (key.return) {
          const filtered = getFilteredPalette();
          const selected = filtered[paletteIndex];
          if (selected) {
            closePalette();
            void executeCommand(selected.id);
          }
          return;
        }
        if (key.upArrow) {
          setPaletteIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (key.downArrow) {
          const filtered = getFilteredPalette();
          setPaletteIndex((i) => Math.min(filtered.length - 1, i + 1));
          return;
        }
        if (key.backspace || key.delete) {
          setPaletteQuery((q) => q.slice(0, -1));
          setPaletteIndex(0);
          return;
        }
        if (input?.length === 1 && !key.ctrl && !key.meta) {
          setPaletteQuery((q) => q + input);
          setPaletteIndex(0);
          return;
        }
        return;
      }

      if (key.ctrl && input === "c") {
        exit();
        return;
      }

      if (input === "q" || input === "Q") {
        if (view === "results" || view === "stats" || view === "multi-results") {
          goToDashboard();
        } else {
          exit();
        }
        return;
      }

      if (key.escape) {
        if (view === "results" || view === "stats" || view === "multi-results") {
          goToDashboard();
        } else if (view === "dashboard") {
          exit();
        }
        return;
      }

      if (key.ctrl && input === "k") {
        if (view === "dashboard") {
          openPalette();
        }
        return;
      }

      if (view === "dashboard") {
        if (key.return) {
          const cmd = menuItems[menuIndex];
          if (cmd) {
            void executeCommand(cmd.id);
          }
          return;
        }
        if (key.upArrow) {
          setMenuIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (key.downArrow) {
          setMenuIndex((i) => Math.min(menuItems.length - 1, i + 1));
          return;
        }
        if (key.tab) {
          setMenuIndex((i) => (i + 1) % menuItems.length);
          return;
        }
        if (key.pageUp) {
          setMenuIndex(0);
          return;
        }
        if (key.pageDown) {
          setMenuIndex(menuItems.length - 1);
          return;
        }
        if (input === "r" || input === "R") {
          try {
            const detector = new Detector(directory);
            setTech(detector.detect());
            setAnalysisScope(detectTarget(directory));
            setStatusMessage("Re-scanned");
          } catch {
            setStatusMessage("Re-scan failed");
          }
          return;
        }
      }

      if (view === "results") {
        if (key.rightArrow || key.downArrow) {
          setResultsSection((i) => Math.min(5, i + 1));
          return;
        }
        if (key.leftArrow || key.upArrow) {
          setResultsSection((i) => Math.max(0, i - 1));
          return;
        }
        if (key.pageUp) {
          setResultsSection(0);
          return;
        }
        if (key.pageDown) {
          setResultsSection(5);
          return;
        }
      }
    },
    { isActive: !isRunning },
  );

  const renderView = () => {
    switch (view) {
      case "progress":
        return <ProgressView scope={analysisScope} />;
      case "multi-progress":
        return (
          <MultiProgressView
            targets={targets.filter((t) => t.enabled)}
            onComplete={handleMultiComplete}
            onError={handleMultiError}
          />
        );
      case "results":
        return report ? <ResultsView report={report} section={resultsSection} /> : null;
      case "multi-results":
        return multiResults ? (
          <MultiResultsView summary={multiResults} onBack={goToDashboard} />
        ) : null;
      case "stats":
        return report ? <StatsView report={report} /> : null;
      case "analyze-scope":
        return (
          <AnalyzeScopeScreen
            onSelectEntireComputer={startEntireComputer}
            onSelectCustomPaths={startCustomPaths}
            onBack={goToDashboard}
          />
        );
      case "path-manager":
        return (
          <PathManagerScreen
            targets={targets}
            onTargetsChange={setTargets}
            onStart={startMultiAnalysis}
            onBack={() => setView("analyze-scope")}
          />
        );
      default:
        return (
          <Dashboard
            directory={directory}
            tech={tech}
            scope={analysisScope}
            menuItems={menuItems}
            selectedIndex={menuIndex}
            statusMessage={statusMessage}
            paletteVisible={paletteVisible}
            paletteQuery={paletteQuery}
            paletteIndex={paletteIndex}
            paletteItems={getFilteredPalette()}
            onPaletteClose={closePalette}
            onPaletteSelect={(id) => {
              closePalette();
              void executeCommand(id);
            }}
          />
        );
    }
  };

  return <TUIErrorBoundary>{renderView()}</TUIErrorBoundary>;
}
