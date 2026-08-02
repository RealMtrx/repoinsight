export type NumericVersion = [number, number, number];

/** Interval [low, high) where low is inclusive and high is exclusive. */
export interface VersionBounds {
  low: NumericVersion | null;
  high: NumericVersion | null;
}

const MAX_PART = 1_000_000;

function parseVersion(input: string): NumericVersion | null {
  const cleaned = input.trim().replace(/^[vV]/, "");
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(cleaned);
  if (!match) {
    return null;
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (!Number.isFinite(major) || !Number.isFinite(minor) || !Number.isFinite(patch)) {
    return null;
  }
  return [major, minor, patch];
}

export function compareVersions(a: NumericVersion, b: NumericVersion): number {
  for (let i = 0; i < 3; i++) {
    const av = a[i]!;
    const bv = b[i]!;
    if (av < bv) {
      return -1;
    }
    if (av > bv) {
      return 1;
    }
  }
  return 0;
}

function isLessThan(a: NumericVersion, b: NumericVersion): boolean {
  return compareVersions(a, b) < 0;
}

function isLessOrEqual(a: NumericVersion, b: NumericVersion): boolean {
  return compareVersions(a, b) <= 0;
}

function isGreaterThan(a: NumericVersion, b: NumericVersion): boolean {
  return compareVersions(a, b) > 0;
}

function bumpPatch([maj, min, pat]: NumericVersion): NumericVersion {
  if (pat === MAX_PART) {
    if (min === MAX_PART) {
      return [maj + 1, 0, 0];
    }
    return [maj, min + 1, 0];
  }
  return [maj, min, pat + 1];
}

function bumpMinor([maj, min, pat]: NumericVersion): NumericVersion {
  if (min === MAX_PART) {
    return [maj + 1, 0, 0];
  }
  void pat;
  return [maj, min + 1, 0];
}

function bumpMajor([maj]: NumericVersion): NumericVersion {
  return [maj + 1, 0, 0];
}

function caretBounds([maj, min, pat]: NumericVersion): VersionBounds {
  let high: NumericVersion;
  if (maj > 0) {
    high = bumpMajor([maj, min, pat]);
  } else if (min > 0) {
    high = bumpMinor([maj, min, pat]);
  } else {
    high = bumpPatch([maj, min, pat]);
  }
  return { low: [maj, min, pat], high };
}

function tildeBounds([maj, min, pat]: NumericVersion): VersionBounds {
  const high = min > 0 || pat > 0 ? bumpMinor([maj, min, pat]) : bumpMajor([maj, min, pat]);
  return { low: [maj, min, pat], high };
}

function wildcardBounds(input: string): VersionBounds | null {
  const cleaned = input.trim().replace(/^[vV]/, "");
  const parts = cleaned.split(".");
  const isNumeric = (p: string | undefined): boolean => p !== undefined && /^\d+$/.test(p);
  if (!isNumeric(parts[0]) || parts.length > 3) {
    return null;
  }
  const maj = Number(parts[0]!);
  if (!Number.isFinite(maj)) {
    return null;
  }
  const minor = parts[1];
  const patch = parts[2];
  if (minor === undefined && patch === undefined) {
    return null;
  }
  if ((minor === "x" || minor === "*") && (patch === undefined || patch === "x" || patch === "*")) {
    return { low: [maj, 0, 0], high: [maj + 1, 0, 0] };
  }
  if (isNumeric(minor) && (patch === "x" || patch === "*")) {
    return { low: [maj, Number(minor), 0], high: bumpMinor([maj, Number(minor), 0]) };
  }
  return null;
}

function opBounds(parsed: NumericVersion, op: string): VersionBounds {
  switch (op) {
    case ">=":
      return { low: parsed, high: null };
    case ">":
      return { low: bumpPatch(parsed), high: null };
    case "<=":
      return { low: null, high: bumpPatch(parsed) };
    case "<":
      return { low: null, high: parsed };
    case "~":
      return tildeBounds(parsed);
    case "^":
      return caretBounds(parsed);
    default:
      return { low: parsed, high: bumpPatch(parsed) };
  }
}

function narrowBounds(current: VersionBounds, part: VersionBounds): VersionBounds {
  const lows = [current.low, part.low].filter((b): b is NumericVersion => b !== null);
  const highs = [current.high, part.high].filter((b): b is NumericVersion => b !== null);
  const low = lows.length === 0 ? null : maxOf(lows);
  const high = highs.length === 0 ? null : minOf(highs);
  return { low, high };
}

function maxOf(versions: NumericVersion[]): NumericVersion {
  let best = versions[0]!;
  for (let i = 1; i < versions.length; i++) {
    const cand = versions[i]!;
    if (isGreaterThan(cand, best)) {
      best = cand;
    }
  }
  return best;
}

function minOf(versions: NumericVersion[]): NumericVersion {
  let best = versions[0]!;
  for (let i = 1; i < versions.length; i++) {
    const cand = versions[i]!;
    if (isLessThan(cand, best)) {
      best = cand;
    }
  }
  return best;
}

function boundsIntersect(a: VersionBounds, b: VersionBounds): boolean {
  const lowA = a.low;
  const highA = a.high;
  const lowB = b.low;
  const highB = b.high;

  if (lowA && highA && isLessOrEqual(highA, lowA)) {
    return false;
  }
  if (lowB && highB && isLessOrEqual(highB, lowB)) {
    return false;
  }
  if (lowA && highB && isLessOrEqual(highB, lowA)) {
    return false;
  }
  if (highA && lowB && isLessOrEqual(highA, lowB)) {
    return false;
  }
  return true;
}

function isWithinBounds(version: NumericVersion, bounds: VersionBounds): boolean {
  if (bounds.low && isLessThan(version, bounds.low)) {
    return false;
  }
  if (bounds.high && isLessOrEqual(bounds.high, version)) {
    return false;
  }
  return true;
}

function tokenizeGroup(group: string): string[] {
  return group.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
}

function groupToBounds(group: string): VersionBounds | null {
  const tokens = tokenizeGroup(group);
  if (tokens.length === 0) {
    return null;
  }
  const parts: VersionBounds[] = [];

  for (const token of tokens) {
    if (!token) {
      continue;
    }
    const comparatorTokens = token.split(/[,\s]+/).filter(Boolean);
    for (const comparator of comparatorTokens) {
      const hyphenParts = comparator.split("-");
      if (hyphenParts.length === 2 && hyphenParts[0] && hyphenParts[1]) {
        const lower = parseVersion(hyphenParts[0]);
        const upper = parseVersion(hyphenParts[1]);
        if (lower && upper) {
          parts.push({ low: lower, high: bumpPatch(upper) });
          continue;
        }
      }
      const opMatch = /^(>=|>|<=|<|\^|~|=)?(.+)$/.exec(comparator);
      if (!opMatch) {
        continue;
      }
      const op = opMatch[1] ?? "=";
      const value = opMatch[2] ?? "";
      const wild = wildcardBounds(value);
      if (wild) {
        parts.push(wild);
        continue;
      }
      const parsed = parseVersion(value);
      if (!parsed) {
        continue;
      }
      parts.push(opBounds(parsed, op));
    }
  }

  if (parts.length === 0) {
    return null;
  }
  let result: VersionBounds = { low: null, high: null };
  for (const part of parts) {
    result = narrowBounds(result, part);
  }
  if (result.low && result.high && isLessOrEqual(result.high, result.low)) {
    return null;
  }
  return result;
}

export function rangeToBounds(range: string): VersionBounds[] {
  const groups = range.trim().split(/\s*\|\|\s*/);
  return groups.map(groupToBounds).filter((b): b is VersionBounds => b !== null);
}

export function isVersionInRange(version: string, range: string): boolean {
  const parsed = parseVersion(version);
  if (!parsed) {
    return false;
  }
  const boundsList = rangeToBounds(range);
  if (boundsList.length === 0) {
    return false;
  }
  return boundsList.some((bounds) => isWithinBounds(parsed, bounds));
}

export function rangesOverlap(a: string, b: string): boolean {
  return rangeToBounds(a).some((boundsA) =>
    rangeToBounds(b).some((boundsB) => boundsIntersect(boundsA, boundsB)),
  );
}
