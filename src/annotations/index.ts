import path from "node:path";
import type { AnalysisReport } from "../types/index.js";

export type AnnotationLevel = "error" | "warning" | "notice";

export interface Annotation {
  level: AnnotationLevel;
  file: string | null;
  line?: number;
  title?: string;
  message: string;
}

function escapeProperty(value: string): string {
  return value
    .replace(/%/g, "%25")
    .replace(/\r/g, "%0D")
    .replace(/\n/g, "%0A")
    .replace(/:/g, "%3A")
    .replace(/,/g, "%2C");
}

function escapeMessage(value: string): string {
  return value.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
}

export function toAnnotationLine(annotation: Annotation): string {
  const properties: string[] = [];
  if (annotation.file) {
    properties.push(`file=${escapeProperty(annotation.file)}`);
  }
  if (annotation.line) {
    properties.push(`line=${annotation.line}`);
  }
  if (annotation.title) {
    properties.push(`title=${escapeProperty(annotation.title)}`);
  }
  const propertyPart = properties.length > 0 ? ` ${properties.join(",")}` : "";
  return `::${annotation.level}${propertyPart}::${escapeMessage(annotation.message)}`;
}

export function generateAnnotations(report: AnalysisReport, cwd?: string): Annotation[] {
  const annotations: Annotation[] = [];
  const root = cwd ?? process.cwd();

  const relative = (filePath: string): string => {
    const rel = path.relative(root, filePath).replace(/\\/g, "/");
    return rel.startsWith("..") ? filePath.replace(/\\/g, "/") : rel;
  };

  for (const secret of report.hardcodedSecrets) {
    annotations.push({
      level: "error",
      file: relative(secret.file),
      line: secret.line,
      title: "Hardcoded secret",
      message: `Hardcoded ${secret.type.replace(/-/g, " ")} detected; move it to environment variables`,
    });
  }

  for (const vuln of report.vulnerabilities) {
    annotations.push({
      level: vuln.severity === "critical" ? "error" : "warning",
      file: relative("package.json"),
      title: vuln.id,
      message: `${vuln.package} ${vuln.installedVersion} is vulnerable (${vuln.summary}); upgrade to ${vuln.patchedVersion}`,
    });
  }

  for (const issue of report.dependencyIssues) {
    if (issue.severity !== "critical") {
      continue;
    }
    annotations.push({
      level: "error",
      file: relative("package.json"),
      title: "Missing dependency",
      message: `${issue.name} is imported but not listed in package.json`,
    });
  }

  for (const comment of report.todoComments) {
    annotations.push({
      level: "notice",
      file: relative(comment.file),
      line: comment.line,
      title: comment.type,
      message: comment.text ? `TODO comment: ${comment.text}` : `TODO comment`,
    });
  }

  for (const cycle of report.circularImports) {
    annotations.push({
      level: "warning",
      file: relative(cycle.file),
      title: "Circular import",
      message: `Circular import chain: ${cycle.chain.join(" -> ")}`,
    });
  }

  return annotations;
}
