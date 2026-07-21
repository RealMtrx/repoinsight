import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { AnalysisCache } from "../../src/core/Cache.js";

function createFixture(): { root: string; cache: AnalysisCache } {
  const root = mkdtempSync(join(tmpdir(), "cache-test-"));
  mkdirSync(join(root, ".git"));
  const cache = new AnalysisCache(root);
  return { root, cache };
}

function writeFile(dir: string, name: string, content = ""): string {
  const fp = join(dir, name);
  writeFileSync(fp, content);
  return fp;
}

describe("AnalysisCache", () => {
  let root: string;
  let cache: AnalysisCache;

  beforeEach(() => {
    const f = createFixture();
    root = f.root;
    cache = f.cache;
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe("set/get roundtrip", () => {
    it("stores and retrieves a string value", () => {
      const fp = writeFile(root, "test.txt", "hello");
      const stat = { mtimeMs: 1000, size: 5 };
      cache.set(fp, stat.mtimeMs, stat.size, "key1", "hello world");
      expect(cache.get(fp, stat.mtimeMs, stat.size, "key1")).toBe("hello world");
    });

    it("stores and retrieves a number value", () => {
      const fp = writeFile(root, "data.json", JSON.stringify({ a: 1 }));
      const stat = { mtimeMs: 2000, size: 10 };
      cache.set(fp, stat.mtimeMs, stat.size, "count", 42);
      expect(cache.get(fp, stat.mtimeMs, stat.size, "count")).toBe(42);
    });

    it("stores and retrieves an object value", () => {
      const fp = writeFile(root, "config.json", "{}");
      const stat = { mtimeMs: 3000, size: 2 };
      const obj = { name: "test", version: 1 };
      cache.set(fp, stat.mtimeMs, stat.size, "data", obj);
      expect(cache.get(fp, stat.mtimeMs, stat.size, "data")).toEqual(obj);
    });

    it("returns null for a missing key", () => {
      const fp = writeFile(root, "test.txt", "hello");
      const stat = { mtimeMs: 1000, size: 5 };
      expect(cache.get(fp, stat.mtimeMs, stat.size, "nonexistent")).toBeNull();
    });

    it("returns null for a missing file", () => {
      const fp = join(root, "missing.txt");
      expect(cache.get(fp, 1000, 5, "key")).toBeNull();
    });

    it("stores multiple keys for the same file", () => {
      const fp = writeFile(root, "multi.txt", "data");
      const stat = { mtimeMs: 1000, size: 4 };
      cache.set(fp, stat.mtimeMs, stat.size, "a", 1);
      cache.set(fp, stat.mtimeMs, stat.size, "b", 2);
      expect(cache.get(fp, stat.mtimeMs, stat.size, "a")).toBe(1);
      expect(cache.get(fp, stat.mtimeMs, stat.size, "b")).toBe(2);
    });

    it("overwrites an existing key", () => {
      const fp = writeFile(root, "overwrite.txt", "data");
      const stat = { mtimeMs: 1000, size: 4 };
      cache.set(fp, stat.mtimeMs, stat.size, "key", "old");
      cache.set(fp, stat.mtimeMs, stat.size, "key", "new");
      expect(cache.get(fp, stat.mtimeMs, stat.size, "key")).toBe("new");
    });
  });

  describe("cache invalidation", () => {
    it("invalidates when mtime changes", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "key", "value");
      expect(cache.get(fp, 2000, 5, "key")).toBeNull();
    });

    it("invalidates when size changes", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "key", "value");
      expect(cache.get(fp, 1000, 10, "key")).toBeNull();
    });

    it("invalidates when both mtime and size change", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "key", "value");
      expect(cache.get(fp, 2000, 10, "key")).toBeNull();
    });

    it("does not invalidate when mtime and size match", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "key", "value");
      expect(cache.get(fp, 1000, 5, "key")).toBe("value");
    });

    it("invalidated entry returns null on subsequent get", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "key", "value");
      const result = cache.get(fp, 2000, 10, "key");
      expect(result).toBeNull();
    });
  });

  describe("invalidate", () => {
    it("removes a specific file from cache", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "key", "value");
      cache.invalidate(fp);
      expect(cache.get(fp, 1000, 5, "key")).toBeNull();
    });

    it("does not throw when invalidating a non-cached file", () => {
      const fp = join(root, "nonexistent.txt");
      expect(() => cache.invalidate(fp)).not.toThrow();
    });

    it("only removes the specified file", () => {
      const fp1 = writeFile(root, "a.txt", "a");
      const fp2 = writeFile(root, "b.txt", "b");
      cache.set(fp1, 1000, 1, "k", "v1");
      cache.set(fp2, 1000, 1, "k", "v2");
      cache.invalidate(fp1);
      expect(cache.get(fp1, 1000, 1, "k")).toBeNull();
      expect(cache.get(fp2, 1000, 1, "k")).toBe("v2");
    });
  });

  describe("clear", () => {
    it("removes all cached entries", () => {
      const fp1 = writeFile(root, "a.txt", "a");
      const fp2 = writeFile(root, "b.txt", "b");
      cache.set(fp1, 1000, 1, "k", "v1");
      cache.set(fp2, 1000, 1, "k", "v2");
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get(fp1, 1000, 1, "k")).toBeNull();
      expect(cache.get(fp2, 1000, 1, "k")).toBeNull();
    });

    it("resets to empty store", () => {
      cache.set(writeFile(root, "a.txt", "a"), 1000, 1, "k", "v");
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe("flush", () => {
    it("writes cache to disk", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "key", "value");
      cache.flush();
      const cacheFile = join(root, ".repoinsight-cache.json");
      const content = require("fs").readFileSync(cacheFile, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed.version).toBe(1);
      expect(parsed.files).toBeDefined();
    });

    it("creates the cache file on disk", () => {
      const cacheFile = join(root, ".repoinsight-cache.json");
      cache.set(writeFile(root, "x.txt", "x"), 1000, 1, "k", "v");
      cache.flush();
      expect(require("fs").existsSync(cacheFile)).toBe(true);
    });

    it("does not write when not dirty", () => {
      const cacheFile = join(root, ".repoinsight-cache.json");
      cache.flush();
      expect(require("fs").existsSync(cacheFile)).toBe(false);
    });
  });

  describe("size", () => {
    it("starts at 0", () => {
      expect(cache.size).toBe(0);
    });

    it("increments after set", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "k", "v");
      expect(cache.size).toBe(1);
    });

    it("reflects multiple files", () => {
      cache.set(writeFile(root, "a.txt", "a"), 1000, 1, "k", "v");
      cache.set(writeFile(root, "b.txt", "b"), 1000, 1, "k", "v");
      expect(cache.size).toBe(2);
    });

    it("returns null for invalidated entries", () => {
      const fp = writeFile(root, "test.txt", "hello");
      cache.set(fp, 1000, 5, "k", "v");
      cache.invalidate(fp);
      expect(cache.get(fp, 1000, 5, "k")).toBeNull();
    });
  });

  describe("cache persistence", () => {
    it("loads existing cache from disk", () => {
      const fp = writeFile(root, "persist.txt", "data");
      cache.set(fp, 1000, 4, "key", "stored");
      cache.flush();
      const cache2 = new AnalysisCache(root);
      expect(cache2.get(fp, 1000, 4, "key")).toBe("stored");
    });

    it("ignores cache with wrong version", () => {
      const cacheFile = join(root, ".repoinsight-cache.json");
      writeFileSync(cacheFile, JSON.stringify({ version: 99, createdAt: "now", files: {} }));
      const cache2 = new AnalysisCache(root);
      expect(cache2.size).toBe(0);
    });

    it("handles corrupted cache file gracefully", () => {
      const cacheFile = join(root, ".repoinsight-cache.json");
      writeFileSync(cacheFile, "not valid json{{");
      const cache2 = new AnalysisCache(root);
      expect(cache2.size).toBe(0);
    });
  });
});
