import { describe, it, expect } from "vitest";
import { isVersionInRange, rangesOverlap, compareVersions } from "../../src/utils/versions.js";

describe("versions", () => {
  describe("compareVersions", () => {
    it("compares numeric versions", () => {
      expect(compareVersions([1, 0, 0], [2, 0, 0])).toBe(-1);
      expect(compareVersions([2, 0, 0], [2, 0, 0])).toBe(0);
      expect(compareVersions([2, 1, 0], [2, 0, 9])).toBe(1);
    });
  });

  describe("isVersionInRange", () => {
    it("handles <, <=, >=, >", () => {
      expect(isVersionInRange("4.17.16", "<4.17.21")).toBe(true);
      expect(isVersionInRange("4.17.21", "<4.17.21")).toBe(false);
      expect(isVersionInRange("4.17.21", "<=4.17.21")).toBe(true);
      expect(isVersionInRange("4.17.22", "<=4.17.21")).toBe(false);
      expect(isVersionInRange("4.17.21", ">=4.17.16")).toBe(true);
      expect(isVersionInRange("4.17.15", ">=4.17.16")).toBe(false);
      expect(isVersionInRange("4.17.25", ">4.17.21")).toBe(true);
      expect(isVersionInRange("4.17.21", ">4.17.21")).toBe(false);
    });

    it("handles caret ranges", () => {
      expect(isVersionInRange("1.5.0", "^1.0.0")).toBe(true);
      expect(isVersionInRange("1.9.9", "^1.0.0")).toBe(true);
      expect(isVersionInRange("2.0.0", "^1.0.0")).toBe(false);
      expect(isVersionInRange("0.2.9", "^0.2.0")).toBe(true);
      expect(isVersionInRange("0.3.0", "^0.2.0")).toBe(false);
    });

    it("handles tilde ranges", () => {
      expect(isVersionInRange("1.2.9", "~1.2.0")).toBe(true);
      expect(isVersionInRange("1.3.0", "~1.2.0")).toBe(false);
      expect(isVersionInRange("1.2.20", "~1.2.5")).toBe(true);
      expect(isVersionInRange("1.3.0", "~1.2.5")).toBe(false);
    });

    it("handles exact versions", () => {
      expect(isVersionInRange("1.2.3", "1.2.3")).toBe(true);
      expect(isVersionInRange("1.2.4", "1.2.3")).toBe(false);
    });

    it("handles wildcards", () => {
      expect(isVersionInRange("1.5.9", "1.x")).toBe(true);
      expect(isVersionInRange("2.0.0", "1.x")).toBe(false);
      expect(isVersionInRange("1.2.9", "1.2.x")).toBe(true);
      expect(isVersionInRange("1.3.0", "1.2.x")).toBe(false);
    });

    it("handles OR ranges", () => {
      expect(isVersionInRange("1.0.0", "<0.5.0 || >=2.0.0")).toBe(false);
      expect(isVersionInRange("2.5.0", "<0.5.0 || >=2.0.0")).toBe(true);
      expect(isVersionInRange("0.3.0", "<0.5.0 || >=2.0.0")).toBe(true);
    });

    it("handles combined constraints", () => {
      expect(isVersionInRange("4.17.18", ">=1.0.0 <5.0.0")).toBe(true);
      expect(isVersionInRange("6.0.0", ">=1.0.0 <5.0.0")).toBe(false);
      expect(isVersionInRange("7.5.3", ">=7.0.0 <7.5.2")).toBe(false);
      expect(isVersionInRange("7.5.1", ">=7.0.0 <7.5.2")).toBe(true);
    });
  });

  describe("rangesOverlap", () => {
    it("detects overlap", () => {
      expect(rangesOverlap("<4.17.21", ">=4.17.16 <4.18.0")).toBe(true);
      expect(rangesOverlap(">=4.17.21", ">=4.17.16 <4.18.0")).toBe(true);
    });

    it("rejects disjoint ranges", () => {
      expect(rangesOverlap(">=5.0.0", ">=4.17.16 <4.18.0")).toBe(false);
      expect(rangesOverlap("4.17.21", ">4.17.21")).toBe(false);
      expect(rangesOverlap("1.2.3", "<1.0.0 || >2.0.0")).toBe(false);
    });
  });
});
