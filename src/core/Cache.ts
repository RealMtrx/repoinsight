import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, relative } from "path";

interface CacheEntry {
  mtimeMs: number;
  size: number;
  data: Record<string, unknown>;
}

interface CacheStore {
  version: number;
  createdAt: string;
  files: Record<string, CacheEntry>;
}

const CACHE_VERSION = 2;
const CACHE_FILE = ".repoinsight-cache.json";

export class AnalysisCache {
  private store: CacheStore;
  private dirty = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private rootPath: string) {
    this.store = this.load();
  }

  get(filePath: string, mtimeMs: number, size: number, key: string): unknown {
    const relPath = relative(this.rootPath, filePath).replace(/\\/g, "/");
    const entry = this.store.files[relPath];
    if (!entry) {
      return null;
    }
    if (entry.mtimeMs !== mtimeMs || entry.size !== size) {
      this.removeEntry(relPath);
      this.dirty = true;
      return null;
    }
    const val = entry.data[key];
    return val !== undefined ? val : null;
  }

  set(filePath: string, mtimeMs: number, size: number, key: string, value: unknown): void {
    const relPath = relative(this.rootPath, filePath).replace(/\\/g, "/");
    let entry = this.store.files[relPath];
    if (!entry) {
      entry = { mtimeMs, size, data: {} };
      this.store.files[relPath] = entry;
    } else {
      entry.mtimeMs = mtimeMs;
      entry.size = size;
    }
    entry.data[key] = value;
    this.dirty = true;
    this.scheduleFlush();
  }

  invalidate(filePath: string): void {
    const relPath = relative(this.rootPath, filePath).replace(/\\/g, "/");
    if (this.store.files[relPath]) {
      this.removeEntry(relPath);
      this.dirty = true;
      this.scheduleFlush();
    }
  }

  clear(): void {
    this.store = { version: CACHE_VERSION, createdAt: new Date().toISOString(), files: {} };
    this.dirty = true;
    this.flush();
  }

  get size(): number {
    return Object.keys(this.store.files).length;
  }

  private removeEntry(relPath: string): void {
    const next: Record<string, CacheEntry> = {};
    for (const key of Object.keys(this.store.files)) {
      if (key !== relPath) {
        const entry = this.store.files[key];
        if (entry) {
          next[key] = entry;
        }
      }
    }
    this.store.files = next;
  }

  private load(): CacheStore {
    const fp = join(this.rootPath, CACHE_FILE);
    try {
      if (existsSync(fp)) {
        const raw = readFileSync(fp, "utf-8");
        const parsed = JSON.parse(raw) as CacheStore;
        if (parsed.version === CACHE_VERSION) {
          const clean: Record<string, CacheEntry> = {};
          for (const [k, v] of Object.entries(parsed.files)) {
            if (v !== null) {
              clean[k] = v;
            }
          }
          parsed.files = clean;
          return parsed;
        }
      }
    } catch {
      /* corrupted cache */
    }
    return { version: CACHE_VERSION, createdAt: new Date().toISOString(), files: {} };
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    this.flushTimer = setTimeout(() => this.flush(), 2000);
  }

  flush(): void {
    if (!this.dirty) {
      return;
    }
    try {
      const cacheDir = dirname(join(this.rootPath, CACHE_FILE));
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }
      writeFileSync(join(this.rootPath, CACHE_FILE), JSON.stringify(this.store), "utf-8");
      this.dirty = false;
    } catch {
      /* write failed — skip */
    }
  }
}
