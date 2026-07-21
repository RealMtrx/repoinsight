import { useState, useEffect, useCallback } from "react";
import { useInput, useApp } from "ink";
import { Dashboard } from "./Dashboard.js";
import { ProgressView } from "./ProgressView.js";
import { ResultsView } from "./ResultsView.js";
import { StatsView } from "./StatsView.js";
import { TUIErrorBoundary } from "./ErrorBoundary.js";
import { Detector } from "../detection/index.js";
import type { AnalysisReport, DetectedTechnologies } from "../types/index.js";
import type { MenuItem } from "./actions.js";

type View = "dashboard" | "progress" | "results" | "stats";

const menuItems: MenuItem[] = [
  {
    id: "analyze",
    label: "analyze",
    description: "Run full repository analysis",
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

  const [paletteVisible, setPaletteVisible] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);

  const [isRunning, setIsRunning] = useState(false);

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
    setStatusMessage("Ready");
    setResultsSection(0);
  }, []);

  const runAnalysis = useCallback(async (targetView: View, statusMsg: string) => {
    setView("progress");
    setIsRunning(true);
    setStatusMessage(statusMsg);
    try {
      const mod = await import("../core/analyzer.js");
      const result = await mod.runAnalysis(directory, { useCache: false });
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
  }, [directory]);

  const executeCommand = useCallback(async (id: string) => {
    if (id === "analyze" || id === "inspect" || id === "report") {
      await runAnalysis("results", "Analyzing...");
    } else if (id === "stats") {
      await runAnalysis("stats", "Gathering stats...");
    } else if (id === "doctor" || id === "checkup") {
      await runAnalysis("results", "Running diagnostics...");
    }
  }, [runAnalysis]);

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
    if (!paletteQuery) {return menuItems;}
    const q = paletteQuery.toLowerCase();
    return menuItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  }, [paletteQuery]);

  useInput(
    (input, key) => {
      if (isRunning) {return;}

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

      if (key.escape || input === "q" || input === "Q") {
        if (view === "results" || view === "stats") {
          goToDashboard();
        } else {
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
          if (cmd) {void executeCommand(cmd.id);}
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
          const next = (menuIndex + 1) % menuItems.length;
          setMenuIndex(next);
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

  return (
    <TUIErrorBoundary>
      {view === "progress" && <ProgressView />}
      {view === "results" && report && (
        <ResultsView report={report} section={resultsSection} />
      )}
      {view === "stats" && report && <StatsView report={report} />}
      {view === "dashboard" && (
        <Dashboard
          directory={directory}
          tech={tech}
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
      )}
    </TUIErrorBoundary>
  );
}
