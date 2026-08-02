import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { findCacheFile } from "../../src/commands/cache.js";

describe("cache command helpers", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "cache-cmd-test-"));
    mkdirSync(join(root, ".git"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("findCacheFile returns the cache path when present", () => {
    const fp = join(root, ".repoinsight-cache.json");
    writeFileSync(fp, "{}");
    expect(findCacheFile(root)).toBe(fp);
  });

  it("findCacheFile returns null when absent", () => {
    expect(findCacheFile(root)).toBeNull();
  });

  it("findCacheFile resolves relative directories", () => {
    const fp = join(root, ".repoinsight-cache.json");
    writeFileSync(fp, "{}");
    expect(findCacheFile(root)).toBe(fp);
    expect(existsSync(fp)).toBe(true);
  });
});