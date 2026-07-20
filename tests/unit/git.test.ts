import { describe, it, expect } from "vitest";
import {
  isGitRepository,
  getCommitCount,
  getBranchCount,
  getContributors,
} from "../../src/utils/git.js";

describe("git utils", () => {
  const repoPath = process.cwd();

  it("isGitRepository returns true for a git repo", () => {
    expect(isGitRepository(repoPath)).toBe(true);
  });

  it("isGitRepository returns false for a non-git directory", () => {
    const osTemp = process.env.TEMP || "/tmp";
    expect(isGitRepository(osTemp)).toBe(false);
  });

  it("getCommitCount returns a number", () => {
    const count = getCommitCount(repoPath);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("getBranchCount returns a number", () => {
    const count = getBranchCount(repoPath);
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("getContributors returns an array", () => {
    const contributors = getContributors(repoPath);
    expect(Array.isArray(contributors)).toBe(true);
    if (contributors.length > 0) {
      expect(contributors[0]).toHaveProperty("name");
      expect(contributors[0]).toHaveProperty("email");
      expect(contributors[0]).toHaveProperty("commitCount");
    }
  });

  it("getContributors handles non-git dir gracefully", () => {
    const osTemp = process.env.TEMP || "/tmp";
    const contributors = getContributors(osTemp);
    expect(Array.isArray(contributors)).toBe(true);
    expect(contributors.length).toBe(0);
  });
});
