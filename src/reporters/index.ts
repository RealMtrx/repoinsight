import type { AnalysisReport, MultiAnalysisSummary, ReportFormat } from "../types/index.js";
import { TerminalReporter } from "./TerminalReporter.js";
import { JsonReporter } from "./JsonReporter.js";
import { MarkdownReporter } from "./MarkdownReporter.js";
import { HtmlReporter } from "./HtmlReporter.js";

export function renderReport(report: AnalysisReport, format: ReportFormat): string | void {
  switch (format) {
    case "terminal": {
      const reporter = new TerminalReporter();
      reporter.render(report);
      return;
    }
    case "json": {
      const reporter = new JsonReporter();
      return reporter.render(report);
    }
    case "markdown": {
      const reporter = new MarkdownReporter();
      return reporter.render(report);
    }
    case "html": {
      const reporter = new HtmlReporter();
      return reporter.render(report);
    }
  }
}

export function renderMultiReport(
  summary: MultiAnalysisSummary,
  format: ReportFormat,
): string | void {
  switch (format) {
    case "terminal": {
      const reporter = new TerminalReporter();
      reporter.renderMulti(summary);
      return;
    }
    case "json": {
      const reporter = new JsonReporter();
      return reporter.renderMulti(summary);
    }
    case "markdown": {
      const reporter = new MarkdownReporter();
      return reporter.renderMulti(summary);
    }
    case "html": {
      const reporter = new HtmlReporter();
      return reporter.renderMulti(summary);
    }
  }
}
